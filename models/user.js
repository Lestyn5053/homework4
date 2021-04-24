const Mongoose = require('mongoose');

module.exports = Mongoose.model('User', new Mongoose.Schema({
  Name: { type: String, required: true, unique: true },
}, {
  toJSON: {
    getters: true,
    virtuals: false,
  },
}));
