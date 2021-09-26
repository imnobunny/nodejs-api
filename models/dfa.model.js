const mongoose = require('mongoose');

const DFASchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    regionId: {
        type: Number,
        required: true,
    },
    countryId: {
        type: Number,
        required: true,
        default: 1
    },
    siteId: {
        type: Number,
        required: true,
    },
    slot: {
        type: Number,
        required: true,
        default: 1,
        maxLength: 5
    }
}, 
{
    timestamps: true
}
);

const DFA = mongoose.model('DFA', DFASchema);

module.exports = DFA;