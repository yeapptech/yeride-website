export default function setupPreRegistrationForm() {
  const preRegistrationForm = document.getElementById("pre-registration-form");
  const submitButton = document.getElementById("submit-button");
  const loadingIndicator = document.getElementById("loading-indicator");
  const formMessage = document.getElementById("form-message");

  if (preRegistrationForm && submitButton && loadingIndicator && formMessage) {
    preRegistrationForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      formMessage.textContent = "";
      formMessage.classList.add("hidden");
      formMessage.classList.remove("text-green-600", "text-red-600");

      submitButton.disabled = true;
      submitButton.classList.add("opacity-50", "cursor-not-allowed");
      loadingIndicator.classList.remove("hidden");

      const formData = new FormData(preRegistrationForm);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });

      if (
        data["password"] !== undefined &&
        data["confirmPassword"] !== undefined &&
        data["password"] !== data["confirmPassword"]
      ) {
        formMessage.textContent = "Error: Passwords do not match.";
        formMessage.classList.remove("hidden");
        formMessage.classList.add("text-red-600");
        submitButton.disabled = false;
        submitButton.classList.remove("opacity-50", "cursor-not-allowed");
        loadingIndicator.classList.add("hidden");
        return;
      }

      const API_URL = import.meta.env.PUBLIC_API_URL;
      if (!API_URL) {
        console.error("PUBLIC_API_URL no está definida");
        formMessage.textContent = "Error: Configuración del servidor no disponible.";
        formMessage.classList.remove("hidden");
        formMessage.classList.add("text-red-600");
        submitButton.disabled = false;
        submitButton.classList.remove("opacity-50", "cursor-not-allowed");
        loadingIndicator.classList.add("hidden");
        return;
      }

      try {
        const response = await fetch(`${API_URL}v1/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: data }),
        });

        const result = await response.json();

        if (response.ok) {
          formMessage.textContent = "Pre-registration successful! Thank you.";
          formMessage.classList.remove("hidden");
          formMessage.classList.add("text-green-600");
          preRegistrationForm.reset();
        } else {
          const errorMessage =
            result.message || "An error occurred during pre-registration.";
          formMessage.textContent = `Error: ${errorMessage}`;
          formMessage.classList.remove("hidden");
          formMessage.classList.add("text-red-600");
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        formMessage.textContent =
          "Error: Could not connect to the server. Please try again later.";
        formMessage.classList.remove("hidden");
        formMessage.classList.add("text-red-600");
      } finally {
        submitButton.disabled = false;
        submitButton.classList.remove("opacity-50", "cursor-not-allowed");
        loadingIndicator.classList.add("hidden");
      }
    });
  }
}

// Ejecutar automáticamente si se importa como script
if (typeof window !== 'undefined') {
  setupPreRegistrationForm();
} 