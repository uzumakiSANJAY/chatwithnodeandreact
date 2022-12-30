const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.USER_VERIFICATION_TOKEN_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = generateToken;