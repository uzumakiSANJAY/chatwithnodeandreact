const express = require("express");
const {chats} = require("./data/data");
const dotenv = require('dotenv');
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
dotenv.config();

connectDB();
const app = express();

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(express.json()) // to accept JSON Data

app.get('/',(req,res)=>{
    res.send("API is Running")
});

app.use('/api/user',userRoutes);
app.use('/api/chat',chatRoutes);
app.use('/api/message',messageRoutes)



app.use(notFound);
app.use(errorHandler);
app.get('/api/chat/:id',(req,res)=>{
    // console.log(req.params.id)
    const singleChat = chats.find(c=>c._id === req.params.id);
    res.send(singleChat)
});
const port = process.env.PORT || 5000
const server = app.listen(port , console.log(`Server started at ${port}`.yellow.bold));
const io = require('socket.io')(server,{
    pingTimeout : 60000,
    cors :  {
        origin : "http://localhost:3000",
    },
});

io.on("connection",(socket) =>{
    console.log(`Connect to socketIO`);

    socket.on("setup",(userData) =>{
        socket.join(userData._id);
        socket.emit("Connected");
    })

    socket.on("join chat",(room) =>{
        socket.join(room);
        console.log("User Joined Room : " + room)
    });
    socket.on("typing",(room) => socket.in(room).emit("typing"));
    socket.on("stop typing",(room) => socket.in(room).emit("stop typing"));
    socket.on("new message",(newMessageRecieved) =>{
        var chat = newMessageRecieved.chat;

        if(!chat.users){
            return console.log("Chat.users not defined");
        }
        chat.users.forEach(user => {
            if (user._id == newMessageRecieved.sender._id) return;
            socket.in(user._id).emit("Message Recieved",newMessageRecieved)
        });
    });
    socket.off("setup",()=>{
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    })
});