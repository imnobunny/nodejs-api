const router = require('express').Router();
const User = require('../models/user.model');
const Session = require('../models/session.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


router.route('/login').post((req, res) => {
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
            if (!user) return sendRes({ success: false , message: "Username is incorrect"});
            // verify passwords
            bcrypt.compare(password, user.password, (err, res)=>{
                // passwords are not the same
                if (!res || err) return sendRes({ success: false , message: 'Password is incorrect' });
                // check the session if the userId exists and has token;
                Session.findOne({ userId: user._id }).then((session) => {
                    if (session) {
                        // remove the token
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
                        if (err) sendRes({ success: false , message: err });
                        // save new token and its user id to session;
                        const newSession = new Session({
                            userId: user._id,
                            token
                        });
            
                        newSession.save().then(() => {
                            sendRes({ success: true , token });
                        }).catch(err => sendRes({ success: false , message: err })); 
                    });

                });
            }); 

        }).catch(err => {
            sendRes({ success: false , message: err, status: 400 })
        });
    } catch(err) {
        res.status(400).json({
            success: false,
            message: err
        });
    }
});

router.route('/logout').post((req, res) => {
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

module.exports = router;
