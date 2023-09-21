import { productModel } from "../models/product.model.js";

class productsManager {
  async create(title, description, price, thumbnail, code, stock) {
    const product = await productModel.create({
      title,
      description,
      price,
      thumbnail,
      code,
      stock,
    });

    return product;
  }

  async getAll() {
    const products = await productModel.find().lean();
    return products;
  }
}

export default productsManager;
