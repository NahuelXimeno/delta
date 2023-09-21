import mongoose from "mongoose";

const cartCollection = "carts";

const cartSchema = new mongoose.Schema({
  products: {
    type: Array,
    required: true,
  },
});

const CartModel = mongoose.model(cartCollection, cartSchema);
export { CartModel };
