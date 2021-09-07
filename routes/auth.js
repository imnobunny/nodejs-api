const router = require('express').Router();
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



router.route('/login').post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    function sendRes(success, message, status=200){
        return res.status(status).json({
            success,
            message
        });
    }
         

    User.findOne({ username }).then(user => {
        if (!user) return sendRes({ success: false , message: "Username is incorrect"});

        bcrypt.compare(password, user.password, (err, res)=>{
        
            if (!res || err) return sendRes({ success: false , message: 'Password is incorrect' });
           
            jwt.sign({
                username,
                userid: user._id
            }, process.env.SECRET_KEY, (err, token)=> {
                if (err) sendRes({ success: true , token });
                sendRes({ success: true , token });
            })
            
        }); 

    }).catch(err => {
        sendRes({ success: false , message: err, status: 400 })
    });
   
    
    
});

module.exports = router;
