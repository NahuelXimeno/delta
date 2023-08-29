const fs = require("fs");

class CartManager {
  constructor() {
    this.carts = [];
    this.cartId = 1;
    this.cartFile = "./src/Carritos.json";
    this.loadCartsFromFile();
  }
  createCart() {
    const newCart = {
      id: this.cartId++,
      products: [],
    };

    this.carts.push(newCart);
    this.saveCartsToFile();

    return newCart;
  }
  async getCartById(cartId) {
    return this.carts.find((cart) => cart.id === cartId) || null;
  }

  async loadCartsFromFile() {
    try {
      if (fs.existsSync(this.cartFile)) {
        const cartsData = await fs.promises.readFile(this.cartFile, "utf-8");
        this.carts = JSON.parse(cartsData);
        this.cartId = Math.max(...this.carts.map((cart) => cart.id)) + 1;
      }
    } catch (error) {
      console.error("Error loading carts:", error);
    }
  }

  async saveCartsToFile() {
    try {
      await fs.promises.writeFile(
        this.cartFile,
        JSON.stringify(this.carts, null, "\t")
      );
    } catch (error) {
      console.error("Error saving carts:", error);
    }
  }
}

module.exports = CartManager;
