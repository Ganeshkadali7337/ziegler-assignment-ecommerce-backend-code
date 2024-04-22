const mongoose = require("mongoose");

const UserCarts = mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  cartProductId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("userCarts", UserCarts);
