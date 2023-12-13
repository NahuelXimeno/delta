import express from "express";
import { ProductModel } from "../dao/models/product.model.js";
import { Server } from "socket.io";

const router = express.Router();

const io = new Server();
/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Operaciones relacionadas con productos.
 */

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
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtener la lista de productos
 *     description: Retorna la lista de todos los productos.
 *     responses:
 *       200:
 *         description: Éxito, retorna la lista de productos.
 *       500:
 *         description: Error interno del servidor.
 */
// Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;
    const filter = {};
    if (query) {
      // Aplicar el filtro de búsqueda
      filter.category = query;
    }

    const sortOrder = sort === "desc" ? -1 : 1;
    const skip = (page - 1) * limit;

    const totalProducts = await ProductModel.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await ProductModel.find(filter)
      .sort({ price: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const response = {
      status: "success",
      payload: products,
      totalPages,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
      page: Number(page),
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      prevLink:
        page > 1
          ? `/api/products?limit=${limit}&page=${
              page - 1
            }&sort=${sort}&query=${query}`
          : null,
      nextLink:
        page < totalPages
          ? `/api/products?limit=${limit}&page=${
              page + 1
            }&sort=${sort}&query=${query}`
          : null,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Crear un nuevo producto
router.post("/products", authorize(["admin"]), async (req, res) => {
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
/**
 * @swagger
 * /api/products/{productId}:
 *   get:
 *     summary: Obtener detalles de un producto por ID
 *     description: Retorna los detalles de un producto específico según su ID.
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: ID del producto a consultar.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito, retorna los detalles del producto.
 *       404:
 *         description: Producto no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
// Obtener un producto por su ID
router.get("/products/:productId", async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await ProductModel.findById(productId).lean();

    if (!product) {
      return res.status(404).send("Producto no encontrado");
    }

    res.render("product-details", { product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Eliminar un producto por su ID
router.delete(
  "/products/:productId",
  authorize(["admin"]),
  async (req, res) => {
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
  }
);

// Actualizar un producto por su ID
router.put("/products/:productId", authorize(["admin"]), async (req, res) => {
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
