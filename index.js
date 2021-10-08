const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodeCron = require("node-cron");
const sendEmail = require("./email/sendEmail");
const passportjobs = require("./passport/passportjobs");
//const wakeDyno = require("woke-dyno");

require('dotenv').config();

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const databaseUrl =process.env.DATABASE_URL;
mongoose.connect(databaseUrl, { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
}); 

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB connection is now established successfully');
});

// Jobs
// nodeCron.schedule('*/30 * * * *', () => {
//     console.log('RUNNING CRON-------------------------------------------');
//     passportjobs.checkSubscriptions();
// });

nodeCron.schedule('0 */4 * * *', () => {
    console.log('RUNNING CRON JOB DAY------------------------------------');
    sendEmail.SendEmailToAdmin();
});

// ROUTES
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const authRouter = require('./routes/auth');
const claimRouter = require('./routes/claims');
const passportphilRouter = require('./routes/passport.ph');

app.use('/api/v1', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/posts', postsRouter);
app.use('/api/v1/claims', claimRouter);
app.use('/api/v1/passport', passportphilRouter);

app.listen(port, ()=> {
    console.log('Running on port: ', port);
    // wakeDyno({
    //     url: process.env.HEROKU,
    //     interval: 20000, // 10 mins to wake
    //     startNap: [5, 0, 0, 0], // [h, m, s, ms] (05:00 UTC in this example)
    //     endNap: [9, 59, 59, 999] // time to wake up again, in UTC (09:59:59.999 in this example)
    // }).start(); 
});


