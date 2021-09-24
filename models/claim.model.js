const mongoose = require('mongoose');

const ClaimSchema = mongoose.Schema({
    secretCode: {
        type: String,
        required: true,
        unique: true,
    },
    isClaim: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

const Claim = mongoose.model('Claim', ClaimSchema);

module.exports = Claim;
