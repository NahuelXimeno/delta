import express from "express";
import multer from "multer";
import { UserModel } from "../dao/models/user.model.js";

const userRouter = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "profileImage") {
      cb(null, "profiles/");
    } else if (file.fieldname === "productImage") {
      cb(null, "products/");
    } else {
      cb(null, "documents/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

userRouter.post(
  "/:uid/documents",
  upload.array("documents"),
  async (req, res) => {
    try {
      const userId = req.params.uid;
      const uploadedFiles = req.files;

      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      uploadedFiles.forEach((file) => {
        user.documents.push({
          name: file.originalname,
          reference: `/uploads/documents/${file.filename}`,
        });
      });

      user.last_connection = new Date();

      await user.save();

      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

export default userRouter;
