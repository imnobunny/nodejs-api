const router = require('express').Router();
const User = require('../models/user.model');
const Session = require('../models/session.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const validator = require("email-validator");
const sendEmail = require("../email/sendEmail");
const { passwordBcrypt, generateTokenSignin} = require("../helper/index");

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
        const isPasswordMatch = await passwordBcrypt("compare", password, fetchedUser.password);

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
        const newSession = new Session({
            userId,
            token
        });

        const isNewSessionAdded = await newSession.save().then(res => res).catch(err => err); 

        if (!isNewSessionAdded.userId) return res.json({ success: false, message: isNewSessionAdded });

        return res.json({ success: false, token });
    
    } catch(err) {
        res.status(400).json({
            success1: false,
            message: err
        });
    }
});

router.post('/logout', auth, (req, res) => {
    try {
        const headerAuth = req.headers.authorization;
        const userId = req.body.id;
        let token;

        if (headerAuth && userId) {
            token =  headerAuth.substring(7);
        } else {
            return res.json({ success: false, message: 'Missing Parameter'});
        }
    
        const decoded = jwt.decode(token);
      
        if (decoded.userid === userId) {
            Session.deleteOne({ userId }).then((session) => {

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

router.post('/register', (req, res) => {
    // check the required parameters
    // username should be email in the fe
    const username = req.body.username;
    const password = req.body.password
   
   try {
        // validate request
        if (!validator.validate(username)) return res.json({ success: false, message: "Invalid Email Address."});

        bcrypt.hash(password, 10, (err, password) => {
            // new user details
            const newUser = new User({
                username,
                password
            });
            // save new user
            newUser.save().then(() => {

                jwt.sign({ email: username }, process.env.SECRET_KEY, {expiresIn: '1hr'}, (err, token) => {
                    // error in token
                    if (err) return res.json({ success: false, message: err });
                    // verify link
                    const link = process.env.API_LINK + '/confirm/email/' + token;  
        
                    sendEmail.SendEmailToUser(username, link)
                    .then((result) => { 
                        if (result.success) {
                            console.log('---------------------------------------------');
                            console.log(result.details);
                            console.log('---------------------------------------------');
                            return res.json({
                                success: true,
                                message: "Pending account. Please verify your email"
                            });
                            
                        } else {
                            // report an email to admin
                            sendEmail.SendErrorToAdmin(username, sent);
                            return (
                                res.json({ 
                                    success: false, 
                                    message: "Oops! An error occured while sending the email verification but don't worry, the admin will contact you shortly! "
                                })
                            );
                        }
                    }).catch((err) => {
                        res.status(500).json({ 
                            success: false, 
                            message: err
                        });
                    });
                });
            });
        });
          
   } catch (err) {
        console.log('Error in Register Route::', err)
        res.status(500).json({ 
            success: false, 
            message: err
        });
   }
      
});

router.get('/confirm/email/:token', (req, res) => {
    const user_token = req.params.token;
    try {
       if (!user_token) return res.json({ success: false, message: "User Not Found."});

        const decoded = jwt.decode(user_token);
        const email = decoded.email;
       if (email) {
            // check if the user already verified
            User.findOne({ username: email }).then((result) => {
                if (result.isVerified) return res.json({ success: false });

                // update the email in the user db
                User.findOneAndUpdate(email, { isVerified: true }, { upsert: true }, (err, doc) => {
                
                    if (err) return res.json({ success: false, message: err });
                    
                    res.redirect(process.env.FRONT_END_LINK+'/login');
                })

            }).catch((err) => {
                res.status(400).json({
                    success: false
                });
            })
       } else {
        return res.json({ success: false, message: "User Not Found."});
       }
    } catch(err) {
        res.status(400).json({
            success: false,
            message: err
        });
    }
});

router.post('/forgot-password', (req, res) => {
    try {
        const username = req.body.username;
        if (!username) return res.json({ success: false, message: "No email found"});

        User.findOne({ username }).then((user) => {
            // Is user exists?
            if (!user) return res.json({ success: false, message: "No email found"});
            // Is the user account verified?
            if (!user.isVerified) res.json({ success: false, message: "Your account is not verified yet. Please verify your account first"});

            jwt.sign({ username: user._id }, process.env.SECRET_KEY, {expiresIn: '5m'}, (err, token) => {
                if (err) res.status(400).json({ success: false, message: "No email found"});
                

                const reset_link = `http://localhost:5000/api/v1/reset/${token}`;

                // send reset email
                sendEmail.SendEmailToUser(username, reset_link, "reset_link").then((result) => {
                    if (result.success) {
                        console.log('---------------------------------------------');
                        console.log(result.details);
                        console.log('---------------------------------------------');
                        return res.json({
                            success: true,
                            message: 'Reset link has been sent to your email.'
                        });
                        
                    } else {
                        // report an email to admin
                        sendEmail.SendErrorToAdmin(username, sent);
                        return (
                            res.json({ 
                                success: false, 
                                message: "Oops! An error occured while sending the reset link to your email but don't worry, the admin will contact you shortly! "
                            })
                        );
                    }
                }).catch((err) => {
                    res.status(500).json({ 
                        success: false, 
                        message: err
                    });
                });

            });
        }).catch(() => res.json({ success: false }))
    } catch(err) {

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
