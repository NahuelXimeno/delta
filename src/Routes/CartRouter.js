import express from "express";
import { CartModel } from "../dao/models/cart.model.js";

const router = express.Router();

// Ruta para crear un nuevo carrito
router.post("/", async (req, res) => {
  try {
    const cart = new CartModel({});
    await cart.save();
    res.status(201).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Ruta para obtener todos los carritos
router.get("/", async (req, res) => {
  try {
    const carts = await CartModel.find().lean();
    res.json(carts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Ruta para obtener un carrito por su ID
router.get("/:cartId", async (req, res) => {
  const cartId = req.params.cartId;
  try {
    const cart = await CartModel.findById(cartId).lean();

    if (!cart) {
      return res.status(404).send("Carrito no encontrado");
    }

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Ruta para eliminar un carrito por su ID
router.delete("/:cartId", async (req, res) => {
  const cartId = req.params.cartId;
  try {
    const deletedCart = await CartModel.findByIdAndDelete(cartId);

    if (!deletedCart) {
      return res.status(404).send("Carrito no encontrado");
    }

    res.send("Carrito eliminado exitosamente");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// DELETE: Eliminar un producto específico del carrito
router.delete("/:cid/products/:pid", async (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;

  try {
    // Buscar el carrito por su ID
    const cart = await CartModel.findById(cartId);

    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado." });
    }

    // Eliminar el producto del carrito
    cart.products = cart.products.filter(
      (product) => product.productId !== productId
    );

    // Guardar el carrito actualizado
    await cart.save();

    res.json({ message: "Producto eliminado del carrito con éxito." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// PUT: Actualizar el carrito con un arreglo de productos
router.put("/:cid", async (req, res) => {
  const cartId = req.params.cid;
  const newProducts = req.body.products;

  try {
    // Buscar el carrito por su ID
    const cart = await CartModel.findById(cartId);

    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado." });
    }

    // Actualizar los productos en el carrito
    cart.products = newProducts;

    // Guardar el carrito actualizado
    await cart.save();

    res.json({ message: "Carrito actualizado con éxito." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// PUT: Actualizar la cantidad de ejemplares de un producto en el carrito
router.put("/:cid/products/:pid", async (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  const newQuantity = req.body.quantity;

  try {
    // Buscar el carrito por su ID
    const cart = await CartModel.findById(cartId);

    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado." });
    }

    // Encontrar el producto en el carrito y actualizar la cantidad
    const productInCart = cart.products.find(
      (product) => product.productId === productId
    );

    if (!productInCart) {
      return res
        .status(404)
        .json({ error: "Producto no encontrado en el carrito." });
    }

    productInCart.quantity = newQuantity;

    // Guardar el carrito actualizado
    await cart.save();

    res.json({
      message: "Cantidad de producto en el carrito actualizada con éxito.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// DELETE: Eliminar todos los productos del carrito
router.delete("/:cid", async (req, res) => {
  const cartId = req.params.cid;

  try {
    // Buscar el carrito por su ID y eliminarlo
    const deletedCart = await CartModel.findByIdAndDelete(cartId);

    if (!deletedCart) {
      return res.status(404).json({ error: "Carrito no encontrado." });
    }

    res.json({ message: "Carrito eliminado con éxito." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;
