const { error } = require('console');
const express=require('express');
const mongoose=require('mongoose');
const path=require('path');

const app=express();
const Task = require('./models/task');


mongoose.connect('mongodb://localhost:27017/tasktracker')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
  });


app.set('view engine','ejs');

app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));

// Route: Show welcome.html at root
app.get('/', (req, res) => {
  res.render("welcome");
});

// Route: Show index.html after redirect
app.get('/home', (req, res) => {
  res.render("index");
});

app.get('/addtask', (req, res) => {
  res.render("addtask");
});

app.get('/viewtask', async (req, res) => {
  const tasks = await Task.find(); // fetch tasks from DB
  res.render('viewtask', { tasks }); // send them to EJS
});


app.post('/viewtask', async (req, res) => {
  console.log("Submitted task:", req.body);
  const { title, date, time, completed } = req.body;

  const task = new Task({
    title,
    date,
    time,
    completed: completed === 'on'
  });

  await task.save();

  const tasks = await Task.find(); // fetch all tasks from DB
  res.render('viewtask', { tasks });
});

app.post('/delete/:id', async (req, res) => {
  const id = req.params.id;
  await Task.findByIdAndDelete(id);
  res.redirect('/viewtask');
});


app.listen(3000, () => {
  console.log('🚀 Server is running on http://localhost:3000');
});