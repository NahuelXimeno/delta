const fs = require("fs");
const archivo = "./src/Productos.json";

class ProductManager {
  static id = 0;
  async addProduct(title, description, price, thumbnail, code, stock) {
    const product = {
      id: ProductManager.id++,
      title,
      description,
      price,
      thumbnail,
      code,
      stock,
    };

    try {
      if (!fs.existsSync(archivo)) {
        const listaVacia = [];
        listaVacia.push(product);

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

  async deleteProduct(id) {
    const product = await this.getProduct();
    const productSinId = product.filter((product) => product.id != id);
    await fs.promises.writeFile(
      archivo,
      JSON.stringify(productSinId, null, "\t")
    );
  }
  async updateProduct(id, updatedFields) {
    try {
      const products = await this.getProduct();
      const productIndex = products.findIndex((product) => product.id === id);
      if (productIndex === -1) {
        console.log("El producto no existe.");
        return;
      }
      updatedFields.id = id;
      products[productIndex] = { ...products[productIndex], ...updatedFields };
      await fs.promises.writeFile(
        archivo,
        JSON.stringify(products, null, "\t")
      );
    } catch (error) {
      console.log(error);
    }
  }
  async getProduct() {
    const contenido = await fs.promises.readFile(archivo, "utf-8");
    const contenidoObj = JSON.parse(contenido);
    return contenidoObj;
  }
}
module.exports = ProductManager;
const funcionAsync = async () => {
  const productmanager = new ProductManager();
  console.log(await productmanager.getProduct());
  await productmanager.addProduct(
    "producto prueba",
    "Este es un producto prueba",
    200,
    "Sin imagen",
    "abc123",
    25
  );
  console.log(await productmanager.getProduct());
  await productmanager.getProductById(0);
  await productmanager.updateProduct(0, {
    title: "Nuevo título",
    price: 250,
    stock: 30,
  });
  console.log(await productmanager.getProduct());
  await productmanager.deleteProduct(0);
  console.log(await productmanager.getProduct());
};
