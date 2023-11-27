import express from "express";
import { ProductModel } from "../src/dao/models/product.model.js";

const mockRouter = express.Router();

mockRouter.get("/mockproducts", async (req, res) => {
  try {
    // Generar 100 productos de ejemplo
    const mockProducts = [];
    for (let i = 1; i <= 100; i++) {
      mockProducts.push({
        title: `Producto: ${i}`,
        description: `Descripcion: ${i}`,
        price: Math.random() * 100,
        thumbnail: `https://a.com/mock-${i}.jpg`,
        code: `M${i}`,
        stock: Math.floor(Math.random() * 100),
      });
    }

    // Insertar productos de ejemplo en la base de datos (MongoDB)
    await ProductModel.insertMany(mockProducts);

    res.json({ message: "100 productos agregados." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error." });
  }
});

export default mockRouter;
