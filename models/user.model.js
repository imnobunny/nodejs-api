const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 3
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 6
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, 
{
    timestamps: true
}
);

const User = mongoose.model('User', UserSchema);

module.exports = User;