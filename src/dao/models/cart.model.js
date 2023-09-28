import mongoose from "mongoose";

const cartCollection = "carts";

const cartSchema = new mongoose.Schema({
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductModel",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
});

const CartModel = mongoose.model(cartCollection, cartSchema);
export { CartModel };
