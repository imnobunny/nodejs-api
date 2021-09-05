const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();

const port = process.env.port || 5000;

app.use(cors());
app.use(express.json());

const uri ='mongodb+srv://admin:admin1234@cbk.p9e2b.mongodb.net/redvelvet?retryWrites=true&w=majority';

mongoose.connect(uri, { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB connection is now established successfully');
});


// USER ROUTES
const usersRouter = require('./routes/users');

app.use('/api/v1/users', usersRouter);

app.listen(port, ()=> {
    console.log('Running on port: ', port);
});


