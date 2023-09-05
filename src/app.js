import express from "express";
import exphbs from "express-handlebars";
import http from "http";
import { Server } from "socket.io";
import ProductManager from "./ProductManager.js";
import CartManager from "./CartManager.js";
import ProductRouter from "./Routes/ProductRouter.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productManager = new ProductManager();
const cartManager = new CartManager();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const hbs = exphbs.create({ extname: "hbs" });
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use("/api", ProductRouter);

app.get("/products", async (req, res) => {
  const products = await productManager.getProduct();
  res.render("home", { products });
});

io.on("connection", (socket) => {
  console.log("A user connected");
});

app.get("/products", async (req, res) => {
  const limit = req.query.limit;
  const products = await productManager.getProduct();

  if (limit) {
    return res.send(products.slice(0, limit));
  }
  res.send(products);
});

app.get("/home", async (req, res) => {
  try {
    const products = await productManager.getProduct();
    res.render("home", { products });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(8080, () => console.log("Listo en el puerto 8080"));
