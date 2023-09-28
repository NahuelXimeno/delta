document.addEventListener("DOMContentLoaded", () => {
  const addCartFormList = document.querySelectorAll(".add-to-cart-form");

  addCartFormList.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const productId = formData.get("productId");
      const quantity = formData.get("quantity");

      try {
        const response = await fetch(`/api/products/add-to-cart/${productId}`, {
          method: "POST",
          body: JSON.stringify({ quantity }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          // Mostrar mensaje de éxito
          const successMessage = document.querySelector(".success-message");
          successMessage.style.display = "block";

          // Ocultar el formulario
          form.style.display = "none";
        } else {
          console.error("Error al agregar producto al carrito.");
        }
      } catch (error) {
        console.error("Error al agregar producto al carrito:", error);
      }
    });
  });
});
