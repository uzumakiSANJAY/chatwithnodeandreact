const mongoose = require('mongoose')

const chatModel = mongoose.Schema(
    {
        chat_name : {type : String , trim : true},
        is_groupchat : {type : Boolean , default : false},
        users : [
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : "User",
            },
        ],
        latest_message:{
            type : mongoose.Schema.Types.ObjectId,
            ref : "Message"
        },
        groupAdmin : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
        },
    },
    {
        timestamps : true,
    }
);
const Chat = mongoose.model("Chat",chatModel);

module.exports = Chat;