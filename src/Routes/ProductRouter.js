import express from "express";
import { ProductModel } from "../dao/models/product.model.js";
import { Server } from "socket.io";

const router = express.Router();

const io = new Server();

// Ruta para obtener productos en tiempo real
router.get("/realtimeproducts", async (req, res) => {
  try {
    const products = await ProductModel.find().lean();

    // Emitir una actualización en tiempo real a través de Socket.io
    io.emit("productUpdated", products);

    res.render("realtimeproducts", { products });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Obtener todos los productos
router.get("/products", async (req, res) => {
  try {
    const products = await ProductModel.find().lean();
    res.render("home", { products });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Crear un nuevo producto
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

    const newProduct = new ProductModel({
      title,
      description,
      price,
      thumbnail,
      code,
      stock,
      category,
      status,
    });

    await newProduct.save();

    res.status(201).json({ message: "Producto creado exitosamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Obtener un producto por su ID
router.get("/products/:productId", async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await ProductModel.findById(productId).lean();

    if (!product) {
      return res.status(404).send("Producto no encontrado");
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Eliminar un producto por su ID
router.delete("/products/:productId", async (req, res) => {
  const productId = req.params.productId;

  try {
    const deletedProduct = await ProductModel.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).send("Producto no encontrado");
    }

    res.send("Producto eliminado exitosamente");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Actualizar un producto por su ID
router.put("/products/:productId", async (req, res) => {
  const productId = req.params.productId;
  const updatedProductData = req.body;

  try {
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      updatedProductData,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send("Producto no encontrado");
    }

    res.send("Producto actualizado exitosamente");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;
