import express from "express";
import { Server } from "socket.io";
import ProductManager from "../ProductManager.js";
import CartManager from "../CartManager.js";

const router = express.Router();
const productManager = new ProductManager();
const cartManager = new CartManager();

const io = new Server();

router.get("/realtimeproducts", (req, res) => {
  const products = productManager.getProduct();
  res.render("realtimeproducts", { products });
});
router.get("/products", async (req, res) => {
  try {
    const products = await productManager.getProduct();
    res.render("home", { products });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/products", async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      thumbnail,
      code,
      stock,
      category,
      status,
    } = req.body;

    if (
      !title ||
      !price ||
      !thumbnail ||
      !code ||
      !stock ||
      !category ||
      !status
    ) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios." });
    }

    await productManager.addProduct(
      title,
      description,
      price,
      thumbnail,
      code,
      stock,
      category,
      status
    );

    io.emit("productCreated", {});

    res.status(201).json({ message: "Producto creado exitosamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

router.get("/products/:productId", async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  const products = await productManager.getProduct();

  const product = products.find(({ id }) => id === productId);
  if (!product) {
    return res.status(404).send();
  }
  res.send(product);
});

router.delete("/products/:productId", async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  await productManager.deleteProduct(productId);
  io.emit("productDeleted", { productId });
  res.send("Producto eliminado exitosamente");
});

router.put("/products/:productId", async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  const changes = req.body;

  await productManager.updateProduct(productId, changes);

  res.send("Producto actualizado exitosamente");
});

router.post("/", (req, res) => {
  const newCart = cartManager.createCart();
  res.status(201).json(newCart);
});

router.post("/:cid/product/:pid", async (req, res) => {
  const cartId = parseInt(req.params.cid, 10);
  const productId = parseInt(req.params.pid, 10);

  try {
    const cart = await cartManager.getCartById(cartId);

    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    const product = await productManager.getProductById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    if (!cart.products) {
      cart.products = [];
    }

    const existingProduct = cart.products.find(
      (item) => item.product === productId
    );

    if (existingProduct) {
      existingProduct.quantity++;
    } else {
      cart.products.push({ product: productId, quantity: 1 });
    }

    await cartManager.saveCartsToFile();

    res.status(201).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
