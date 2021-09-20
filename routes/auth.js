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
        if (username && password) {
        
            if (!validator.validate(username)) return res.json({ success: false, message: "Invalid Email Address."})
    
            bcrypt.hash(password, 10, (err, password) => {
                    
                const newUser = new User({
                    username,
                    password
                });
    
                newUser.save().then(() => {
                    // generate a token to use for verifying your email address
                   jwt.sign({ email: username }, process.env.SECRET_KEY, {expiresIn: '1hr'}, (err, token) => {

                        if (err) return res.json({ success: false, message: err });

                       const link = process.env.API_LINK + '/confirm/email/' + token;  
                       
                        // Send Verify Email
                        sendEmail.SendVerifyEmail(username, link).then((sent) => {

                            console.log('Message sent::', sent);
                            if (!sent.success) {

                                // if sending of email verification failed, send notify the admin and send also the 
                                // username and the error description
                                sendEmail.SendErrorToAdmin(username, sent);
                                // then notify the user that the admin will contact him/her shortly or the backend inform the admin about the
                                // issue
                                return res.json({ success: false, message: "Oops! An error occured while sending the email verification but don't worry, the admin will contact you shortly! "})
                            }
                            // if not error, return success.
                            return res.json({
                                success: true,
                                message: "Pending account. Please verify your email"
                            });

                        }).catch(err => {
                            console.log('Error sending email::', err)
                        })
                        
                    });
    
                }).catch(err => {
                    res.status(400).json({
                        success: false, 
                        message: err,
                    })
                })
            });
        } else {
            // If no username or password found.
            return res.json({ success: false, message: "Username and Password are required. "})
        }
    } catch (err) {

        res.status(400).json({
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
                if (result.isVerified) return res.json({ success: false, message: `${email} is already verified` });

                // update the email in the user db
                User.findOneAndUpdate(email, { isVerified: true }, { upsert: true }, (err, doc) => {
                
                    if (err) return res.json({ success: false, message: err });
                    
                    res.json({ success: true  });
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
            
            if (!user) return res.json({ success: false, message: "No email found"});

            jwt.sign({ username: user._id }, process.env.SECRET_KEY, {expiresIn: '15m'}, (err, token) => {
                console.log('token', token)

                // send reset email

                return res.json({
                    success: true,
                    message: 'Reset link has been sent to your email.'
                });

            });
        }).catch(() => res.json({ success: false }))
    } catch(err) {

    }
});

module.exports = router;
