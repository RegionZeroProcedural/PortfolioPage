/* Contact form EmailJS submit */
const contactForm = document.querySelector("#contactForm");
const modalSubmitBtn = document.querySelector(".modal__submit");

const loadingOverlay = document.querySelector(".modal__overlay--loading");
const successOverlay = document.querySelector(".modal__overlay--success");
const errorOverlay = document.querySelector(".modal__overlay--error");

const scaleFactor = 200;

const modalStatusOverlays = [
  loadingOverlay,
  successOverlay,
  errorOverlay,
];

const waitForPaint = () => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
};

const showModalStatus = async (overlay) => {
  modalStatusOverlays.forEach((item) => {
    if (!item) return;

    item.classList.remove("modal__overlay--visible");
    item.setAttribute("aria-hidden", "true");
  });

  if (!overlay) return;

  overlay.classList.add("modal__overlay--visible");
  overlay.setAttribute("aria-hidden", "false");

  await waitForPaint();
};

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    console.log("Contact form submitted");

    await showModalStatus(loadingOverlay);

    if (modalSubmitBtn) {
      modalSubmitBtn.disabled = true;
      modalSubmitBtn.textContent = "Sending...";
    }

    try {
      if (!window.emailjs) {
        throw new Error("EmailJS is not loaded");
      }

      const response = await window.emailjs.sendForm(
        "service_0eq27co",
        "template_05ztwad",
        contactForm,
        "kmnSqT_hgbVtqX5BR"
      );

      console.log("EmailJS success:", response);

      contactForm.reset();

      await showModalStatus(successOverlay);

      setTimeout(() => {
        showModalStatus(null);

        if (typeof closeContactModal === "function") {
          closeContactModal();
        }
      }, 1800);
    } catch (error) {
      console.error("EmailJS failed:", error);

      await showModalStatus(errorOverlay);

      setTimeout(() => {
        showModalStatus(null);
      }, 2600);
    } finally {
      if (modalSubmitBtn) {
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.textContent = "Send it my way";
      }
    }
  });
}