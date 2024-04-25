const mongoose = require("mongoose");

const UserCarts = mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  cartProduct: {
    type: Object,
    required: true,
  },
});

module.exports = mongoose.model("userCarts", UserCarts);
