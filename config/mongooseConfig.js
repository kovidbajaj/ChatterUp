import mongoose from "mongoose";

export const connectToDB=async ()=>{
    try{
    await mongoose.connect(process.env.DB_URL);
    console.log("MongoDB connected using Mongoose");
    }catch(err){
        console.log("Error while connecting to MongoDB");
        console.log(err);
    }
}
