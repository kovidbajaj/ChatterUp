import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import UserModel from '../models/user.model.js';
import UserRepository from '../repository/user.repository.js';
export default class UserController{
    //METHOD 1
    getRegistrationView(req,res){
        res.render('registration',{message:null});
    }

    //METHOD 2
    getLoginView(req,res){
        res.render('login',{message:null});
    }

    //METHOD 3
    async postRegister(req,res){
        const{name,email,password}=req.body;
        //generate otp first
        const otp = Math.floor(1000 + Math.random() * 9000);
        req.session.tempUser={name,email,password,otp};

        //send the mail
        const transporter=nodemailer.createTransport({
            service:"gmail",
            auth:{
                user:process.env.USER,
                pass:process.env.PASS,
            }
        });
        const mailOptions={
            from:"iamkovidbajaj327@gmail.com",
            to:email,
            subject:"Verify your email",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="text-align: center; color: #333;">Email Verification</h2>
                <p>Dear User,</p>
                <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #4CAF50;">${otp}</span>
                </div>
                <p>If you did not request this, please ignore this email.</p>
                <br/>
                <p>Regards,<br/>Team Kovid</p>
            </div>
        `
        }
        try{
        await transporter.sendMail(mailOptions);
        res.render('verifyOtp',{userEmail:email});
        }catch(err){
            console.log(err);
            res.render('registration',{message:'Failed to send OTP email'});
        }
    }

    //METHOD 4
    async verifyAndRegister(req,res){
        const{firstDigit,secondDigit,thirdDigit,fourthDigit}=req.body;
        const otp=Number(firstDigit+secondDigit+thirdDigit+fourthDigit);
        if(req.session.tempUser.otp===otp){
            //register the user now in db
            const{name,email,password}=req.session.tempUser; //Destructuring
            try{
            const hashedPassword=await bcrypt.hash(password,12);
            const newUser=new UserModel(name,email,hashedPassword);
            await UserRepository.signup(newUser);
            return res.render('login',{message:"Successfully Registered.Please Enter your credentials to login"})
            }catch(err){
                const arr=err.message.split(":");
                return res.render('registration',{message:arr[1]});
            }
        }else{
            return res.render('registration',{message:"Incorrect OTP. Please Register Again"});
        }
    }

    //METHOD 5
    async postLogin(req,res){
        const {email,password}=req.body;
        //First find the document by this email that whether this email exists or not in collection.
        try{
        const user=await UserRepository.findByEmail(email);
        if(!user){
            return res.render('login',{message:"Invalid Credentials"})
        }
        const result=await bcrypt.compare(password,user.password);
        if(result){
            req.session.userEmail=email;
            req.session.userName=user.name;
            return res.redirect('/');
        }else{
            return res.render('login',{message:"Invalid Credentials"});
        }
    }catch(err){
        return res.send(err.message);
    }
}

//METHOD 6
async resendOtp(req,res){
    const{name,email,password}=req.session.tempUser;
    //Generate a new OTP
    const newOtp=Math.floor(1000 + Math.random() * 9000);
    req.session.tempUser.otp=newOtp;

    //Now Send the mail with new OTP to user
    const transporter=nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:process.env.USER,
            pass:process.env.PASS,
        }
    });
    const mailOptions={
        from:"iamkovidbajaj327@gmail.com",
        to:email,
        subject:"Verify your email",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="text-align: center; color: #333;">Email Verification</h2>
            <p>Dear User,</p>
            <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #4CAF50;">${newOtp}</span>
            </div>
            <p>If you did not request this, please ignore this email.</p>
            <br/>
            <p>Regards,<br/>Team Kovid</p>
        </div>
    `
    }
    try{
        await transporter.sendMail(mailOptions);
        return res.render('verifyOtp',{userEmail:email});
        }catch(err){
            console.log(err);
            return res.render('registration',{message:'Failed to send OTP email'});
        }
}
};