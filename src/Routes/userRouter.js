import express from "express";
import { UserModel } from "../dao/models/user.model.js";
import { enviarCorreoUsuarioInactivo } from "../email.js";

const userRouter = express.Router();
userRouter.get("/", async (req, res) => {
  try {
    const users = await UserModel.find({}, { name: 1, email: 1, role: 1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

userRouter.put("/:uid", async (req, res) => {
  try {
    const userId = req.params.uid;
    const nuevoRol = req.body.rol;

    // Verifica si el nuevo rol es válido
    if (nuevoRol !== "user" && nuevoRol !== "premium") {
      return res.status(400).json({ error: "Rol no válido" });
    }

    // Actualiza el rol del usuario
    const usuarioActualizado = await UserModel.findByIdAndUpdate(
      userId,
      { role: nuevoRol },
      { new: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuarioActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
userRouter.delete("/", async (req, res) => {
  try {
    const haceDosDias = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // Hace dos días
    const usuariosInactivos = await UserModel.find({
      lastConnection: { $lt: haceDosDias },
    });

    // Elimina usuarios inactivos
    await UserModel.deleteMany({ lastConnection: { $lt: haceDosDias } });

    // Envía un correo electrónico a cada usuario inactivo
    usuariosInactivos.forEach((usuario) => {
      enviarCorreoUsuarioInactivo(usuario.email);
    });

    res.json({
      mensaje: "Usuarios inactivos eliminados y correos electrónicos enviados",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
export default userRouter;
