const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const userOTPVarification = require("../models/userOTPVerificationModel");
const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  pool: true,
  host: `${process.env.EMAIL_HOST}`,
  port: `${process.env.EMAIL_PORT}`,
  secure: true, // use TLS
  auth: {
    user: `${process.env.EMAIL_USER_ID}`,
    pass: `${process.env.EMAIL_USER_PASS}`,
  },
});
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone , password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Feilds");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    pic,
  });
  // sendOTPVarificationEmail(user,res)
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone : user.phone,
      is_admin: user.is_admin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to create the user");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone : user.phone,
      is_admin: user.is_admin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

// const bcrypt = require("bcryptjs");
// const sendOTPVarificationEmail = async({_id , email},res) =>{
//   try {
//     const otp = `${Math.floor(1000 + (Math.random() * 9000))}`
//     // mail options
//     const mailOptions = {
//       from: `Xelpmoc ${process.env.FROM_EMAIL}`,
//       // to: req.body.email_id.trim().toLowerCase(),
//       to : email,
//       subject: "Verify Your Email",
//       html: `<p> Enter ${otp} in the app to verify email address amd complete registration form </p> the otp will expire in 10 minutes`,
//     };

//     const saltRounds = 10;
//     const hashedOTP = await bcrypt.hash(otp , saltRounds);
//     const newOTPVerification = new userOTPVarification({
//       userId : _id,
//       otp : hashedOTP,
//       createdAt : Date.now(),
//       expiresAt : Date.now() + 600000
//     });
//     await newOTPVerification.save();
//     const result = await transport.sendMail(mailOptions);
//     res.json({
//       status : "PENDING",
//       message : "Verification otp email sent",
//       data : {
//         userId : _id,
//         email
//       }
//     })
//     console.log("$$",result)
//     return result
//   } catch (error) {
//     res.json({
//       status : "FAILED",
//       message : error.message
//     })
//   }
// }
module.exports = { 
  allUsers,
  registerUser, 
  authUser 
};