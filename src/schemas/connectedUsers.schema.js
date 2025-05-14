import mongoose from "mongoose";

export const connectedUsersSchema=new mongoose.Schema({
    username:String,
    socketID:{
        type:String,
        unique:[true,"SocketID is not unique"],
    }
});
export const ConnectedUsers=mongoose.model('ConnectedUsers',connectedUsersSchema);