import { cartModel } from "../models/cart.model.js";

class cartsManager {
  async create(products) {
    const cart = await cartModel.create({ products });
    return cart;
  }

  async getAll() {
    const carts = await cartModel.find().lean();
    return carts;
  }
}

export default cartsManager;
