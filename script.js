const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

if (menuToggle && mobileNav) {
  menuToggle.setAttribute("aria-expanded", "false");

  const closeMobileNav = () => {
    mobileNav.classList.remove("active");
    menuToggle.textContent = "☰";
    menuToggle.setAttribute("aria-expanded", "false");
  };

  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("active");

    const isOpen = mobileNav.classList.contains("active");

    menuToggle.textContent = isOpen ? "×" : "☰";
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileNav);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMobileNav();
    }
  });
}

/* Background video quality swap */
const bgVideo = document.querySelector("#bgVideo");

if (bgVideo) {
  const highQualitySrc = "video/background-hq.mp4";

  const preloadVideo = document.createElement("video");
  preloadVideo.src = highQualitySrc;
  preloadVideo.muted = true;
  preloadVideo.loop = true;
  preloadVideo.playsInline = true;
  preloadVideo.preload = "auto";

  preloadVideo.addEventListener("canplaythrough", () => {
    const currentTime = bgVideo.currentTime;

    bgVideo.src = highQualitySrc;
    bgVideo.currentTime = currentTime;
    bgVideo.play().catch(() => {});
  });

  preloadVideo.load();
}

/* Glass mouse highlight */
const glassElements = document.querySelectorAll(".liquid-glass, .liquid-button");

glassElements.forEach((el) => {
  el.addEventListener("mousemove", (e) => {
    const rect = el.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  });

  el.addEventListener("mouseleave", () => {
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
  });
});

/* Skill card + project card tilt with opposite-side shine */
const tiltCards = document.querySelectorAll(".skill-card, .project-card");

tiltCards.forEach((card) => {
  const maxTilt = Number(card.dataset.maxTilt || 8);
  const lift = Number(card.dataset.lift || 4);
  const shine = card.querySelector(".card-shine");

  card.addEventListener("mousemove", (e) => {
    if (document.body.classList.contains("motion-tilt-active")) return;

    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * maxTilt;
    const rotateX = ((centerY - y) / centerY) * maxTilt;

    const mouseXPercent = (x / rect.width) * 100;
    const mouseYPercent = (y / rect.height) * 100;

    const oppositeX = rect.width - x;
    const oppositeY = rect.height - y;

    card.style.transform = `
      perspective(1000px)
      translateY(-${lift}px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
    `;

    card.style.setProperty("--mouse-x", `${mouseXPercent}%`);
    card.style.setProperty("--mouse-y", `${mouseYPercent}%`);
    card.style.setProperty("--opposite-x", `${100 - mouseXPercent}%`);
    card.style.setProperty("--opposite-y", `${100 - mouseYPercent}%`);

    if (shine) {
      shine.style.setProperty("--shine-x", `${oppositeX}px`);
      shine.style.setProperty("--shine-y", `${oppositeY}px`);
    }
  });

  card.addEventListener("mouseleave", () => {
    if (document.body.classList.contains("motion-tilt-active")) return;

    card.style.transform = `
      perspective(1000px)
      translateY(0)
      rotateX(0deg)
      rotateY(0deg)
    `;

    card.style.setProperty("--mouse-x", "50%");
    card.style.setProperty("--mouse-y", "50%");
    card.style.setProperty("--opposite-x", "50%");
    card.style.setProperty("--opposite-y", "50%");

    if (shine) {
      shine.style.setProperty("--shine-x", "50%");
      shine.style.setProperty("--shine-y", "50%");
    }
  });
});

/* Liquid glass Android-style dark mode toggle */
const darkToggleBtn = document.querySelector("#darkModeToggle");

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
  document.body.classList.add("light-theme");
} else {
  document.body.classList.remove("light-theme");
}

function updateThemeToggle() {
  if (!darkToggleBtn) return;

  const isLight = document.body.classList.contains("light-theme");

  darkToggleBtn.classList.toggle("active", isLight);
  darkToggleBtn.setAttribute("aria-pressed", String(isLight));
  darkToggleBtn.setAttribute(
    "aria-label",
    isLight ? "Switch to dark mode" : "Switch to light mode"
  );
}

function toggleDark() {
  document.body.classList.toggle("light-theme");

  const isLight = document.body.classList.contains("light-theme");

  localStorage.setItem("theme", isLight ? "light" : "dark");

  updateThemeToggle();
}

if (darkToggleBtn) {
  updateThemeToggle();
  darkToggleBtn.addEventListener("click", toggleDark);
}

document.body.classList.add("js-enabled");

const fadeElements = document.querySelectorAll(".section, .site-footer");

const fadeObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
    rootMargin: "0px 0px -80px 0px",
  }
);

fadeElements.forEach((element) => {
  element.classList.add("scroll-fade");
  fadeObserver.observe(element);
});

window.addEventListener("DOMContentLoaded", () => {
  const revealElements = document.querySelectorAll(
    "main > section, .site-footer"
  );

  console.log("Reveal elements found:", revealElements.length);

  revealElements.forEach((element) => {
    element.classList.add("reveal-on-scroll");
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -80px 0px",
    }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
});

/* Contact modal triggers */
const contactModal = document.querySelector("#contactModal");
const contactModalClose = document.querySelector(".modal__close");

const contactModalTriggers = document.querySelectorAll(
  '.mail__btn, a[href="#contact"]'
);

const openContactModal = () => {
  if (!contactModal) return;

  contactModal.classList.add("open");
  contactModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

const closeContactModal = () => {
  if (!contactModal) return;

  contactModal.classList.remove("open");
  contactModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

contactModalTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();

    if (mobileNav && menuToggle) {
      mobileNav.classList.remove("active");
      menuToggle.textContent = "☰";
      menuToggle.setAttribute("aria-expanded", "false");
    }

    openContactModal();
  });
});

