export const errorDictionary = {
  PRODUCT_NOT_FOUND: "Producto no encontrado.",
  PRODUCT_OUT_OF_STOCK: "Producto agotado.",
  CART_OPERATION_FAILED: "Error al realizar la operación en el carrito.",
};

export const customError = (errorCode) => {
  const errorMessage = errorDictionary[errorCode] || "Error desconocido";
  const error = new Error(errorMessage);
  error.statusCode = 400;
  return error;
};
