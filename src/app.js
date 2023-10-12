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

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GitHubStrategy = require("passport-github").Strategy;
const bcrypt = require("bcrypt");
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(app);
const io = new Server(server);

// Conectar a MongoDB
mongoose.connect(
  "mongodb+srv://nahuelxd:ej118BPMqH9QEr09@cluster0.i6cgahd.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// express-session
app.use(
  session({
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://nahuelxd:ej118BPMqH9QEr09@cluster0.i6cgahd.mongodb.net/?retryWrites=true&w=majority",
      ttl: 100,
    }),
    secret: "3rsaefw3f3q2ed",
    resave: false,
    saveUninitialized: false,
  })
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error de conexión a MongoDB:"));
db.once("open", () => {
  console.log("Conexión exitosa a MongoDB");
});
app.get("/products.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.sendFile(__dirname + "/views/scripts/products.js");
});

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

// Escuchar conexiones de Socket.io
io.on("connection", (socket) => {
  console.log("A user connected");

  // Manejar los mensajes del chat
  socket.on("chat message", async (messageData) => {
    try {
      // Crear un nuevo documento de mensaje con los datos recibidos
      const newMessage = new MessageModel({
        correo: messageData.correo,
        message: messageData.message,
      });

      // Guardar el mensaje en la base de datos MongoDB
      await newMessage.save();

      // Emitir el mensaje a todos los clientes conectados
      io.emit("chat message", newMessage);
    } catch (error) {
      console.error("Error al guardar el mensaje:", error);
    }
  });

  // Manejar la desconexión del usuario
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

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

// Configura Passport
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await UserModel.findOne({ username });
    if (!user) return done(null, false);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return done(null, false);
    return done(null, user);
  })
);

passport.use(
  new GitHubStrategy(
    {
      clientID: "f1e8bd1453fb0788068c",
      clientSecret: "228c2a1afec65d3ce88b22d4b28c6378d4614fcf",
      callbackURL: "http://localhost:8080/profile",
    },
    (accessToken, refreshToken, profile, done) => {}
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await UserModel.findById(id);
  done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

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

// Iniciar el servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});
