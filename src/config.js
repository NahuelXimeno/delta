import express from "express";
import exphbs from "express-handlebars";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Conectar a MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware para analizar cookies
app.use(cookieParser());

// Middleware de Passport
app.use(passport.initialize());

// express-session
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      ttl: 100,
    }),
    secret: SECRET_KEY,
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
      clientID: clientID,
      clientSecret: clientSecret,
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
export { app, io };
