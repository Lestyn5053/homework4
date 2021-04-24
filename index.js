const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Mongoose = require('mongoose');
require('dotenv').config();
const port = process.env.PORT;
const User = require('./models/user');
const BodyParser = require('body-parser');

app.use(BodyParser.json());
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const postUser = async (data) => new User(data).save();

io.on('connection', (socket) => {
    socket.on('database entry', async (msg) => {
        const data = { "name": msg };
        try {
            await postUser(data);
            socket.emit('submit success', msg);
            console.log(msg);
        } catch (e) {
            socket.emit('submit error');
            console.log(e);
        }
    })
});

(async () => {
    await Mongoose.connect(process.env.URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });
    http.listen(port, () => {
        console.log(`Server running at http://localhost:${port}/`);
    });
})();