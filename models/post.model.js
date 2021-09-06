const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
    post: {
        type: String,
        required: true,
        minLength: 3,
    },
    user: {
        type: String,
        required: true,
        minLength: 3,
    },
}, {
    timestamps: true
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
