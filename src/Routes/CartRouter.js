import express from "express";
import { CartModel } from "../dao/models/cart.model.js";
import { authorize } from "../middlewares/authorize.js";
import { TicketModel } from "../dao/models/ticket.model.js";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Operaciones relacionadas con el carrito de compras.
 */

/**
 * @swagger
 * /api/carts:
 *   get:
 *     summary: Obtener la lista de carritos
 *     description: Retorna la lista de todos los carritos.
 *     responses:
 *       200:
 *         description: Éxito, retorna la lista de carritos.
 *       500:
 *         description: Error interno del servidor.
 */

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
/**
 * @swagger
 * /api/carts/{cartId}:
 *   get:
 *     summary: Obtener detalles de un carrito por ID
 *     description: Retorna los detalles de un carrito específico según su ID.
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         description: ID del carrito a consultar.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito, retorna los detalles del carrito.
 *       404:
 *         description: Carrito no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
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
router.put("/:cid", authorize(["user"]), async (req, res) => {
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
// Ruta para la compra del carrito y generación de ticket
router.post("/api/carts/:cid/purchase", authorize("user"), async (req, res) => {
  try {
    const cartId = req.params.cid;

    // Obtener el carrito por su ID
    const cart = await CartModel.findById(cartId);

    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado." });
    }

    // Calcular el precio total sumando los precios de los productos en el carrito
    const totalAmount = cart.products.reduce((total, product) => {
      return total + product.price * product.quantity;
    }, 0);

    // Utilizar el servicio de Tickets para generar un ticket con los datos de la compra
    const ticket = new TicketModel({
      amount: totalAmount,
      purchaser: req.user.email,
    });

    await ticket.save();

    // Devolver el ticket generado
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
export default router;
