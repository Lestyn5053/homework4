const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user');

const doActionThatMightFailValidation = async (request, response, action) => {
    try {
        await action();
    } catch (e) {
        response.sendStatus(
            e.code === 11000
            || e.stack.includes('ValidationError')
            || (e.reason !== undefined && e.reason.code === 'ERR_ASSERTION')
                ? 400 : 500,
        );
    }
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('database entry', msg => {
        app.post('/users', async (req, res) => {
            // req.body = '{ "name": ' + msg + ' }';
            await doActionThatMightFailValidation(req, res, async () => {
                await new User(req.body).save();
                res.sendStatus(201);
            });
        });
    });
});

(async () => {
    await Mongoose.connect(process.env.URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });
    http.listen(process.env.PORT);
})();