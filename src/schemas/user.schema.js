import mongoose from "mongoose";

export const userSchema=new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:[true,"You are already registered with this email address."],
    },
    password:String
});