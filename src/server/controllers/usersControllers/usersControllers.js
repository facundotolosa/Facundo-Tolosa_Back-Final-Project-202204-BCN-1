const debug = require("debug")("amazingSM:server:controllers:userControllers");
const chalk = require("chalk");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const User = require("../../../database/models/User");
const encryptPassword = require("../../../utils/encryptPassword");

const userRegister = async (req, res, next) => {
  const { name, username, password, image } = req.body;

  const user = await User.findOne({ username });
  if (user) {
    const err = new Error();
    err.code = 409;
    err.message = "User already exists";
    next(err);

    return;
  }

  try {
    const encryptedPassword = await encryptPassword(password);

    const newUser = await User.create({
      username,
      password: encryptedPassword,
      name,
      image,
    });

    debug(chalk.greenBright("User created"));

    const newUserWithoutPassword = {
      username: newUser.username,
      name: newUser.name,
      image: newUser.image,
      notes: newUser.notes,
      id: newUser.id,
    };

    res.status(201).json(newUserWithoutPassword);
  } catch (err) {
    err.code = 400;
    err.message = "Bad request";
    next(err);
  }
};

const userLogin = async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    debug(chalk.redBright("Username or password incorrect"));
    const err = new Error();
    err.code = 403;
    err.message = "Username or password incorrect";

    next(err);
    return;
  }

  const userData = {
    id: user.id,
    name: user.name,
    username: user.username,
    image: user.image,
  };

  const rightPassword = await bcrypt.compare(password, user.password);

  if (!rightPassword) {
    debug(chalk.redBright("Username or password incorrect"));
    const err = new Error();
    err.code = 403;
    err.message = "Username or password incorrect";

    next(err);
    return;
  }

  const token = jsonwebtoken.sign(userData, process.env.JWT_SECRET);
  res.status(200).json({ token });
};

module.exports = { userRegister, userLogin };