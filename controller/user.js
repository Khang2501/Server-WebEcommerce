const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { validationResult, Result } = require("express-validator");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const User = require("../models/user");
const History = require("../models/history");
const Product = require("../models/product");
const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.postRegister = async (req, res, next) => {
  const password = req.body.password;
  const email = req.body.email;
  const confirmPassword = req.body.password;
  const phone = req.body.phone;
  const fullName = req.body.fullName;
  const role = "customer";
  const auth = { cookie_token: "", date: "" };

  const errors = validationResult(req).errors;
  if (errors.length) {
    const errorData = errors.map((err) => ({ path: err.path, msg: err.msg }));
    return res.status(203).send(errorData);
  }
  const user = new User({
    fullName,
    email,
    auth,
    password,
    confirmPassword,
    phone,
    role,
  });
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  user
    .save()
    .then(() => res.status(201).send({ title: "success" }))
    .catch((err) => res.send(err));
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req).errors;

  if (errors.length) {
    const errorData = errors.map((err) => ({ path: err.path, msg: err.msg }));
    return res.status(203).send(errorData);
  }
  User.findOne({ email: email })
    .then((user) => {
      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword)
        return res
          .status(203)
          .send([{ path: "password", msg: "Password is wrong!" }]);
      const uuid = uuidv4();
      user.auth = { cookie_token: uuid, date: new Date() };
      return user;
    })
    .then((result) => {
      result.save().then(() => {
        return res.status(202).send({
          msg: "Login is Success",
          token: result.auth.cookie_token,
          userName: result.fullName,
        });
      });
    })

    .catch((err) =>
      res.status(203).send([{ path: email, msg: "login is faild!" }])
    );
};

exports.addToCart = async (req, res, next) => {
  const id = req.body.prodId;
  const email = req.body.email;
  const quantity = req.body.quantity;

  const product = await Product.findOne({ _id: id });
  const amountProduct = (await product.amount) >= quantity;
  if (amountProduct) {
    User.findOne({ email: email })
      .then((user) => {
        const cartUser = [...user.cart.items];
        const prodIndex = cartUser.findIndex(
          (prod) => prod.prodId.toString() === id.toString()
        );
        if (prodIndex === -1) {
          cartUser.push({ prodId: id, quantity: quantity });
          user.cart = { items: cartUser };
          return user;
        }
        cartUser[prodIndex].quantity += quantity;
        user.cart = { items: cartUser };
        return user;
      })
      .then((result) => {
        result
          .save()
          .then(() => res.status(201).send("Add to cart successfully!"));
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.status(200).send("Product is sold out");
  }
};

exports.getCart = (req, res) => {
  const email = req.body.email;
  const status = req.body.status;
  User.findOne({ email: email })
    .populate("cart.items.prodId")
    .then((user) => {
      if (status === "checkout") {
        const data = {
          fullName: user.fullName,
          email: user.email,
          phone: "0" + user.phone.toString(),
          cart: user.cart.items.map((item) => ({
            name: item.prodId.name,
            price: item.prodId.price,
            quantity: item.quantity,
          })),
        };

        res.send(data);
      } else {
        res.send(user.cart);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.updateCart = async (req, res) => {
  const email = req.body.email;
  const data = req.body.data;

  //Check amount product
  const product = await Product.find();

  const check = data.map((item) => {
    const filterItem = product.filter((product) => {
      return product._id.toString() === item.prodId.toString();
    })[0];

    return filterItem.amount < item.quantity ? false : true;
  });

  if (check.some((e) => e === false)) {
    res.status(200).send({ msg: "The product is not enough or out of stock" });
  } else {
    User.findOne({ email: email })
      .then((user) => {
        const cartUser = [...user.cart.items];
        const cartFilter = cartUser.filter((item) =>
          data.some((prod) => prod._id.toString() === item._id.toString())
        );
        const cartUpdate = cartFilter.map((item) => {
          const dataUpdateItem = data.find(
            (e) => e._id.toString() === item._id.toString()
          );
          return {
            ...item,
            quantity: dataUpdateItem.quantity,
          };
        });

        user.cart = { items: cartUpdate };
        return user;
      })
      .then((result) => {
        result.save().then(() => {
          res.status(201).send("Updated Success");
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
};
// function format price

function formatNumberToPrice(number) {
  return new Intl.NumberFormat("vi", {
    style: "currency",
    currency: "VND",
  }).format(number);
}

exports.confirmMail = (req, res) => {
  const email = req.body.email;
  const userData = req.body.user;
  User.findOne({ email: email })
    .populate("cart.items.prodId")
    .then((user) => {
      const cart = user.cart.items;

      let total = 0;

      cart.forEach((item) => {
        total += item.prodId.price * item.quantity;
      });
      total = formatNumberToPrice(total);
      transporter.sendMail({
        to: userData.email,
        from: "tailieudahoc@gmail.com",
        subject: "Confirm transaction",
        html: `
        <style>
          h1 {
            margin: 1rem;
          }
          table{
              text-align: center;
          }
          th, td {
          border:1px solid black;
          }
        </style>
        <h1>Xin Chào ${userData.fullName}</h1>
        <p>Phone: ${userData.phone}</p>
        <p>Address: ${userData.address}</p>

        <table style="width:100% ">
          <tr>
              <td>Tên sản phẩm</td>
              <td>Hình ảnh</td>
              <td>Giá</td>
              <td>Số lượng</td>
              <td>Thành tiền</td>

          </tr>
                ${cart.map((item) => {
                  return `<tr>
                    <td>${item.prodId.name}</td>
                    <td>
                      <img
                        src=${item.prodId.img1}
                        alt="photo"
                        width="100"
                        height="100"
                      ></img>
                    </td>
                    <td>${formatNumberToPrice(item.prodId.price)}</td>
                    <td>${item.quantity}</td>
                    <td>${formatNumberToPrice(
                      item.prodId.price * item.quantity
                    )}</td>
                  </tr>`;
                })}
                </tr>
            </table>
            <h1>Tổng thanh toán:</h1>
            <h1>${total}</h1>
            <h1>Xin cảm ơn bạn</h1>
      `,
      });

      for (let i = 0; i < cart.length; i++) {
        Product.find({ _id: cart[i].prodId._id })
          .then((product) => {
            product[0].amount -= cart[i].quantity;
            return product[0];
          })
          .then((prod) => {
            prod.save();
          });
      }

      //Create history

      const history = new History({
        email: user.email,
        userId: user._id,
        name: userData.fullName,
        phone: userData.phone,
        address: userData.address,
        total: total,
        delivery: "Waiting for progressing",
        status: "Waiting for pay",
        product: cart.map((item) => ({
          id: item.prodId._id,
          img: item.prodId.img1,
          name: item.prodId.name,
          price: item.prodId.price,
          quantity: item.quantity,
        })),
      });
      history.save();
      user.cart = { items: [] };
      return user;
    })
    .then((result) => {
      result.save().then(() => {
        res.status(201).send("Order success!");
      });
    })
    .catch((err) => {
      res.status(500).send({ err: { msg: err } });
    });
};
