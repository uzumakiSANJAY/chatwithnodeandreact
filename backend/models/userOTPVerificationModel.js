const mongoose = require("mongoose");


const userOTPVerificationSchema = mongoose.Schema({
    userId : { type: "String", required: true },
    otp : { type: "String", required: true },
    createdAt : Date,
    expiredAt : Date,

});

const userOTPVarification = mongoose.model("userOTPVarification",userOTPVerificationSchema);
module.exports = userOTPVarification;