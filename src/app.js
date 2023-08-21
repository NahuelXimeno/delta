const express = require("express");
const ProductManager = require("./Delta.js");
const productManager = new ProductManager();

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
  if (product === undefined) {
    return res.status(404).send();
  }
  res.send(product);
});
app.listen(8080, () => console.log("Listo"));
