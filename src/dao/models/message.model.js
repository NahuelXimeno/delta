import mongoose from "mongoose";

const messageCollection = "messages";

const messageSchema = new mongoose.Schema({
  correo: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

const MessageModel = mongoose.model(messageCollection, messageSchema);
export { MessageModel };
