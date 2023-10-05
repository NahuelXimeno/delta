import { UserModel } from "../dao/models/user.model.js";

import { Router } from "express";

const router = Router();

router.post("/login", async (req, res) => {
  if (req.session.isLogged) {
    return res.redirect("/profile");
  }

  const { username, password } = req.body;
  const user = await UserModel.findOne({ username, password }).lean();

  if (!user) {
    return res.redirect("/login");
  }

  req.session.username = user.username;
  req.session.email = user.email;
  req.session.isLogged = true;

  res.redirect("/profile");
});

router.post("/signup", async (req, res) => {
  if (req.session.isLogged) {
    return res.redirect("/profile");
  }

  const { username, email, password } = req.body;

  const user = await UserModel.create({ username, password, email });

  req.session.username = user.username;
  req.session.email = user.email;
  req.session.isLogged = true;

  res.redirect("/profile");
});

export default router;
