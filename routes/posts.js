const router = require('express').Router();
const auth = require("../middleware/auth");
const Post = require('../models/post.model');

router.get('/', auth, (req, res) => {
   try {
        Post.find().then((posts) => {
            if (posts.length) {
                res.json({
                    success: true, 
                    posts
                });
            } else {
                res.json({
                    success: true, 
                    posts,
                    message: "no posts found"
                });
            }
        });
   } catch (error) {
    res.json({
        success: false, 
        message: error
    });
   }
});

// Create new Post
router.post('/add', auth, (req, res) => {
    const post = req.body.post;
    const user = req.body.user;

    try {
        
        if (post && user) {

            const newPost = new Post({
                post,
                user
            });

            newPost.save().then(() => {
                res.json({
                    success: true
                })
            }).catch((err) => {
                res.json({
                    success: false,
                    message: err
                })
            });
        } else {
            res.json({
                success: false, 
                message: 'post and userid required'
            });
        }
    } catch(error) {
        res.json({
            success: false, 
            message: error
        });
    }
});

// Get Posts By UserId
router.get('/user/:id', auth, (req, res) => {
    try {
        const userId = req.params.id;
        Post.find({
            user: userId
        }).then((posts) => {
            res.json({
                success: true,
                posts: posts
            });
        }).catch((error) => {
            res.json({
                success: false,
                message: error
            });
        })
    } catch (err) {
        res.json({
            success: false,
            message: err
        });
    }
});

router.delete('/delete/:id', auth, (req, res)=> {
    const _id = req.params.id;
    try {
        Post.deleteOne({ _id }, (err, result)=> {
            
            if (err) return res.status(400).json({ success: false, message: err });

            if (result.deletedCount) {
                res.status(200).json({ success: true });
            } else {
                res.status(200).json({ success: false, message: "Post Id not Found" });
            }
            
        })
    } catch(err) {
        res.status(400).json({ success: false, message: err });
    }
});

module.exports = router;