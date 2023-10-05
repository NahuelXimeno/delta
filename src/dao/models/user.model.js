import mongoose from "mongoose";

const userCollection = "users";

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: {
    type: String,
    default: "usuario",
  },
});

const UserModel = mongoose.model(userCollection, userSchema);

export { UserModel };
