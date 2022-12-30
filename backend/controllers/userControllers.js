const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const userOTPVarification = require("../models/userOTPVerificationModel");
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');


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
  // Generate a verification token with the user's ID
  const verificationToken = await user.generateVerificationToken();
  const url = `http://localhost:5000/api/user/verify/${verificationToken}`;
  transport.sendMail({
    to: email,
    subject: 'Verify Account',
    html: `Click <a href = ${url}>here</a> to confirm your email.`
  })
  return res.status(201).send({
    message: `Sent a verification email to ${email}`
  });
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    if (user.is_varified === true) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone : user.phone,
        is_admin: user.is_admin,
        is_varified : user.is_varified,
        pic: user.pic,
        token: generateToken(user._id)
      });
    } else {
      res.json({status : false , message : "User is not varified !! Verify first and the try to login"})
    }
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

const authUserOTPSend = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  sendOTPVarificationEmail({_id : user._id , email },res);
});

const authUserOTPLogin = asyncHandler(async (req, res) => {
  const { email , otp} = req.body;
  const user = await User.findOne({ email });
  const otpMatch = await userOTPVarification.findOne({userId : user._id}).limit(1).sort({$natural:-1})
  if (user && (await otpMatch.matchOTP(otp))) {
    if (user.is_varified === true) {
      if (otpMatch.is_used === false) {
        var newvalues = { $set:  {is_used : true} };
        await otpMatch.updateOne(newvalues);
        res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone : user.phone,
        is_admin: user.is_admin,
        is_varified : user.is_varified,
        pic: user.pic,
        token: generateToken(user._id)
      });  
      } else {
        res.json({status : false , message : "OTP is already used!!!!!!"})
      }
    } else {
      res.json({status : false , message : "User is not varified !! Verify first and the try to login"})
    }
  } else {
    res.status(401);
    throw new Error("Invalid OTP");
  }
});

const forgetPasswordEmailOtpSend = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  sendOTPVarificationEmail({_id : user._id , email },res);
});

const forgetPasswordChange = asyncHandler(async (req, res) => {
  const { email , otp } = req.body;
  var {password} = req.body;
  const user = await User.findOne({ email });
  const otpMatch = await userOTPVarification.findOne({userId : user._id}).limit(1).sort({$natural:-1})
  if (user && (await otpMatch.matchOTP(otp))) {
    if (user.is_varified === true) {
      if (otpMatch.is_used === false) {
        var newvaluesOTP = { $set:  {is_used : true} };
        await otpMatch.updateOne(newvaluesOTP);
        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);
        var newvaluesPassword = { $set:  {password : password} };
        await user.updateOne(newvaluesPassword);
        res.json({status : true , message : "Password Has Changed Successfully !!! Login with new your password"});  
      } else {
        res.json({status : false , message : "OTP is already used!!!!!!"})
      }
    } else {
      res.json({status : false , message : "User is not varified !! Verify first and the try to login"})
    }
  } else {
    res.status(401);
    throw new Error("Invalid OTP");
  }
});

const otpVerificationController = async (req,res)=>{
  try {
    let {userId , otp} = req.body;
    if (!userId || !otp) {
      throw Error ("Empty OTP details");
    }
    else{
      const userOTPVerificationRecords= await userOTPVarification.find({
        userId,
      });
      if (userOTPVerificationRecords.length <= 0){
        throw new Error (
          "Accout record doesn't exist or has been verified already.Please sign up or login."
        )
      }
      else{
        const {expiresAt} = userOTPVerificationRecords[0];
        const hashedOTP = userOTPVerificationRecords[0].otp;

        if(expiresAt < Date.now()){
          userOTPVarification.deleteMany({userId});
          throw new Error (
            "Code has expired.Please request again."
          )
        }
        else{
          const validOTP = bcrypt.compare(otp , hashedOTP);
          if (!validOTP) {
            throw new Error ("Invalid code passed.Check Your Inbox");
          }
          else{
            //Success
            await User.updateOne({_id : userId},{verified : true});
            await userOTPVarification.deleteMany({userId});
            res.json({
              status : "VERIFIED",
              message : `User email has been verified successfully`
            })
          }
        }
      }
    }
  } catch (error) {
    res.json({
      status : "FAILED",
      message : error.message
    })
  }
}
const resendOTPVerificaionController = async(req,res)=>{
  try {
    let { userId, email } = req.body;

    if(!userId || !email){
      throw Error("Empty user details are not allowed")
    }else{
      // delete existing records and resend
      await userOTPVarification.deleteMany({userId});
      sendOTPVarificationEmail({_id : userId , email },res);
    }
  } catch (error) {
    res.json({
      status : "FAILED",
      message :  error.message,
    })
  }
}
const bcrypt = require("bcryptjs");
const sendOTPVarificationEmail = async({_id , email},res) =>{
  try {
    const otp = `${Math.floor(1000 + (Math.random() * 9000))}`
    // mail options
    const mailOptions = {
      from: `Xelpmoc ${process.env.FROM_EMAIL}`,
      // to: req.body.email_id.trim().toLowerCase(),
      to : email,
      subject: "Verify Your Email",
      html: `<p> Enter ${otp} in the app to verify email address amd complete registration form </p> the otp will expire in 10 minutes`,
    };

    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp , saltRounds);
    const newOTPVerification = new userOTPVarification({
      userId : _id,
      otp : hashedOTP,
      createdAt : Date.now(),
      expiresAt : Date.now() + 600000
    });
    await newOTPVerification.save();
    const result = await transport.sendMail(mailOptions);
    res.json({
      status : "PENDING",
      message : "Verification otp email sent",
      data : {
        userId : _id,
        email
      }
    })
    console.log("$$",result)
    return result
  } catch (error) {
    res.json({
      status : "FAILED",
      message : error.message
    })
  }
}

const verifyEmail = async (req, res) => {
  const token  = req.params.id

  // Check we have an id
  if (!token) {
      return res.status(422).send({ 
           message: "Missing Token" 
      });
  }
  // Step 1 -  Verify the token from the URL
  let payload = null
  try {
      payload =  jwt.verify(
         token,process.env.USER_VERIFICATION_TOKEN_SECRET
         );
  } catch (err) {
    console.log(err)
      return res.status(500).send(err);
  }
  try{
      // Step 2 - Find user with matching ID
      const user = await User.findOne({ _id: payload.ID }).exec();
      if (!user) {
         return res.status(404).send({ 
            message: "User does not  exists" 
         });
      }
      // Step 3 - Update user verification status to true
      if (user.is_varified === false) {
        var newvalues = { $set:  {is_varified : true} };
        await user.updateOne(newvalues);
        return res.status(200).send({
            message: "Account Verified"
      });
      } else {
        return res.status(404).send({
          message: "Account is already verified !!! Please Login !!!"
    });
      }
      
   } catch (err) {
      return res.status(500).send(err);
   }
}
module.exports = { 
  allUsers,
  registerUser, 
  authUser ,
  sendOTPVarificationEmail, 
  otpVerificationController,
  resendOTPVerificaionController,
  verifyEmail,
  authUserOTPSend,
  authUserOTPLogin,
  forgetPasswordEmailOtpSend,
  forgetPasswordChange
};