if (contactModalClose) {
  contactModalClose.addEventListener("click", closeContactModal);
}

if (contactModal) {
  contactModal.addEventListener("click", (event) => {
    if (event.target === contactModal) {
      closeContactModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    contactModal &&
    contactModal.classList.contains("open")
  ) {
    closeContactModal();
  }
});

/* Mobile accelerometer / gyro tilt */
const motionTiltToggle = document.querySelector("#motionTiltToggle");

if (tiltCards.length && motionTiltToggle) {
  const supportsMotionTilt = "DeviceOrientationEvent" in window;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let motionTiltActive = false;
  let baseBeta = null;
  let baseGamma = null;

  let targetRotateX = 0;
  let targetRotateY = 0;
  let currentRotateX = 0;
  let currentRotateY = 0;
  let animationFrame = null;

  const maxMobileTilt = 8;

  const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  };

  const isTouchDevice = () => {
    return window.matchMedia("(pointer: coarse)").matches;
  };

  const resetMotionCards = () => {
    tiltCards.forEach((card) => {
      const shine = card.querySelector(".card-shine");

      card.style.transform = `
        perspective(1000px)
        translateY(0)
        rotateX(0deg)
        rotateY(0deg)
      `;

      card.style.setProperty("--mouse-x", "50%");
      card.style.setProperty("--mouse-y", "50%");
      card.style.setProperty("--opposite-x", "50%");
      card.style.setProperty("--opposite-y", "50%");

      if (shine) {
        shine.style.setProperty("--shine-x", "50%");
        shine.style.setProperty("--shine-y", "50%");
      }
    });
  };

  const animateMotionTilt = () => {
    currentRotateX += (targetRotateX - currentRotateX) * 0.12;
    currentRotateY += (targetRotateY - currentRotateY) * 0.12;

    tiltCards.forEach((card) => {
      const lift = Number(card.dataset.lift || 4);
      const shine = card.querySelector(".card-shine");

      const xPercent = clamp(
        50 + (currentRotateY / maxMobileTilt) * 35,
        8,
        92
      );

      const yPercent = clamp(
        50 - (currentRotateX / maxMobileTilt) * 35,
        8,
        92
      );

      card.style.transform = `
        perspective(1000px)
        translateY(-${lift}px)
        rotateX(${currentRotateX}deg)
        rotateY(${currentRotateY}deg)
      `;

      card.style.setProperty("--mouse-x", `${xPercent}%`);
      card.style.setProperty("--mouse-y", `${yPercent}%`);
      card.style.setProperty("--opposite-x", `${100 - xPercent}%`);
      card.style.setProperty("--opposite-y", `${100 - yPercent}%`);

      if (shine) {
        shine.style.setProperty("--shine-x", `${100 - xPercent}%`);
        shine.style.setProperty("--shine-y", `${100 - yPercent}%`);
      }
    });

    animationFrame = requestAnimationFrame(animateMotionTilt);
  };

  const handleDeviceOrientation = (event) => {
    if (typeof event.beta !== "number" || typeof event.gamma !== "number") {
      return;
    }

    if (baseBeta === null || baseGamma === null) {
      baseBeta = event.beta;
      baseGamma = event.gamma;
    }

    const betaDelta = clamp(event.beta - baseBeta, -18, 18);
    const gammaDelta = clamp(event.gamma - baseGamma, -18, 18);

    targetRotateX = clamp(-betaDelta * 0.45, -maxMobileTilt, maxMobileTilt);
    targetRotateY = clamp(gammaDelta * 0.45, -maxMobileTilt, maxMobileTilt);
  };

  const startMotionTilt = async () => {
    if (!supportsMotionTilt || prefersReducedMotion || !isTouchDevice()) {
      motionTiltToggle.textContent = "Motion Not Supported";
      motionTiltToggle.disabled = true;
      return;
    }

    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const permission = await DeviceOrientationEvent.requestPermission();

        if (permission !== "granted") {
          motionTiltToggle.textContent = "Motion Denied";
          return;
        }
      }

      baseBeta = null;
      baseGamma = null;

      document.body.classList.add("motion-tilt-active");
      window.addEventListener("deviceorientation", handleDeviceOrientation, true);

      if (!animationFrame) {
        animateMotionTilt();
      }

      motionTiltActive = true;
      motionTiltToggle.textContent = "Motion Tilt On";
      motionTiltToggle.setAttribute("aria-pressed", "true");
    } catch (error) {
      console.error("Motion tilt permission error:", error);
      motionTiltToggle.textContent = "Motion Unavailable";
    }
  };

  const stopMotionTilt = () => {
    window.removeEventListener(
      "deviceorientation",
      handleDeviceOrientation,
      true
    );

    cancelAnimationFrame(animationFrame);
    animationFrame = null;

    targetRotateX = 0;
    targetRotateY = 0;
    currentRotateX = 0;
    currentRotateY = 0;
    baseBeta = null;
    baseGamma = null;

    document.body.classList.remove("motion-tilt-active");
    resetMotionCards();

    motionTiltActive = false;
    motionTiltToggle.textContent = "Enable Motion Tilt";
    motionTiltToggle.setAttribute("aria-pressed", "false");
  };

  motionTiltToggle.addEventListener("click", () => {
    if (motionTiltActive) {
      stopMotionTilt();
    } else {
      startMotionTilt();
    }
  });

  if (!supportsMotionTilt || prefersReducedMotion) {
    motionTiltToggle.style.display = "none";
  }
}