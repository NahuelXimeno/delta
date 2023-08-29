const fs = require("fs");
const archivo = "./src/Productos.json";

class ProductManager {
  static id = 0;

  async addProduct(
    title,
    description,
    price,
    thumbnail,
    code,
    stock,
    category,
    status
  ) {
    const product = {
      id: ProductManager.id++,
      title,
      description,
      price,
      thumbnail,
      code,
      stock,
      category,
      status,
    };

    try {
      if (!fs.existsSync(archivo)) {
        const listaVacia = [product];
        await fs.promises.writeFile(
          archivo,
          JSON.stringify(listaVacia, null, "\t")
        );
      } else {
        const contenidoObj = await this.getProduct();
        contenidoObj.push(product);
        await fs.promises.writeFile(
          archivo,
          JSON.stringify(contenidoObj, null, "\t")
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  async getProduct() {
    const contenido = await fs.promises.readFile(archivo, "utf-8");
    return JSON.parse(contenido);
  }

  async deleteProduct(id) {
    const products = await this.getProduct();
    const productSinId = products.filter((product) => product.id != id);
    await fs.promises.writeFile(
      archivo,
      JSON.stringify(productSinId, null, "\t")
    );
  }

  async getProductById(id) {
    const products = await this.getProduct();
    return products.find((product) => product.id === id);
  }

  async updateProduct(id, updatedFields) {
    try {
      const products = await this.getProduct();
      const productIndex = products.findIndex((product) => product.id === id);
      if (productIndex === -1) {
        console.log("El producto no existe.");
        return;
      }
      const { id: updatedId, ...fieldsToUpdate } = updatedFields;

      products[productIndex] = { ...products[productIndex], ...fieldsToUpdate };
      await fs.promises.writeFile(
        archivo,
        JSON.stringify(products, null, "\t")
      );
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = ProductManager;
