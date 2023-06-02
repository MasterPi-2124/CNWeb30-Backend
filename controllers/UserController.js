const userService = require("../services/UserService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const user = req.body;
    let existUser = await userService.findUserByEmail(user.email);
    if (existUser == null) {
      bcrypt
        .hash(user.password, 10)
        .then((hashedPassword) => {
          const newUser = {
            userName: user.userName,
            email: user.email,
            password: hashedPassword,
          };
          userService.createUser(newUser).then((result) => {
            const { password: password, ...returnUser } = result._doc;
            res.json({ data: returnUser, status: "success" });
          });
        })
        .catch((err) => {
          res.status(500).json({ error: err.message });
        });
    } else {
      res.status(400).json({ message: "Email has been used" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const user = req.body;
    userService.findUserByEmail(user.email)
      .then((result) => {
        const existUser = result._doc;
        bcrypt
          .compare(user.password, existUser.password)
          .then((passwordCheck) => {
            if (!passwordCheck) {
              res.status(400).json({ error: "User and password incorrect" });
            }

            const token = jwt.sign(
              {
                userId: user._id,
                userEmail: user.email,
              },
              userService.secretKey,
              {
                expiresIn: "24h",
              }
            );

            const { password: password, ...returnUser } = existUser;
            res.json({ data: {token: token, user: returnUser}, status: "success" });
          })
          .catch((err) => {
            res.status(400).json({ error: err.message });
          });
      })
      .catch(() => {
        res.status(400).json({ error: "User and password incorrect" });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
