const DFA = require('../models/dfa.model');
const axios = require('axios');
const moment = require("moment");
const sendEmail = require("../email/sendEmail");

const checkSubscriptions = () => {
    DFA.find().then((subs) => {
    
        (subs || []).map(sub => {

            const { email, regionId, countryId, slot, siteId, name, siteName } = sub;

            console.log('-------------------------------------------');
            console.log('email:', email);
            console.log('regionId:', regionId);
            console.log('countryId:', countryId);
            console.log('slot', slot);
            console.log('siteId', siteId);
            const fromDate = moment().format("YYYY-MM-DD");
            console.log('fromDate:', fromDate);
            console.log('-------------------------------------------');

            axios({ 
                method: 'POST',
                url: 'https://www.passport.gov.ph/appointment/timeslot/available',
                data: {
                    fromDate,
                    toDate: "2022-03-31",
                    siteId,
                    requestedSlots: slot 
                }
            }).then((result) => {
                if (result.status === 200) {
                    const appointments = result.data;
                    console.log(`result for ${email}::`, appointments)
                    appointments.map((appointment) => {
                        let appointmentDate = moment(appointment.AppointmentDate).format('MM/DD/YYYY');
                        appointment.AppointmentDate = appointmentDate;
                        console.log('appointment.IsAvailable', appointment)
                        if (appointment.IsAvailable) {
                            console.log('new opens slots')
                            // notify subscriber
                            sendEmail.SendDFAJobs(email, name, siteName, appointments).then((result) => {
                                console.log('Is Email Sent?', result.success);
                            }).catch((err) => {
                                console.log('Is email sent?', err);
                            })

                        } else {
                            console.log('-------------------------------------------');
                            console.log('No open slots', appointment);
                            console.log('-------------------------------------------');
                        }

                        // sendEmail.SendDFAJobs(email, name, siteName, appointments).then((result) => {
                        //     console.log('Is Email Sent?', result.success);
                        // }).catch((err) => {
                        //     console.log('Is email sent?', err);
                        // })

                        
                    });
                }
            }).catch((err) => {
                console.log('DFA Status:', err.response.statusText);

            }); 
        });
    })
    .catch(err => console.log(err))
}

module.exports = {
    checkSubscriptions,
};