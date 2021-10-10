const router = require('express').Router();
const User = require('../models/user.model');
const Session = require('../models/session.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const validator = require("email-validator");
const sendEmail = require("../email/sendEmail");

router.post('/login', (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
    
        function sendRes(success, message, status=200){
            return res.status(status).json({
                success,
                message
            });
        }
        // first validate if the username exists
        User.findOne({ username }).then(user => {
            // return false if username is incorrect / not exists.
            if (!user) return sendRes(false, 'Username is incorrect');

            if(!user.isVerified) return sendRes(false, 'Please verify your account.');
            // verify passwords
            bcrypt.compare(password, user.password, (err, res)=>{
                // passwords are not the same
                if (!res || err) return sendRes(false, 'Password is incorrect');
                // check the session if the userId exists and has token;
                Session.findOne({ userId: user._id }).then((session) => {
                    if (session) {
                        // remove the token
                        console.log('session', session)
                        Session.deleteOne({ userId: user._id }).then((res) => {
                            console.log('Deleted existing token', res);
                        }).catch((err) => console.log('Error in deleting the existing token', err));
                    }
                    //passwords are the same, assign token
                    jwt.sign({
                        username,
                        userid: user._id
                    }, process.env.SECRET_KEY, {expiresIn: '1hr'}, (err, token)=> {
                        // if generating token is err
                        if (err) sendRes(false, err);
                        // save new token and its user id to session;
                        const newSession = new Session({
                            userId: user._id,
                            token
                        });
            
                        newSession.save().then(() => {
                            sendRes(true, token);
                        }).catch(err =>  sendRes(false, err, 400)); 
                    });

                });
            }); 

        }).catch(err => {
            sendRes(false, err, 400);
        });
    } catch(err) {
        res.status(400).json({
            success: false,
            message: err
        });
    }
});

router.post('/logout', auth, (req, res) => {
    try {
        let headerAuth = req.headers.authorization;
        let userId = req.body.id;
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
