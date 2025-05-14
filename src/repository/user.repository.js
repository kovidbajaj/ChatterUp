import mongoose from "mongoose";
import { userSchema } from "../schemas/user.schema.js";
const UserModel=mongoose.model('Users',userSchema);

export default class UserRepository{
    static async signup(user){
        try{
            //Creating instance of model.
        const newUser=new UserModel(user);
        await newUser.save();
        }catch(err){
            throw new Error(err);
        }
    }

    static async findByEmail(email){
        try{
       return await  UserModel.findOne({email:email});
        }catch(err){
            throw new Error("Something went Wrong with the database.");
        }
    }
}