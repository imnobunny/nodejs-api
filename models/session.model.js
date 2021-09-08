const mongoose = require('mongoose');

const SessionsSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    token: {
        type: String,
        required: true,
    },
}, 
);

const Session = mongoose.model('Session', SessionsSchema);

module.exports = Session;