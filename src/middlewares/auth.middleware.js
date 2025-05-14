export function auth(req,res,next){
    if(req.session.userEmail){
        next();
    }else{
        return res.redirect('/login');
    }
}