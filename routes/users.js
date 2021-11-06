const router = require('express').Router();
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const UserDetails = require('../models/userDetails.model');
const { decodeToken } = require('../helper/index');

/**
 * @description GET A SPECIFIC USER BY ID
 */
router.get('/:id', auth ,(req, res) => {
    const { id } = req.params;
   
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
router.get('/', auth, (req, res) => {
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
router.post('/add', auth, (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

 
    if (username && password) {
      
        bcrypt.hash(password, 10, (err, hash) => {
            
            const newUser = new User({
                username,
                password: hash
            });

            newUser.save()
            .then(() => res.json({
                success: true, 
            }))
            .catch(err => {
                res.status(400).json({
                    success: false, 
                    message: err,
                })
            })

        });
        
    } else {
        res.status(200).json({
            success: false, 
            message: 'username and password is required'
        })
    }
});

router.delete('/delete/:id', auth, (req, res) => {
    const objId = req.params.id;
    if (objId) {
        User.deleteOne({ _id: objId } , (err, obj) => {
        
            if (err) return res.status(400).json({ success: false, message: err});
            res.json({ success: true });

        })
    }
});
    
router.patch('/update/:_id', auth, (req, res) => {
   try {

    if (req.body?.password) {
        // hash password
        bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) return res.status(400).json({ success: false, message: err });
            req.body.password = hash;

            User.findOneAndUpdate(req.params, req.body, {upsert: true}, function(err, doc) {
       
                if (err) return res.status(400).json({ success: false, message: err });
                return res.json({ success: true });
            });

        });

    } else {

        User.findOneAndUpdate(req.params, req.body, {upsert: true}, function(err, doc) {
       
            if (err) return res.status(400).json({ success: false, message: err });
            return res.json({ success: true });
        });
        
    }

   } catch (err) {
        res.status(400).json({ success: false, message: err });
   }
});

router.get('/details', auth, (req, res) => {
    try {
        // get the details of the userId
        res.status(200).json({ success: true, message: 'no data to fetched yet' });
    } catch(err) {
        res.status(400).json({ success: false, message: err });
    }
});

router.post('/add/details', auth, async(req, res) => {
    try {
        const { authorization } = req.headers;
        const { username, firstname, lastname, country, birthDate } = req.body;

       const fetched = await decodeToken(authorization);
    
        // validate data
        if (!username || !firstname || !lastname || !country || !birthDate) return res.status(200).json({ success: false, message: "Incomplete parameters" });
       
        const addUserDetails = new UserDetails({
            userId: fetched.decoded.userid,
            username,
            firstname,
            lastname,
            country, 
            birthDate
        });

        addUserDetails.save()
        .then(() => {
            res.status(200).json({ success: true });
        })
        .catch((err) => {
            res.status(400).json({ success: false, message: err });
        });
        
    } catch (err) {
        res.status(400).json({ success: false, message: err });
    }
});



module.exports = router;