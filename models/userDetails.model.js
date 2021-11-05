const mongoose = require('mongoose');

const UserDetailsSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
    },
    firstname: {
        type: String,
        required: true,
        trim: true,
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
    },
    birthdate: {
        type: Date
    }
}, 
{
    timestamps: true
}
);

const UserDetails = mongoose.model('UserDetails', UserDetailsSchema);

module.exports = UserDetails;