const router = require('express').Router();
const User = require('../models/user.model');
const Session = require('../models/session.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const validator = require("email-validator");
const sendEmail = require("../email/sendEmail");
const { passwordBcrypt, generateTokenSignin, decodeToken } = require("../helper/index");

router.post('/login', async(req, res) => {
    try {
        const { username, password } = req.body;
        // validation
        if (!username || !password ) return res.json({ success: false, message: "Missing username or password"});

        // check if the username available
        const fetchedUser = await User.findOne({ username }).then(user => user).catch(err => err);

        // if no user found then return success false
        if (!fetchedUser) return res.json({ success: false, message: "Missing username or password"}); 
        
        // check if the user is isVerified
        if (!fetchedUser.isVerified) return res.json({ success: false, message: "User account not yet Verified."}); 
        
        //check if passwords are the same
        const isPasswordMatch = await passwordBcrypt(password, "compare", fetchedUser.password);

        // if passwords are not match
        if (!isPasswordMatch) res.json({ success: false, message: "Password is incorrect."});

        // check the session if the userId exists and has token;
        const userId = fetchedUser._id.toString();
        // generate token valid for 1hr.
        const generatedToken = await generateTokenSignin({ username, userId });

        // if failed generating a token
        if (!generatedToken.success) res.json({ success: false, message: generatedToken.err });

        const hasSession = await Session.findOne({ userId }).then(session=> session).catch(err => err);

        if (hasSession) {
            // delete the existing session
            await Session.deleteOne({ userId }).then(result => result).catch(error => error);
        } 
        const { token } = generatedToken;
        // save new session
        const newSession = new Session({
            userId,
            token
        });

        const isNewSessionAdded = await newSession.save().then(res => res).catch(err => err); 

        if (!isNewSessionAdded.userId) return res.json({ success: false, message: isNewSessionAdded });

        return res.json({ success: true, token });
    
    } catch(err) {
        res.status(400).json({
            success: false,
            message: err
        });
    }
});

router.post('/logout', auth, async(req, res) => {
    try {
        const headerAuth = req.headers.authorization;
        const reqUserId = req.body.id;

        if (!headerAuth && !reqUserId) return res.json({ success: false, message: 'Missing Parameter'});
        
        const decoded = await decodeToken(req.headers.authorization);
        console.log('decoded token:', decoded)
        if (!decoded.success) return res.json({ success: false, message: decoded.err });
        
        const { userId } = decoded.decoded;
        if (userId === reqUserId) {

            Session.deleteOne({ userId: reqUserId }).then((session) => {

                if (session) return res.json({ success: true });
                return res.json({ success: false, message: 'Please try again'});

            }).catch((err) => res.json({ success: false, message: err }) );
        } else {
            return res.status(400).json({
                success: false,
                message: "Incorrect token"
            });
        }
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err
        });
    }
});

router.post('/register', async(req, res) => {
   try {
        const { username, password } = req.body;
        // validate if email add valid
        if (!validator.validate(username)) return res.json({ success: false, message: "Invalid Email Address."});
        // hash password
        const hashPassword = await passwordBcrypt(password);
        // add new user
        const newUser = new User({
            username,
            password: hashPassword
        });
        // save the new user to the db
        newUser.save().then(added => added).catch(err => err);
        console.log('Is new user added?', newUser);
        // check if the adding of new user is not successful
        if (!newUser._id) {
            return res.status(200).json({ 
                success: true, 
                message: newUser
            });
        }
        // after successful adding of new user
        // generate new token for email verification
        const generatedToken = await generateTokenSignin({ email: username });
        // get the generated token
        const { token } = generatedToken;
        // verify link to be sent to the user
        const link = process.env.API_LINK + '/confirm/email/' + token;  
        // send the generated token to the user's email address
        console.log('sending email...', link);
        const isEmailSent = await sendEmail.SendEmailToUser(username, link);
        console.log('Is Email Sent?', isEmailSent.success);
        // is sending of email verification is not success?
        if (!isEmailSent.success) {
            // report unsuccess email verification to the admin
            await sendEmail.SendErrorToAdmin(username, isEmailSent.err);
            return res.json({ 
                success: false, 
                message: "An error occured while sending the email verification but don't worry, the admin will contact you shortly! "
            })
        }
        // if success registration, notify user.
        return res.status(200).json({ 
            success: true, 
            "message": "Pending account. Please verify your email"
        });          
   } catch (err) {
        console.log('Error in Register Route::', err)
        res.status(500).json({ 
            success: false, 
            message: err
        });
   }
});

