const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Mongoose = require('mongoose');
require('dotenv').config();

const port = process.env.PORT;
const BodyParser = require('body-parser');
const User = require('./models/user');

app.use(BodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

const postUser = async (data) => new User(data).save();
const autoComplete = async (data) => User.find({ Name: { $regex: data } });

io.on('connection', (socket) => {
  socket.on('database entry', async (msg) => {
    const data = { Name: msg };
    try {
      await postUser(data);
      socket.emit('submit success', msg);
      console.log(msg);
    } catch (e) {
      socket.emit('submit error');
      console.log(e);
    }
  });
  socket.on('autocomplete', async (msg) => {
    const ac = await autoComplete(msg);
    const entries = [];
    ac.forEach((entry) => {
      entries.push({ Name: entry.Name });
    });
    socket.emit('query-result', entries);
  });
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
