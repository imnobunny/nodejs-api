const router = require('express').Router();
const Claim = require('../models/claim.model');
const auth = require("../middleware/auth");

router.post('/add', auth , (req, res) => {
    try{
        const secretCode = req.body.code;
        
        if (!secretCode) return res.json({ success: false, message: "No code found!"});

        const newCode = Claim({
            secretCode
        });

        newCode.save().then((claim) => {
            res.status(400).json({
                success: true,
                claimId: claim?._id
            });
        }).catch((err) => {
            res.status(400).json({
                success: false,
                message: err
            });
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err
        });
    }
});

router.get('/:id' , (req, res) => {
   try {
        const _id = req.params.id;

        if (!_id) return res.json({ success: false, message: "ID is required"});

        Claim.findById({ _id }).then((details) => {
            res.json({ success: true, isClaim: details.isClaim, secretcode: details.secretCode });
        }).catch((err) => {
            res.json({ success: false, message: err });
        })
        
   } catch (err) {
    res.json({
        success: false, 
        message: err
    });
   }
});


router.patch('/verify', (req, res) => {
    try {

        const _id = req.body.id;
        
        Claim.findOneAndUpdate(_id, { isClaim: true }, { upsert: true }, (err, doc) => {
                
            if (err) return res.json({ success: false, message: err });
            
            res.json({ success: true, message: doc });
        })

    } catch (err) {
        res.json({ success: false, message: err });
    }
});

module.exports = router;