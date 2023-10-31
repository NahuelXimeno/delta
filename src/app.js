import express from "express";
import exphbs from "express-handlebars";
import http from "http";
import { Server } from "socket.io";
import ProductRouter from "./Routes/ProductRouter.js";
import { ProductModel } from "../src/dao/models/product.model.js";
import { CartModel } from "../src/dao/models/cart.model.js";
import CartRouter from "./Routes/CartRouter.js";
import MessageRouter from "./Routes/MessageRouter.js";
import SessionRouter from "./Routes/sessionRouter.js";
import { MessageModel } from "../src/dao/models/message.model.js";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import { Strategy as CurrentStrategy } from "passport-current";

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GitHubStrategy = require("passport-github").Strategy;
const bcrypt = require("bcrypt");
const UserModel = require("../src/dao/models/user.model.js");
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(app);
const io = new Server(server);

dotenv.config();

// Configurar Handlebars
const hbs = exphbs.create({ extname: "hbs" });
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");

// Rutas
app.use("/api/products", ProductRouter);
app.use("/api/carts", CartRouter);
app.use("/api/messages", MessageRouter);
app.use("/api", SessionRouter);

// Ruta para mostrar la lista de productos
app.get("/products", async (req, res) => {
  try {
    const products = await ProductModel.find().lean();
    res.render("products", { products });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno del servidor");
  }
});

// Ruta para mostrar el carrito de compras
app.get("/cart", async (req, res) => {
  try {
    const carts = await CartModel.find().populate("products.product").lean();
    res.render("cart", { carts });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno del servidor");
  }
});
// Ruta para mostrar la vista de productos en tiempo real
app.get("/realtimeproducts", async (req, res) => {
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

// Ruta para mostrar la vista de la página de inicio
app.get("/", async (req, res) => {
  try {
    const products = await ProductModel.find().lean();
    res.render("home", { products });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Establecer las rutas para las vistas y archivos estáticos
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/chat", async (req, res) => {
  try {
    // Consulta la colección "messages" en MongoDB para obtener los mensajes
    const messages = await MessageModel.find().lean();

    // Renderiza la vista de chat y pasa los mensajes como datos
    res.render("chat", { messages });
  } catch (error) {
    console.error("Error al obtener mensajes:", error); // Agrega esta línea para ver el error en la consola del servidor
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

app.post("/api/products/add-to-cart/:productId", async (req, res) => {
  try {
    // Obtener el ID del producto desde los parámetros de la URL
    const productId = req.params.productId;

    // Buscar el producto en la base de datos
    const product = await ProductModel.findById(productId);

    // Verificar si el producto existe y está disponible
    if (!product || product.stock < 1) {
      return res
        .status(404)
        .json({ error: "Producto no encontrado o agotado." });
    }
    res.json({ message: "Producto agregado al carrito con éxito." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Rutas para autenticación
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
  })
);

app.post("/signup", async (req, res) => {
  if (req.session.isLogged) {
    return res.redirect("/profile");
  }

  const { username, email, password } = req.body;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const user = await UserModel.create({
    username,
    password: hashedPassword,
    email,
  });

  req.session.username = user.username;
  req.session.email = user.email;
  req.session.isLogged = true;

  res.redirect("/profile");
});

app.get("/auth/github", passport.authenticate("github"));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    successRedirect: "/profile",
    failureRedirect: "/login",
  })
);
// Configurar Passport para la estrategia local
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await UserModel.findOne({ username });
      if (!user) return done(null, false, { message: "Usuario no encontrado" });

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid)
        return done(null, false, { message: "Contraseña incorrecta" });

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Ruta para iniciar sesión con Passport (estrategia local)
app.post("/login", passport.authenticate("local"), (req, res) => {
  // En este punto, el usuario se ha autenticado con éxito
  // Puedes generar un token JWT y enviarlo como respuesta
  const token = generateJWTToken(req.user);
  res.json({ token });
});

// Ruta para registrarse con Passport (estrategia local)
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ username, password: hashedPassword });

    // Puedes generar un token JWT y enviarlo como respuesta
    const token = generateJWTToken(user);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Función para generar un token JWT
function generateJWTToken(user) {
  const payload = {
    sub: user._id,
    username: user.username,
  };
  const token = jwt.sign(payload, "dsfwswvwse", { expiresIn: "1h" });
  return token;
}
passport.use(
  "current",
  new CurrentStrategy((req, done) => {
    const token = req.cookies.token;

    if (!token) {
      return done(null, false, { message: "No se proporcionó un token" });
    }

    // Verifica el token y obtén el usuario
    jwt.verify(token, "dsfwswvwse", (err, user) => {
      if (err) {
        return done(null, false, { message: "Token no válido" });
      }
      return done(null, user);
    });
  })
);

// Iniciar el servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});
