const router = require('express').Router();
const User = require('../models/user.model');

/**
 * @description GET A SPECIFIC USER BY ID
 */
router.route('/:id').get((req, res) => {
    const { id } = req.params;
   
    console.log('userIddisfhjosdihfois', req.params);

    User.findById(id).
    then((user) => {

        if (user) {
            res.json({
                success: true, 
                user
            });
        } else {
            res.json({
                success: true, 
                message: "No user found"
            });
        }

    }).catch(err => {
        res.status(400).json({
            success: false, 
            user: [],
            message: err
        });
    })
});

/**
 * @description GET ALL THE AVAILABLE USERS
*/
router.route('/').get((req, res) => {
    User.find()
    .then(users => {
        if (users.length) {
            res.json({
                success: true, 
                users
            })
        } else {
            res.json({
                success: true, 
                users,
                message: "no users found"
            })
        }
    })
    .catch(err => res.status(400).json({
        success: false, 
        message: err
    }));
});

/**
 * @description ADD NEW USER ROUTE
 * @param {String} username - user entered username 
 * @param {String}  password - account password
 */
router.route('/add').post((req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
        const newUser = new User({
            username,
            password
        });
        
        newUser.save().then(() => res.json({
            success: true, 
        })).catch(err => {

            res.status(400).json({
                success: false, 
                message: err,
            })
        })
    } else {
        res.status(200).json({
            success: false, 
            message: 'username and password is required'
        })
    }
});

module.exports = router;