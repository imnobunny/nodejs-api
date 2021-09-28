const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
const { google } = require("googleapis");

const REFRESH_TOKEN = "1//04knuthmfixTTCgYIARAAGAQSNwF-L9IrNAXWKoU4ErLoUwghmQygV0-NqZe8uGJWgQyOKjJq4KhZgvta_GMGrgSkXZSbY5Im3LI";
const CLIENT_ID="962254439349-qanau0qc6fr8uq173n346ci31j2apf7a.apps.googleusercontent.com";
const CLIENT_SECRET="SZkiXiQy5UBo1KF2LBDfAV-Y"
const REDIRECT_URI="https://developers.google.com/oauthplayground"

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
            user: process.env.EMAIL,
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

const SendVerifyEmail = async(email, link) => {
   try {
       
    if (email && link) {

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Hello 👋!",
            template: 'VerifyEmail',
            context: {
              verify_link: link
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

const SendDFAJobs = async(email, appointments=[]) => {
    try {
    console.log('sendDFAJobs')
     if (email && appointments) {
        console.log('SendDFAJobs email', email)
        console.log('SendDFAJobs email', appointments)

         const mailOptions = {
             from: process.env.EMAIL,
             to: process.env.ADMIN_EMAIL,
             subject: "DFA CRON JOBS 👋!",
             template: 'DFACronJob',
             context: {
                appointments: appointments
             }
         };
         
         // Email Template for New User
         await transporter.sendMail(mailOptions).catch(err => {
            console.log('SendDFAJobs email', err)
             return {
                 success: false, 
                 err
             }
         });
         
     
         return {
             success: true, 
             message: "Email Sent!"
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
 
 

module.exports = {
    SendVerifyEmail,
    SendErrorToAdmin,
    SendDFAJobs
};