const express = require("express");
// const bcrypt = require("bcryptjs");
const {
  registerUser,
  authUser,
  allUsers,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");
// const User = require("../models/userModel");
// const userOTPVarification = require("../models/userOTPVerificationModel");

const router = express.Router();

router.route("/").get(protect, allUsers);
router.route("/").post(registerUser);
router.post("/login", authUser);
// router.post("/varifyOTP", async (req,res)=>{
//   try {
//     let {userId , otp} = req.body;
//     if (!userId || !otp) {
//       throw Error ("Empty OTP details");
//     }
//     else{
//       const userOTPVerificationRecords= await userOTPVarification.find({
//         userId,
//       });
//       if (userOTPVerificationRecords.length <= 0){
//         throw new Error (
//           "Accout record doesn't exist or has been verified already.Please sign up or login."
//         )
//       }
//       else{
//         const {expiresAt} = userOTPVerificationRecords[0];
//         const hashedOTP = userOTPVerificationRecords[0].otp;

//         if(expiresAt < Date.now()){
//           userOTPVarification.deleteMany({userId});
//           throw new Error (
//             "Code has expired.Please request again."
//           )
//         }
//         else{
//           const validOTP = bcrypt.compare(otp , hashedOTP);
//           if (!validOTP) {
//             throw new Error ("Invalid code passed.Check Your Inbox");
//           }
//           else{
//             //Success
//             await User.updateOne({_id : userId},{verified : true})
//             await userOTPVarification.deleteMany({userId});
//             res.json({
//               status : "VERIFIED",
//               message : `User email has been verified successfully`
//             })
//           }
//         }
//       }
//     }
//   } catch (error) {
//     res.json({
//       status : "FAILED",
//       message : error.message
//     })
//   }
// });

module.exports = router;