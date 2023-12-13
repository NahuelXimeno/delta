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
import mockRouter from "../src/Mock.js";
import { errorHandler } from "../src/error/ErrorHandler.js";
import compression from "compression";
import { logger } from "../src/logger.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swaggerConfig";

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

// Factory para obtener el DAO seleccionado
const getDAO = (daoType) => {
  switch (daoType) {
    case "user":
      return UserModel;
    case "product":
      return ProductModel;
    case "cart":
      return CartModel;
    case "message":
      return MessageModel;
    default:
      throw new Error("DAO no válido");
  }
};

// Configurar Handlebars
const hbs = exphbs.create({ extname: "hbs" });
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");

// Rutas
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/products", ProductRouter);
app.use("/api/carts", CartRouter);
app.use("/api/messages", MessageRouter);
app.use("/api", SessionRouter);
app.use("/api", mockRouter);
app.use(compression());
app.use("/", UsuariosRouter);
app.use((err, req, res, next) => {
  logger.error(`Error en la aplicación: ${err.message}`);
  errorHandler(err, req, res); // Puedes definir tu propio manejador de errores
});
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

app.get("/loggerTest", (req, res) => {
  logger.debug("Mensaje de debug");
  logger.http("Mensaje de http");
  logger.info("Mensaje de info");
  logger.warning("Mensaje de warning");
  logger.error("Mensaje de error");
  logger.fatal("Mensaje fatal");

  res.send(
    "Logs enviados. Verifica la consola y el archivo errors.log si corresponde."
  );
});

// Ruta para mostrar la vista de la página de inicio
app.get("/", async (req, res) => {
  try {
    const products = await ProductModel.find().lean();
    logger.info("Página de inicio cargada correctamente");
    res.render("home", { products });
  } catch (error) {
    logger.error(`Error al cargar la página de inicio: ${error.message}`);
    res.status(500).send("Internal Server Error");
  }
});

// Establecer las rutas para las vistas y archivos estáticos
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/chat", authorize(["user"]), async (req, res) => {
  try {
    // Consulta la colección "messages" en MongoDB para obtener los mensajes
    const messages = await MessageModel.find().lean();

    // Renderiza la vista de chat y pasa los mensajes como datos
    res.render("chat", { messages });
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

app.post(
  "/api/productos/agregar-al-carrito/:productId",
  authorize(["premium"]),
  async (req, res) => {
    const productId = req.params.productId;
    const usuario = req.user;

    const producto = await ProductModel.findById(productId);
    try {
      const product = await ProductModel.findById(productId);
      if (!producto) {
        throw customError("PRODUCT_NOT_FOUND");
      }

      if (producto.owner.equals(usuario._id) && usuario.role === "premium") {
        return res.status(403).json({
          error: "No se puede agregar el propio producto al carrito.",
        });
      }

      if (product.stock === 0) {
        throw customError("PRODUCT_OUT_OF_STOCK");
      }
      owner: usuario._id, res.json(product);
    } catch (error) {
      next(error); // Enviar el error al manejador de errores
    }
  }
);

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
