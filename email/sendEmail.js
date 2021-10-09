const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
const { google } = require("googleapis");
const dotenv = require('dotenv');
dotenv.config();

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, EMAIL, REFRESH_TOKEN } = process.env;

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oAuth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
});


let accessToken;
let transporter; 
(async function() {
    const req = await oAuth2Client.getAccessToken()
    .catch((err) => console.log('err', err))
   
    accessToken = req.token;
    
     transporter = nodemailer.createTransport({
        service: 'gmail',
        true: true,
        port: 465,
        auth: {
            type: "OAuth2",
            user: EMAIL,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken,
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
        }
    });

    transporter.use('compile', hbs({
        viewEngine: {
            extname: '.hbs',
            partialsDir: 'email/templates/partial/',
            layoutsDir: 'email/templates/layout/',
            defaultLayout: ''
        },
        viewPath: 'email/templates/partial/',
        extName: '.hbs'
    }));

})();

/**
 * SEND EMAIL TO USER
 * @param {String} email - user valid email address
 * @param {String} link - the front end link + the generated token 
 * @param {*} action  - default to "verify_email"
 * @returns obj
 */
const SendEmailToUser = async(email, link, action="verify_email") => {
    try {
        if (email && link) {
            // Default values
            let subject = "Hello 👋!";
            let template = "VerifyEmail";

            if (action === "reset_link") {
                subject = "Did you forgot your password?";
                template="ResetLink";
            }


            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject,
                template,
                context: {
                    link
                }
            };
            
            // Email Template for New User
            const isEmailSent = await transporter.sendMail(mailOptions)
            .catch((err) => {
                return {
                    success: false, 
                    err
                }
            })

            if (isEmailSent.accepted) {
                return {
                    success: true,
                    details: isEmailSent
                }
            } else {
                return {
                    success: false,
                    details: isEmailSent
                }     
            }
            
        } else {
            return {
                success: false
            }
        }
  
   } catch (err) {
       return {
           success: false, 
           message: err
       }
   }
}
// Send Error Support to the Admin
const SendErrorToAdmin = async(email, error) => {
    try {
     if (username && link) {
         // Email Template for New User
         const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.ADMIN_EMAIL,
            subject: "Failed email verification 👀!",
            template: 'ReportError',
            context: {
                email,
                error
            }
        };
        
        // Email Template
        await transporter.sendMail(mailOptions).catch(err => {
            return {
                success: false, 
                err
            }
        });
        
    
        return {
            success: true, 
            message: "Email Sent To Admin!"
        }
    }
    return {
        success: false
    }
    } catch (err) {
        return {
            success: false, 
            message: err
        }
    }
}
// Send An Email to Admin
const SendEmailToAdmin = async() => {
    try {

        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.ADMIN_EMAIL,
            subject: "Hello, Your Nodemailer is Working ROCKSTARRR! 👋!",
            template: 'AdminReminder',
        };
        
        // Email Template for New User
        const isEmailSent = await transporter.sendMail(mailOptions)
        .catch((err) => {
            return {
                success: false, 
                err
            }
        })

        if (isEmailSent.accepted) {
            return {
                success: true,
                details: isEmailSent
            }
        } else {
            return {
                success: false,
                details: isEmailSent
            }     
        }

    } catch (err) {
        return {
            success: false, 
            message: err
        }
    }
}
// Send DFA schedules 
const SendDFAJobs = async(email, name, siteName, appointments=[]) => {
    try {
    
     if (email && appointments) {
        console.log('SendDFAJobs email', email)
        console.log('SendDFAJobs email', appointments)

         const mailOptions = {
             from: process.env.EMAIL,
             to: email,
             subject: `🚨 ${name}, DFA opens new slot for ${siteName || "choosen site"}!! 🚨`,
             template: 'DFACronJob',
             context: {
                appointments: appointments
             }
         };
         
         // Email Template for New User
         const isEmailSent = await transporter.sendMail(mailOptions).catch(err => {
             return {
                 success: false, 
                 err
             }
         });
         
     
         if (isEmailSent.accepted) {
            return {
                success: true,
                details: isEmailSent
            }
        } else {
            return {
                success: false,
                details: isEmailSent
            }     
        }
        
    }
    
    } catch (err) {
        return {
            success: false, 
            message: err
        }
    }
}
// Send DFA Status in case DFA is down
const SendDFAStatus = async(email, subName, dfaStatus) => {
    try {
    
        if (email && dfaStatus) {
   
            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: `${subName}, FYI.. 😔`,
                template: 'DFAStatus',
                context: {
                    dfaStatus
                }
            };
            
            // Email Template for New User
            const isEmailSent = await transporter.sendMail(mailOptions).catch(err => {
                return {
                    success: false, 
                    err
                }
            });
            
        
            if (isEmailSent.accepted) {
               return {
                   success: true,
                   details: isEmailSent
               }
           } else {
               return {
                   success: false,
                   details: isEmailSent
               }     
           }
           
       }
       
       } catch (err) {
           return {
               success: false, 
               message: err
           }
       }
}


module.exports = {
    SendEmailToUser,
    SendErrorToAdmin,
    SendDFAJobs,
    SendEmailToAdmin,
    SendDFAStatus
};