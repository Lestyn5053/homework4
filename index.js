const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Mongoose = require('mongoose');
require('dotenv').config();
const port = process.env.PORT;
const User = require('./models/user');
const axios = require('axios');
const StatusCodes = require('http-status-codes');
const BodyParser = require('body-parser');

app.use(BodyParser.json());

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

app.post('/users', async (request, response) => {
    await doActionThatMightFailValidation(request, response, async () => {
        await new User(request.body).save();
        response.sendStatus(StatusCodes.CREATED);
    });
});

io.on('connection', (socket) => {
    socket.on('database entry', msg => {
        console.log(msg);
        axios.post('http://localhost:8080/users', {
            "name": msg
        }).then(res => {
            console.log(`statusCode: ${res.statusCode}`);
            console.log(res);
        }).catch(error => {
            console.error(error);
        })
    });
    socket.on('query', msg => {
        query(msg).then(result => socket.emit('query-result', result)).catch(err => console.error(err))
    })
});

const query = async data => {
    const queryResult = await User.aggregate([])
        .search({
            autocomplete: {
                path: 'name',
                query: data
            }
        });
    return queryResult;
}

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