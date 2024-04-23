const mongoose = require("mongoose");

const BuyersProfiles = mongoose.Schema({
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
  user: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("buyersProfiles", BuyersProfiles);
