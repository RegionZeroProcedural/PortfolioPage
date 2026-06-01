const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

if (menuToggle && mobileNav) {
  menuToggle.setAttribute("aria-expanded", "false");

  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("active");

    const isOpen = mobileNav.classList.contains("active");

    menuToggle.textContent = isOpen ? "×" : "☰";
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("active");
      menuToggle.textContent = "☰";
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

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

const skillCards = document.querySelectorAll(".skill-card");

skillCards.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const currentCard = e.currentTarget;
    const rect = currentCard.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const percentX = mouseX / rect.width;
    const percentY = mouseY / rect.height;

    const centeredX = percentX - 0.5;
    const centeredY = percentY - 0.5;

    const rotateY = centeredX * 16;
    const rotateX = centeredY * -16;

    currentCard.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.04)
    `;
  });

  card.addEventListener("mouseleave", (e) => {
    e.currentTarget.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  });
});

/* Always-animated + scroll-reactive background */
const root = document.body;

let scrollY = window.scrollY;
let targetScrollY = window.scrollY;
let time = 0;

/* Scroll-reactive background only */
const ambientBg = document.querySelector(".ambient-bg");

function updateScrollBackground() {
  if (!ambientBg) return;

  const scrollY = window.scrollY;
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight;

  const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

  ambientBg.style.setProperty("--scroll-x", `${scrollY * -0.035}px`);
  ambientBg.style.setProperty("--scroll-y", `${scrollY * 0.055}px`);
  ambientBg.style.setProperty("--scroll-scale", `${1 + progress * 0.06}`);
}

window.addEventListener("scroll", updateScrollBackground, { passive: true });
updateScrollBackground();