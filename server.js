import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import session from "express-session";
import UserController from "./src/controllers/user.controller.js";
import { connectToDB } from "./config/mongooseConfig.js";
import { auth } from "./src/middlewares/auth.middleware.js";
import { ConnectedUsers } from "./src/schemas/connectedUsers.schema.js";
import { Chats } from "./src/schemas/chat.schema.js";
import validateData from "./src/middlewares/validateUser.middleware.js";

//Creating an instance of UserController Class
const userController=new UserController();

//Creating server using express
const app=express();
app.use(cors());

//Create HTTP Server
const server=http.createServer(app);


//Create Socket server
const io=new Server(server,{
    cors:{
        origin:'*',
        methods:["GET","POST"],
    }
});

//Use Socket Events
io.on("connection",(socket)=>{
    console.log("Connection is Established");

     //Load the Previously Connected Users.
     ConnectedUsers.find().then(connectedUsers=>{
        socket.emit('load_connectedUsers',connectedUsers);
    }).catch(err=>{
        console.log(err);
    });

    //Load previous chats.
    Chats.find().sort({timestamp:1}).limit(50)
    .then(messages=>{
        socket.emit('load_messages',messages);
    }).catch(err=>{
        console.log(err);
    })


    socket.on('connectedUser',async (username)=>{
        //Server need to store this username along with the socketID to the db to load previously connected Users to new users.
        const newConnectedUser=new ConnectedUsers({
            username:username,
            socketID:socket.id,
        });
        await newConnectedUser.save();

        //Server received this username and now server will broadcast this username to all the clients.
        socket.broadcast.emit('broadcast_connectedUsers',username);
    });

    socket.on('new_message',async (data)=>{
        //First server needs to store this data in database and then it should broadcast this message.
        const newChat=new Chats(data);
        await newChat.save();
        //Now server needs to broadcast the message to server.
        socket.broadcast.emit('broadcast_message',data);
    });

    //Server is receiving typing status and now server will broadcast this typing.
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
      });
    
      // Server will receive stop typing event and now server will broadcast this .
      socket.on('stopTyping', (data) => {
        socket.broadcast.emit('stopTyping', data);
      });
    
    //Client Disconnection Event Listener.
    socket.on("disconnect",async ()=>{
        //So when client disconnect server will remove that connectedClient information from database.
        await ConnectedUsers.deleteOne({socketID:socket.id});
        ConnectedUsers.find().then((users)=>{
            socket.broadcast.emit('updated_connectedUsers',users)
        }).catch(err=>{
            console.log(err);
        })
        console.log("Connection is disconnected");
    });
});


//Configuring Session on our server
app.use(session({
    secret:"SecretKey",
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
    }
}));

//Setting up template engine/view engine
app.set('view engine','ejs');
app.set('views',path.resolve('src','views'));

//Serving static files
app.use(express.static(path.resolve('public')));

//Parsing data coming in request body
app.use(express.urlencoded({extended:true}));
app.use(express.json());

//Routes
app.get('/register',userController.getRegistrationView);
app.get('/login',userController.getLoginView);
app.post('/register',validateData,userController.postRegister);
app.post('/login',userController.postLogin);
app.post('/verifyOtp',userController.verifyAndRegister);
app.get('/resend-otp',userController.resendOtp);

//Handle Default Request
app.get('/',auth,(req,res)=>{
    res.render('client',{name:req.session.userName});
});


//Port number on which server is running
server.listen(3000,()=>{
    console.log("Server is running at 3000");
    connectToDB();
})