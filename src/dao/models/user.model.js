import mongoose from "mongoose";

const userCollection = "users";

const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: {
    type: String,
    unique: true,
  },
  age: Number,
  password: String,
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CartModel",
  },
  role: {
    type: String,
    default: "usuario",
  },
});

const UserModel = mongoose.model(userCollection, userSchema);

export { UserModel };
