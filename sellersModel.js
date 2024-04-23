const mongoose = require("mongoose");

const SellerProfiles = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mail: {
    type: String,
    require: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("sellerProfiles", SellerProfiles);
