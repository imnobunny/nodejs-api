const DFA = require('../models/dfa.model');
const axios = require('axios');
const moment = require("moment");
const sendEmail = require("../email/sendEmail");

const checkSubscriptions = () => {
    DFA.find().then((subs) => {
       
        subs.map(sub => {
            const { email, regionId, countryId, slot, siteId} = sub;

            console.log('******************************');
            console.log('email:', email);
            console.log('regionId:', regionId);
            console.log('countryId:', countryId);
            console.log('slot', slot);
            console.log('siteId', siteId);
            
            
            axios({ 
                method: 'POST',
                url: 'https://www.passport.gov.ph/appointment/timeslot/available',
                data: {
                    fromDate: "2021-09-28",
                    toDate: "2022-03-31",
                    siteId,
                    requestedSlots: slot 
                }
            }).then((result) => {
                if (result.status === 200) {
                    const appointments = result.data;
                    console.log('appointments',appointments )
                    appointments.map((appointment) => {
                        let appointmentDate = moment(appointment.AppointmentDate).format('MM/DD/YYYY');
                        // if (appointment.IsAvailable) {
                        //     console.log('new opens slots')
                        // } else {
                        //     console.log('No Available timeslots yet', )
                        // }
                        console.log('datetest', appointmentDate)
                        const testemail = sendEmail.SendDFAJobs(email, appointments).then((result) => {
                            console.log('Is email sent?', result);
                        }).catch((err) => {
                            console.log('Is email sent?', result);
                        })
                    })
                }
            }).catch((err) => {
                console.log('error in passport jobs', err)
            }); 
        });
    })
    .catch(err => console.log(err))
}

module.exports = {
    checkSubscriptions,
};