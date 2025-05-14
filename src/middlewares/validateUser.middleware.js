import { body,validationResult } from "express-validator";

const validateData=async (req,res,next)=>{
    // 1.Setup rules for validation 
    const rules=[
        body('name').notEmpty().withMessage("Name is Required"),
        body('email').isEmail().withMessage('Enter a valid email'),
        body('password').isStrongPassword().withMessage('Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol')
    ];
    // 2.Run these rules
    await Promise.all(rules.map((rule)=>rule.run(req)));

    // 3.Check if there are any errors
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.render('registration',{message:errors.array()[0].msg});
    }else{
        next();
    }
}
export default validateData;