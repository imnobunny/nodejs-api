const router = require('express').Router();
const axios = require('axios');

// Get Countries in Asia Pacific
router.get('/countries' , (req, res) => {
    try {
        axios({
            method: 'POST',
            url: 'https://www.passport.gov.ph/countries',
            data: {
                regionId: 1
            }
        })
        .then((result) => {
            
            if (result.status === 200) {
                const countries = result.data.Countries;
                return res.json({ success: true, countries })
            }
    
            return res.json({ success: true, countries: [] })
        })
        .catch(err => console.log(err))
         
    } catch (err) {
     res.json({
         success: false, 
         message: err
     });
    }
});

// Get Available Sites By RegionId and CountryId
router.get('/sites/:regionId/:countryId' , (req, res) => {
    try {
        const regionId = req.params.regionId;
        const countryId = req.params.countryId;

        axios({
            method: 'POST',
            url: 'https://www.passport.gov.ph/sites',
            data: {
                regionId,
                countryId
            }
        })
        .then((result) => {
            
            if (result.status === 200) {
                const sites = result.data.Sites;
                return res.json({ success: true, sites })
            }
    
            return res.json({ success: true, sites: [] })
        })
        .catch(err => console.log(err))
         
    } catch (err) {
     res.json({
         success: false, 
         message: err
     });
    }
});

// private route
router.post('/appointment/timeslot', (req, res) => {
    try {
        res.status(400).json({ success: true })
    } catch (err) {
        res.status(400).json({ success: false, message: err })
    }
})

module.exports = router;