const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');


const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    secureConnection: false,
    port: 587,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
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

const SendVerifyEmail = async(email, link) => {
   try {
    if (email && link) {

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Hello 👋!",
            // text: 'Hello world?', // plain text body
            template: 'VerifyEmail',
            context: {
              verify_link: link
            }
        };
        
        // Email Template for New User
        await transporter.sendMail(mailOptions).catch(err => {
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
 

module.exports = {
    SendVerifyEmail,
    SendErrorToAdmin
};