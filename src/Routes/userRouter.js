import express from "express";
import { UserModel } from "../dao/models/user.model.js";

const userRouter = express.Router();

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

export default userRouter;