router.get('/confirm/email/:token', async(req, res) => {
    try {
        const user_token = req.params.token;
       if (!user_token) return res.json({ success: false, message: "User Not Found."});

        const decodedToken = await decodeToken(user_token);

        const { email } = decodedToken.decoded;

       if (email) {
            // check if the user already verified
            const userAccount = await User.findOne({ username: email });
            // return success false if user account already verified
            if (userAccount.isVerified) return res.json({ success: false });

            //  Verify email
            User.findOneAndUpdate(email, { isVerified: true }, { upsert: true }, (err, doc) => {
                if (err) return res.json({ success: false, message: err });
                res.redirect(process.env.FRONT_END_LINK+'/login');
            });

       } else {
            return res.json({ success: false, message: "User Not Found."});
       }
    } catch(err) {
        res.status(400).json({
            success11: false,
            message: err
        });
    }
});

router.post('/forgot-password', async(req, res) => {
    try {
        const { username } = req.body;
        // validations
        if (!username) return res.json({ success: false, message: "Email address is required."});
        // check if the user already exists
        const userAccount = await User.findOne({ username });

        console.log('userAccount', userAccount);
        // if no email address is found
        if (!userAccount) return res.json({ success: false, message: "No email address is found."});
        // check if the account is not yet verified
        if (!userAccount.isVerified) return res.json({ success: false, message: "Your account is not verified yet. Please verify your account first"});

        const userId = userAccount._id.toString();
        const generatedToken = generateTokenSignin({ username: userId });

        if (!generatedToken.success) return res.json({ success: false, message: generatedToken.err});
        // generated token
        const { token } = generatedToken;
        const reset_link = process.env.API_LINK + "/reset/" + token;
        //send email to the user
        const isEmailSent = await sendEmail.SendEmailToUser(username, reset_link, "reset_link");
        if (!isEmailSent.success)  {
            res.json({ 
                success: false, 
                message: "Oops! An error occured while sending the reset link to your email but the admin will contact you shortly! "
            });
        }

        console.log('Email is sent', isEmailSent.details);

        return res.json({
            success: true,
            message: 'Reset link has been sent to your email.'
        });

    } catch(err) {
        return res.status(401).json({
            success: false,
            message: err
        });
    }
});

router.post('/reset-password', (req, res) => {
    try {
        const resetAuth = req.headers.authorization;
        const password = req.body.password;
        let token;

        if (resetAuth) {
            token = resetAuth.substring(7);
        } else {
            return res.status(401).json({
                success: false,
                message: "Access Not Authorized"
            });
        }

        if (!token || password) return res.json({ success: false, message: "Incomplete Parameter"});
       
        // check if the JWT expired
        jwt.verify(token, process.env.SECRET_KEY, (err, token) => {
           
            if (err) return res.status(401).json({ success: false, message: "Access Not Authorized"});
           
            // update the password of the username objId
            const { username } = token;

            bcrypt.hash(password, 10, (err, hash) => {
                if (err) return res.status(400).json({ success: false, message: err });
        
                req.body.password = hash;
                User.findOneAndUpdate( username, req.body, {upsert: true}, function(err, doc) {
           
                    if (err) return res.status(400).json({ success: false, message: err });
                    return res.json({ success: true });
                });
    
            });
            
        });

    } catch (err) {
        res.status(500).json({
            success1: false,
            message: err
        });
    }
});

module.exports = router;
