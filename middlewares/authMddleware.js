import users from "../models/users.js"
import jwt from "jsonwebtoken"


const checkUser = async (req, res, next) => {
    try {
        const token = req.cookies.jsonwebtoken;

        if (!token) {
            res.locals.user = null;
            return next();
        }

        const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
        const user = await users.findById(decodedToken.id);

        res.locals.user = user || null;
        next();
    } catch (err) {
        console.log(err.message);
        res.locals.user = null;
        next();
    }
};


const authenticateToken = async (req, res, next) => {
    try {
        const token = req.cookies.jsonwebtoken
        
        if(token) {
            jwt.verify(token, process.env.JWT_SECRET, (err) => {
                if(err) {
                    console.log(err.message);
                    res.redirect("/")
                } else {
                    next()
                }
            })
        } else {
           res.redirect("/")
        }

    } catch (error) {
        console.error("Token doğrulama hatası:", error);
        res.status(401).json({
            succeeded: false,
            error: "Not authorized"
        });
    }
};


export { authenticateToken, checkUser }
