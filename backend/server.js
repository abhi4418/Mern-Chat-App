const express = require("express") ;
const app = express() ;
const dotenv = require("dotenv")
dotenv.config()
const {chats} = require("./data/data.js")
const cors = require('cors');
const connectDB = require("./config/db.js");
const userRoutes = require('./routes/userRoutes.js');
const chatRoutes = require('./routes/chatRoutes.js') ;
const messageRoutes = require('./routes/messageRoutes.js') ;
const { notFound, errorHandler } = require("./middleware/errorMiddleware.js");
const path = require('path') ;
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');

app.use(cors()) ;
connectDB() ;
app.use(express.json()) ;

app.use('/api/user' , userRoutes);
app.use('/api/chat' , chatRoutes) ;
app.use('/api/message' , messageRoutes) ;

/*-------DEPLOYMENT------------------ */

const __dirname1 = path.resolve() ;
if(process.env.NODE_ENV === 'production'){
    app.use(express.static(path.join(__dirname1 , '/frontend/dist'))) ;

    app.get('*' , (req,res)=>{
        res.sendFile(path.resolve(__dirname1 , "frontend" , "dist" , "index.html")) ;
    })
}
else {
    app.get('/' , (req,res)=>{
        res.send('API is running')
    })
}

/*-------DEPLOYMENT------------------ */

app.use(notFound) ; 
app.use(errorHandler)

const PORT = process.env.PORT || 3000 ;

const server = app.listen(PORT , console.log(`Started on port PORT ${PORT}`)) ;

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = await User.findById(decoded.id).select('-password');
    if (!socket.user) {
      return next(new Error('Authentication error: User not found'));
    }
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on("connection" , (socket)=>{
    socket.on('setup' , (userData)=>{
        socket.join(userData._id) ;
        socket.emit('connected') ;
    })

    socket.on('join chat' , (room)=>{
        socket.join(room) ;
    })

    socket.on('typing' , (room)=> socket.in(room).emit('typing') )

    socket.on('stop typing' , (room)=> socket.in(room).emit('stop typing'))

    socket.on('new message' , (newMessageRecieved)=>{
        var chat = newMessageRecieved.chat ;

        if(!chat.users){
            return ;
        }

        chat.users.forEach(user => {
            if(user._id == newMessageRecieved.sender._id){
                return ;
            }

            socket.in(user._id).emit("message recieved" , newMessageRecieved) ;
        })
    }) ;

    socket.off('setup' , ()=>{
        socket.leave(userData._id) ;
    })
})

