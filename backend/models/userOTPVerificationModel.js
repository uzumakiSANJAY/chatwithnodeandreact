const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userOTPVerificationSchema = mongoose.Schema({
    userId : { type: "String", required: true },
    otp : { type: "String", required: true },
    createdAt : Date,
    expiredAt : Date,
    is_used: {
        type: Boolean,
        required: true,
        default: false,
      },

});
userOTPVerificationSchema.methods.matchOTP = async function (enteredOtp) {
    return await bcrypt.compare(enteredOtp, this.otp);
  };
const userOTPVarification = mongoose.model("userOTPVarification",userOTPVerificationSchema);
module.exports = userOTPVarification;