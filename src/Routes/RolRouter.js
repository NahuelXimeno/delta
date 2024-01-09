import express from "express";
import { UserModel } from "../dao/models/user.model.js";

const router = express.Router();

router.put("/api/usuarios/:uid", async (req, res) => {
  try {
    const userId = req.params.uid;
    const nuevoRol = req.body.rol;

    // Verifica si el nuevo rol es válido
    if (nuevoRol !== "user" && nuevoRol !== "premium") {
      return res.status(400).json({ error: "Rol no válido" });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const requiredDocuments = [
      "Identificación",
      "Comprobante de domicilio",
      "Comprobante de estado de cuenta",
    ];

    if (nuevoRol === "premium") {
      const hasAllDocuments = requiredDocuments.every((docName) =>
        user.documents.some((doc) => doc.name === docName)
      );

      if (!hasAllDocuments) {
        return res
          .status(400)
          .json({ error: "Usuario debe cargar documentos requeridos" });
      }
    } else if (nuevoRol === "user" && user.role === "premium") {
      return res.status(400).json({
        error: "No se permite el cambio de premium a user directamente",
      });
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

export default router;
