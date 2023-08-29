const express = require("express");
const ProductManager = require("./ProductManager.js");
const CartManager = require("./CartManager.js");

const productManager = new ProductManager();
const cartManager = new CartManager();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/products", async (req, res) => {
  const limit = req.query.limit;
  const products = await productManager.getProduct();

  if (limit) {
    return res.send(products.slice(0, limit));
  }
  res.send(products);
});

app.get("/products/:productId", async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  const products = await productManager.getProduct();

  const product = products.find(({ id }) => id === productId);
  if (!product) {
    return res.status(404).send();
  }
  res.send(product);
});

app.delete("/products/:productId", async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  await productManager.deleteProduct(productId);

  res.send("Producto eliminado exitosamente");
});

app.put("/products/:productId", async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  const changes = req.body;

  await productManager.updateProduct(productId, changes);

  res.send("Producto actualizado exitosamente");
});

app.post("/", (req, res) => {
  const newCart = cartManager.createCart();
  res.status(201).json(newCart);
});

app.post("/:cid/product/:pid", async (req, res) => {
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

app.listen(8080, () => console.log("Listo en el puerto 8080"));
