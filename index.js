const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const db_uri = "mongodb+srv://romif:OW69ZleXRZfObhRS@cluster0.k1h7bvo.mongodb.net/exercice_tracker-db-3?retryWrites=true&w=majority";


// db setting


mongoose.connect(db_uri, { useNewUrlParser: true, useUnifiedTopology: true })

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});


const User = mongoose.model('User', userSchema);

const exerciceSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: Date
});


const Exercice = mongoose.model('Exercice', exerciceSchema);




// API requests


app.post('/api/users', async function (req, res) {

  try {
    const newUser = new User({
      username: req.body.username
    });
    const result = await newUser.save();
    console.log(result);
    res.status(200).json(result);
  } catch (err) {
    console.log('err');
    res.status(401).json({ error: 'Invalid Username' });
  }
})
// virer l'array exercices de la response


app.get('/api/users', async (req, res) => {
  try {
    const usersdb = await User.find();
    res.status(200).json(usersdb);
  } catch (err) {
    console.log('err');
    res.status(500).json({ error: 'Internal server error' });
  }
})



app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params._id })
    const username = user.username;
    const _id = user._id;
    let date = new Date()
    if (req.body.date) {
      date = req.body.date;
    }
    const newExercice = new Exercice({
      user_id: _id,
      description: req.body.description,
      duration: req.body.duration,
      date: date
    })
    await newExercice.save();


    res.status(200).json({
      _id: _id,
      username: username,
      description: newExercice.description,
      duration: newExercice.duration,
      date: newExercice.date.toDateString()
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/users/:_id/logs/:from?/:to?/:limit?', async (req, res) => {
  try {
    const from = req.query.from;
    const to = req.query.to;
    const limit = req.query.limit;

    const user = await User.findOne({ _id: req.params._id });

    let exercises = await Exercice
      .find({ user_id: req.params._id })

    let filteredExercises = exercises;

    if (from) {
      const fromDate = new Date(from);
      filteredExercises = filteredExercises.filter((exercise) => exercise.date >= fromDate);
    };

    if (to) {
      const toDate = new Date(to);
      filteredExercises = filteredExercises.filter((exercise) => exercise.date <= toDate);
    };

    if (limit) {
      const exercisesLimit = parseInt(limit);
      filteredExercises = filteredExercises.slice(0, exercisesLimit);
    
    };


    const formattedExercises = filteredExercises
      .map((exercice) => ({
        description: exercice.description,
        duration: exercice.duration,
        date: exercice.date.toDateString()
      }));


    const exercisesCount = exercises.length;
    res.status(200).json({
      _id: user._id,
      username: user.username,
      count: exercisesCount,
      log: formattedExercises
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('your app is listening on port ' + listener.address().port)
});