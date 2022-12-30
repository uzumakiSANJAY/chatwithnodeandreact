const express = require("express");
const {chat} = require("../data/data")
const {
  registerUser,
  authUser,
  allUsers,
  otpVerificationController,
  resendOTPVerificaionController,
  verifyEmail,
  authUserOTPSend,
  authUserOTPLogin,
  forgetPasswordEmailOtpSend,
  forgetPasswordChange
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, allUsers);
router.route("/").post(registerUser);
router.post("/login", authUser);
// Login With OTP
router.route("/loginOTP").post(authUserOTPSend);
router.route("/loginOTPLogin").post(authUserOTPLogin);
//Verify ID
// router.route('/verify/:id').get(verifyEmail);
router.route("/verify/:id").get(verifyEmail);
//OTP Verification
router.route("/verifyOTP").post(otpVerificationController);
// Resend OTP Verification
router.route("/resendOTPVerificaion").post(resendOTPVerificaionController);
// Forget Password
router.route("/forgetPasswordOtpSend").post(forgetPasswordEmailOtpSend);
router.route("/forgetPasswordChangePassword").post(forgetPasswordChange);

module.exports = router;