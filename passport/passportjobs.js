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
                    appointments.map((appointment) => {
                        let appointmentDate = moment(appointment.AppointmentDate).format('MM/DD/YYYY');
                        appointment.AppointmentDate = appointmentDate;
                       
                        if (appointment.IsAvailable) {
                            console.log('new opens slots')
                            // notify subscriber
                            sendEmail.SendDFAJobs(email, appointments, "Ayala").then((result) => {
                                console.log('Is Email Sent?', result.success);
                            }).catch((err) => {
                                console.log('Is email sent?', err);
                            })

                        } else {
                            console.log('No open slots', appointment);
                        }

                        
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