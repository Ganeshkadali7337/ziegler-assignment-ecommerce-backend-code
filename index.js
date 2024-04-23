const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const BuyersProfiles = require("./buyersModel");
const SellerProfiles = require("./sellersModel");
const UserCarts = require("./cartModel");
const Products = require("./productsModel");
const jwt = require("jsonwebtoken");
const cors = require("cors");

app.use(cors());

app.use(express.json());

const PORT = process.env.PORT || 3000;

const authenticate = (req, res, next) => {
  let jwtToken;
  const authHeader = req.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    res.status(401);
    res.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "ganesh", async (error, payload) => {
      if (error) {
        res.status(401);
        res.send("Invalid JWT Token");
      } else {
        req.userId = payload.id;
        next();
      }
    });
  }
};

mongoose
  .connect("mongodb+srv://ganesh:ganesh@cluster7337.7exrzd7.mongodb.net/")
  .then(() => console.log("db connected..."));

app.post("/addBuyer", async (req, res) => {
  try {
    const { name, mail, password, confirmPassword, user } = req.body;
    let existed = await BuyersProfiles.findOne({ mail });
    if (existed) {
      return res.status(400).send("user already existed");
    }
    if (password !== confirmPassword) {
      return res.status(400).send("password did not match");
    }
    let hashedPassword = await bcrypt.hash(password, 10);
    let newBuyer = new BuyersProfiles({
      name,
      mail,
      password: hashedPassword,
      user,
      role: "BUYER",
    });
    await newBuyer.save();
    res.status(200).send("user registered successfully");
  } catch (err) {
    console.log(err.message);
    res.send(err.message);
  }
});

app.post("/addSeller", async (req, res) => {
  try {
    const { name, mail, password, confirmPassword } = req.body;
    let existed = await SellerProfiles.findOne({ mail });
    if (existed) {
      return res.status(400).send("user already existed");
    }
    if (password !== confirmPassword) {
      return res.status(400).send("password did not match");
    }
    let hashedPassword = await bcrypt.hash(password, 10);
    let newSeller = new SellerProfiles({
      name,
      mail,
      password: hashedPassword,
      role: "SELLER"
    });
    await newSeller.save();
    res.status(200).send("user registered successfully");
  } catch (err) {
    console.log(err.message);
    res.send(err.message);
  }
});

app.post("/buyerLogin", async (req, res) => {
  try {
    const { mail, password } = req.body;
    const existed = await BuyersProfiles.findOne({ mail });
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      let passwordMatch = await bcrypt.compare(password, existed.password);
      if (!passwordMatch) {
        return res.status(400).send("invalid password");
      } else {
        let payload = {
          id: existed.id,
        };
        let token = jwt.sign(payload, "ganesh");
        res.send({ token });
      }
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.post("/sellerLogin", async (req, res) => {
  try {
    const { mail, password } = req.body;
    const existed = await SellerProfiles.findOne({ mail });
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      let passwordMatch = await bcrypt.compare(password, existed.password);
      if (!passwordMatch) {
        return res.status(400).send("invalid password");
      } else {
        let payload = {
          id: existed.id,
        };
        let token = jwt.sign(payload, "ganesh");
        res.send({ token });
      }
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.post("/seller/addProduct", authenticate, async (req, res) => {
  let { userId } = req;
  const { img, name, price, actualPrice, user } = req.body;
  const existed = await SellerProfiles.findOne({ _id: userId });
  try {
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      const newProduct = new Products({
        img,
        name,
        price,
        actualPrice,
        seller: userId,
        user,
      });
      await newProduct.save();
      res.send("product added successfully");
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.get("/seller/getProducts", authenticate, async (req, res) => {
  let { userId } = req;
  const existed = await SellerProfiles.findOne({ _id: userId });
  try {
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      let allProducts = await Products.find();
      let sellerProducts = allProducts.filter((each) => each.seller === userId);
      res.send(sellerProducts);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.delete("/seller/deleteProduct/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  console.log(id);
  let { userId } = req;
  const existed = await SellerProfiles.findOne({ _id: userId });
  try {
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      await Products.findByIdAndDelete(id);
      res.send(`product ${id} is deleted`);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.get("/buyer/getProducts", authenticate, async (req, res) => {
  let { userId } = req;
  const existed = await BuyersProfiles.findOne({ _id: userId });
  try {
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      let allProducts = await Products.find();
      if (existed.user === "PRIME") {
        res.send(allProducts);
      } else {
        let productsForBuyer = allProducts.filter(
          (each) => each.user === existed.user
        );
        res.send(productsForBuyer);
      }
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.post("/buyer/addCartProduct", authenticate, async (req, res) => {
  let { userId } = req;
  let { productId } = req.body;
  const existed = await BuyersProfiles.findOne({ _id: userId });
  try {
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      const newCartProduct = new UserCarts({
        user: userId,
        cartProductId: productId,
      });
      await newCartProduct.save();
      res.send("product added to cart successfully");
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.delete("/buyer/deleteCartProduct/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  console.log(id);
  let { userId } = req;
  const existed = await BuyersProfiles.findOne({ _id: userId });
  try {
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      await UserCarts.findByIdAndDelete(id);
      res.send(`cart product ${id} is deleted`);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.get("/buyer/getCartProducts", authenticate, async (req, res) => {
  let { userId } = req;
  const existed = await BuyersProfiles.findOne({ _id: userId });
  try {
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      let cartProducts = await UserCarts.find();
      let userCartProducts = cartProducts.filter(
        (each) => each.user === userId
      );
      res.send(userCartProducts);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.get("/buyer/getProfile", authenticate, async (req, res) => {
  let { userId } = req;
  const existed = await BuyersProfiles.findOne({ _id: userId });
  try {
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      res.send(existed);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.get("/seller/getProfile", authenticate, async (req, res) => {
  let { userId } = req;
  const existed = await SellerProfiles.findOne({ _id: userId });
  try {
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      res.send(existed);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.listen(PORT, () => console.log("server running..."));
