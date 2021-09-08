const router = require('express').Router();
const Post = require('../models/post.model');

router.get('/', (req, res) => {
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


router.route('/add').post((req, res) => {
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
router.route('/user/:id').get((req, res) => {
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

module.exports = router;