import express from "express";
import { MessageModel } from "../dao/models/message.model.js";

const router = express.Router();

// Ruta para enviar un nuevo mensaje
router.post("/", async (req, res) => {
  try {
    const { correo, message } = req.body;

    if (!correo || !message) {
      return res
        .status(400)
        .json({ error: "Correo y mensaje son obligatorios." });
    }

    const newMessage = new MessageModel({ correo, message });
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Ruta para obtener todos los mensajes
router.get("/", async (req, res) => {
  try {
    const messages = await MessageModel.find().lean();
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;
