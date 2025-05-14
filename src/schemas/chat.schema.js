import mongoose from "mongoose";

const chatSchema=new mongoose.Schema({
    username:String,
    message:String,
    timestamp:String,
});

export const Chats=mongoose.model("Chats",chatSchema);