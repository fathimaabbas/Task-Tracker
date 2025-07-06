const { error } = require('console');
const express=require('express');
const mongoose=require('mongoose');
const path=require('path');
const bcrypt=require('bcrypt');

const app=express();
const Task = require('./models/task');
const Streak=require('./models/streak');
const User= require('./models/user');


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

app.get('/login', (req,res)=>
{
  res.render("login")
});

app.get('/register', (req,res)=>
{
  res.render("register")
});

app.get('/addtask', (req, res) => {
  res.render("addtask");
});

app.get('/viewtask', async (req, res) => {
  try {
    const tasks = await Task.find();
    const streak = await Streak.findOne(); // fetch streak from DB

    const streakCount = streak?.count || 0; // safe fallback if streak is null

    res.render('viewtask', { tasks, streakCount ,showStreakWin: false}); // ✅ pass to EJS
  } catch (err) {
    console.error('Error loading viewtask:', err);
    res.status(500).send('Something went wrong.');
  }
});

app.post('/user',async(req,res)=>
{
  const{username,password}=req.body;

  try
  {
    const user=await User.findOne({username})
    if(!user)
    {
      return res.status(401).send("Invalid username");
    }
    const isMatch = await bcrypt.compare(password,user.password);

    if(!isMatch)
    {
      return res.status(409).send("incorrect password");
    }

    res.redirect('/home');
  }catch(err)
  {
    res.status(501).send("server eroor");
  }
});

app.post('/reg', async (req,res)=>
{
  const {username,password,confirmPassword} =req.body;

  if(password!=confirmPassword)
  {
    return res.status(400).send("password do not match");
  }

  try
  {
    const existingUser =await User.findOne({username});
    if(existingUser)
    {
      return res.status(501).send("usernamea already exists");
    }

    const hashedPassword= await bcrypt.hash(password,10);

    const newUser =new User({
         username,
         password:hashedPassword
    });

    await newUser.save();

    res.redirect('/login');
    } catch (err) {
    console.error("Registration error:", err);
    res.status(500).send("Server error");
  }
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

  const streak = await Streak.findOne();
  const streakCount = streak?.count || 0;
  res.render('viewtask', { tasks,streakCount,showStreakWin: false });
});

app.post('/delete/:id', async (req, res) => {
  const id = req.params.id;
  await Task.findByIdAndDelete(id);
  res.redirect('/viewtask');
});


app.post('/tasks/:id/complete', async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task || task.completed) return res.redirect('/viewtask');

  task.completed = true;
  task.completedAt = new Date();
  await task.save();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = await Streak.findOne();
  let showStreakWin = false;

  if (!streak) {
    streak = new Streak({
      count: 1,
      lastCompletedDate: today
    });
    showStreakWin = true;
  } else {
    const last = new Date(streak.lastCompletedDate);
    last.setHours(0, 0, 0, 0);
    const diff = (today - last) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      streak.count += 1;
      streak.lastCompletedDate = today;
      showStreakWin = true;
    } else if (diff > 1) {
      streak.count = 1;
      streak.lastCompletedDate = today;
      showStreakWin = true;
    }
    // If diff == 0 → already updated today → do nothing
  }

  await streak.save();

  const tasks = await Task.find();
  res.render('viewtask', { tasks, streakCount: streak.count, showStreakWin: true }); // ✅ This is the last line inside the route
});


app.get('/streak', async (req, res) => {
  const streak = await Streak.findOne();
  const streakCount = streak?.count || 0;
  res.render('streak', { streakCount });
});



app.listen(3000, () => {
  console.log('🚀 Server is running on http://localhost:3000');
});