const express = require("express");
const User = require("../models/userModel");
const verification = require("../models/verificationModel");
const responseFunction = require("../utils/responseFunction");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authTokenHandler = require("../middlewares/checkAuthToken");



const mailer = async (receiveremail, code)=>  {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, 
        requireTLS: true,
        auth: {
            user: process.env.COMPANY_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    })

    let info = await transporter.sendMail({
        from: "My Teachers team", 
        to: receiveremail,
        subject: "OTP for My Teachers Team",
        text: `Your OTP is ${code}`,
        html: `<b>Your OTP is ${code}</b>`
    })

    console.log("Message sent: %s", info.messageId);

    if(info.messageId) {
        return true;
    }

    return false;
}

router.get('/', (req, res) => {
    res.json({
        message: "Auth route home"
    })
})

router.post('/sendotp', async (req, res, next) => {
    const {email} = req.body;
    if(!email) {
        return responseFunction(res, 400, "Email is required", null, false);
    }
    try {
        await verification.deleteMany({email});
        const code = Math.floor(100000 + Math.random() * 900000);
        const isSent = await mailer(email, code);

        const newVerification = new verification({
            email: email,
            code: code
        })

        await newVerification.save();
        if(!isSent) {
            return responseFunction(res, 500, "Email not sent", null, false);
        }

        return responseFunction(res, 200, "OTP sent successfully", null, true);
    } catch (error) {
        return responseFunction(res, 500, error.message, null, false);
    }
})

router.post('/register', async (req, res, next) => {
    
    const { name, email, password, role, otp } = req.body;

    if(!name || !email || !password || !role || !otp) {
        return responseFunction(res, 400, "All fields are required", null, false);
    }
    if(password.length < 6) {
        return responseFunction(res, 400, "Password must be at least 6 characters", null, false);
    }

    try {
        let user = await User.findOne({email});
        let verificationQueue = await verification.findOne({email});

        if(user) {
            return responseFunction(res, 400, "User already exists", null, false);
        }

        if(!verificationQueue) {
            return responseFunction(res, 400, "Please send OTP first", null, false);
        }

        const isMatch = await bcrypt.compare(otp, verificationQueue.code);

        if(!isMatch) {
            return responseFunction(res, 400, "Invalid OTP", null, false);
        }

        user = new User({
            name,
            email,
            password,
            role
        })
        await user.save();
        await verification.deleteOne({email});

        const authToken = jwt.sign({
            userId: user._id
        }, process.env.JWT_SECRET_KEY,{ expiresIn: "1d" });

        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET_KEY, {
            expiresIn: "10d"});

            const isProduction = process.env.NODE_ENV === 'production';

        
        res.cookie("authToken", authToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "none",
            path: '/'
        });
        
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "none",
            path: '/'
        })

        user.password = undefined;
        return responseFunction(res, 200, "User registered successfully", {user, authToken, refreshToken }, true);

    } catch (error) {
        return responseFunction(res, 500, error.message, null, false);
    }
})

router.post('/login', async (req, res , next) => {
    
    try{
        const { email, password } = req.body;
        const user = await User.findOne({email});
        if(!user) {
            return responseFunction(res, 400, "User not found", null, false);
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return responseFunction(res, 400, "Invalid credentials", null, false);
        }

        const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY,{ expiresIn: "1d" });

        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET_KEY, {expiresIn: "10d"});

        user.password = undefined;
        const isProduction = process.env.NODE_ENV === 'production';


        res.cookie("authToken", authToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "none",
            path: '/'
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "none",
            path: '/'
        });

        return responseFunction(res, 200, "User logged in successfully", {user, authToken, refreshToken}, true);

    } catch (error) {
        return responseFunction(res, 500, error.message, null, false);
    }
})


router.get('/checklogin', authTokenHandler, async (req, res, next) => {
    try {
        res.json({
            ok: req.ok,
            message: req.message,
            userId: req.userId
        })

    } catch (error) {
        console.error("Error in /checklogin route", error);
    res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
})

router.get('/getuser', authTokenHandler, async (req, res, next) => {
    console.log('Cookies in the request:', req.cookies);
    try {
        const user = await User.findById(req.userId).select("-password");

        if(!user) {
            return responseFunction(res, 400, "User not found", null, false);
        }

        return responseFunction(res, 200, "User found", user, true);
    } catch (error) {
        return responseFunction(res, 500, "Internal server error", err, false);
    }
})

router.get('/logout', authTokenHandler,  async (req, res, next) => {

    const isProduction = process.env.NODE_ENV === 'production';

    res.clearCookie("authToken", {
        path: '/',
        httpOnly: true,
        secure: isProduction, 
        sameSite: 'none'
    });
    res.clearCookie("refreshToken", {
        path: '/',
        httpOnly: true,
        secure: isProduction, 
        sameSite: 'none'
    });

    res.json({
        ok: true,
        message: "Logged out successfully"
    })
})

module.exports = router;