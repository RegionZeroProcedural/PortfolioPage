export async function initGlassRenderer() {
  const targets = [...document.querySelectorAll(".gpu-liquid")].filter(
    (target) => !target.parentElement?.closest(".gpu-liquid")
  );

  if (!targets.length) {
    console.warn("No usable .gpu-liquid elements found.");
    return;
  }

  const renderer = new LiquidGlassRenderer(targets);
  renderer.init();
}

class LiquidGlassRenderer {
  constructor(targets) {
    this.targets = targets;
    this.items = [];

    this.mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      tx: window.innerWidth / 2,
      ty: window.innerHeight / 2
    };
  }

  init() {
    this.targets.forEach((target) => {
      const canvas = document.createElement("canvas");
      canvas.className = "liquid-refraction-canvas";
      target.prepend(canvas);

      const gl =
        canvas.getContext("webgl2", {
          alpha: true,
          antialias: true
        }) ||
        canvas.getContext("webgl", {
          alpha: true,
          antialias: true,
          premultipliedAlpha: false
        });

      if (!gl) {
        console.warn("WebGL unavailable for liquid glass.");
        canvas.remove();
        return;
      }

      const program = this.createProgram(gl);
      const buffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          0, 0,
          1, 0,
          0, 1,
          0, 1,
          1, 0,
          1, 1
        ]),
        gl.STATIC_DRAW
      );

      this.items.push({
        target,
        canvas,
        gl,
        program,
        buffer,
        locations: {
          position: gl.getAttribLocation(program, "a_position"),
          resolution: gl.getUniformLocation(program, "u_resolution"),
          rect: gl.getUniformLocation(program, "u_rect"),
          radius: gl.getUniformLocation(program, "u_radius"),
          mouse: gl.getUniformLocation(program, "u_mouse"),
          time: gl.getUniformLocation(program, "u_time")
        }
      });
    });

    window.addEventListener("mousemove", (event) => {
      this.mouse.tx = event.clientX;
      this.mouse.ty = event.clientY;
    });

    window.addEventListener("resize", () => {
      this.items.forEach((item) => this.resizeItem(item));
    });

    requestAnimationFrame((time) => this.render(time));
  }

  getRadius(target) {
    const style = getComputedStyle(target);
    const radius = parseFloat(style.borderTopLeftRadius);

    if (Number.isNaN(radius)) return 24;

    return radius;
  }

  resizeItem(item) {
    const rect = item.target.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (item.canvas.width !== width || item.canvas.height !== height) {
      item.canvas.width = width;
      item.canvas.height = height;

      item.canvas.style.width = `${rect.width}px`;
      item.canvas.style.height = `${rect.height}px`;

      item.gl.viewport(0, 0, item.canvas.width, item.canvas.height);
    }

    return rect;
  }

  render(time) {
    this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.12;
    this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.12;

    this.items.forEach((item) => {
      const rect = this.resizeItem(item);

      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        rect.bottom < 0 ||
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth
      ) {
        return;
      }

      const radius = this.getRadius(item.target);
      const { gl, program, buffer, locations } = item;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(program);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(locations.position);
      gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(locations.resolution, window.innerWidth, window.innerHeight);
      gl.uniform4f(locations.rect, rect.left, rect.top, rect.width, rect.height);
      gl.uniform1f(locations.radius, radius);
      gl.uniform2f(locations.mouse, this.mouse.x, this.mouse.y);
      gl.uniform1f(locations.time, time);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    });

    requestAnimationFrame((nextTime) => this.render(nextTime));
  }

  createProgram(gl) {
    const vertexSource = `
      attribute vec2 a_position;

      varying vec2 v_uv;

      void main() {
        v_uv = a_position;

        vec2 clip = a_position * 2.0 - 1.0;
        clip.y *= -1.0;

        gl_Position = vec4(clip, 0.0, 1.0);
      }
    `;

      const fragmentSource = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec4 u_rect;
  uniform float u_radius;
  uniform vec2 u_mouse;
  uniform float u_time;

  varying vec2 v_uv;

  float roundedRectSDF(vec2 pixel, vec2 size, float radius) {
    vec2 halfSize = size * 0.5;
    vec2 p = pixel - halfSize;
    vec2 q = abs(p) - halfSize + radius;

    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
      (c - a) * u.y * (1.0 - u.x) +
      (d - b) * u.x * u.y;
  }

  float curvedHighlight(vec2 uv, vec2 pos, float width, float strength) {
    float d = distance(uv, pos);
    return (1.0 - smoothstep(0.0, width, d)) * strength;
  }

  void main() {
    vec2 uv = v_uv;

    vec2 size = u_rect.zw;
    vec2 localPixel = uv * size;
    vec2 center = size * 0.5;

    float radius = clamp(u_radius, 1.0, min(size.x, size.y) * 0.5);
    float dist = roundedRectSDF(localPixel, size, radius);

    float inside = 1.0 - smoothstep(0.0, 1.4, dist);

    if (inside <= 0.001) {
      discard;
    }

    float time = u_time * 0.001;

    float minSize = min(size.x, size.y);
    float maxSize = max(size.x, size.y);

    float absDist = abs(dist);

    // More realistic glass thickness zones
    float outerRim = smoothstep(72.0, 0.0, absDist);
    float hardRim = smoothstep(18.0, 0.0, absDist);
    float hotEdge = smoothstep(5.0, 0.0, absDist);

    // Inner volume fade
    float centerFalloff = distance(uv, vec2(0.5));
    float innerVolume = 1.0 - smoothstep(0.12, 0.85, centerFalloff);

    // Directional fake lighting
    float topLight = 1.0 - smoothstep(0.0, 0.75, distance(uv, vec2(0.82, 0.05)));
    float leftLight = 1.0 - smoothstep(0.0, 0.85, distance(uv, vec2(0.08, 0.2)));
    float bottomDepth = smoothstep(0.35, 1.0, uv.y);
    float rightDepth = smoothstep(0.45, 1.0, uv.x);

    // Mouse-based subtle lens glow
    vec2 mouseLocal = vec2(
      u_mouse.x - u_rect.x,
      u_mouse.y - u_rect.y
    );

    float mouseDistance = distance(localPixel, mouseLocal);
    float mouseGlow = 1.0 - smoothstep(0.0, minSize * 0.65, mouseDistance);

    // Softer, slower internal distortion pattern
    vec2 flowUv = uv * vec2(4.0, 3.25);
    flowUv += vec2(
      sin(time * 0.18 + uv.y * 2.0),
      cos(time * 0.22 + uv.x * 2.0)
    ) * 0.075;

    float n1 = smoothNoise(flowUv * 2.2 + time * 0.12);
    float n2 = smoothNoise(flowUv * 5.0 - time * 0.08);
    float liquidVariation = n1 * 0.65 + n2 * 0.35;

    // Thin realistic highlight streaks
    float streakA = smoothstep(0.04, 0.0, abs((uv.y - 0.15) + sin(uv.x * 5.0) * 0.025));
    streakA *= smoothstep(0.0, 0.2, uv.x) * smoothstep(1.0, 0.45, uv.x);

    float streakB = smoothstep(0.025, 0.0, abs((uv.x - 0.12) + sin(uv.y * 4.0) * 0.025));
    streakB *= smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.35, uv.y);

    float diagonalSheen = smoothstep(
      0.08,
      0.0,
      abs((uv.x + uv.y) - 0.95)
    ) * 0.35;

    // Subtle chromatic edge illusion
    float chromaRed = hardRim * smoothstep(0.45, 1.0, uv.x) * 0.08;
    float chromaBlue = hardRim * smoothstep(0.55, 0.0, uv.x) * 0.10;

    vec3 glassTint = vec3(0.68, 0.84, 0.96);
    vec3 deepTint = vec3(0.03, 0.10, 0.22);
    vec3 white = vec3(1.0);
    vec3 blueWhite = vec3(0.72, 0.92, 1.0);

    vec3 color = glassTint;

    // Internal depth
    color = mix(color, deepTint, bottomDepth * rightDepth * 0.28);
    color = mix(color, vec3(0.55, 0.75, 0.92), liquidVariation * innerVolume * 0.10);

    // Edges and molded thickness
    color += white * outerRim * 0.18;
    color += blueWhite * hardRim * 0.38;
    color += white * hotEdge * 0.82;

    // Realistic highlights
    color += white * topLight * 0.34;
    color += white * leftLight * 0.12;
    color += white * streakA * 0.22;
    color += white * streakB * 0.16;
    color += white * diagonalSheen * 0.16;

    // Subtle chromatic edge split
    color.r += chromaRed;
    color.b += chromaBlue;

    // Very subtle interactivity
    color += blueWhite * mouseGlow * innerVolume * 0.055;

    // Slight inner shadow near bottom/right
    color -= deepTint * bottomDepth * 0.10;
    color -= deepTint * rightDepth * 0.06;

    float alpha =
      0.075 +
      innerVolume * 0.05 +
      outerRim * 0.14 +
      hardRim * 0.30 +
      hotEdge * 0.24 +
      streakA * 0.07 +
      streakB * 0.055 +
      diagonalSheen * 0.05 +
      liquidVariation * 0.025;

    alpha = clamp(alpha, 0.06, 0.62);

    gl_FragColor = vec4(color, alpha * inside);
  }
`;

    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentSource
    );

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(error);
    }

    return program;
  }

  createShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(error);
    }

    return shader;
  }
}

