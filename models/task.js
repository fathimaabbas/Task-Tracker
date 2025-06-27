// models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: String,
  date: String,
  time: String,
  completed: { type: Boolean, default: false }
});

module.exports = mongoose.model('task', taskSchema);
