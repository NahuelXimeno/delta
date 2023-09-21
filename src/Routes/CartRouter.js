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

export default router;
