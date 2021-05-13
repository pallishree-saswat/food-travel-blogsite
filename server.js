const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const seedDB = require('./seed');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv')
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

// Routes
const postRoutes = require('./routes/post');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/category');
const profileRoutes = require('./routes/profile');

dotenv.config();


mongoose.connect('mongodb://localhost:27017/blogApp',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify:false,
        useCreateIndex:true
    })
    .then(() => {
        console.log("DB Connected");
    })
    .catch((err) => {
        console.log("OH NO ERROR!!!");
        console.log(err);
    });


//seedDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))

const sessionConfig = {
    secret: 'imsecret',
    resave: false,
    saveUninitialized: true
};


app.use(session(sessionConfig));
app.use(flash());

// Initilising the passport and sessions for storing the users info
app.use(passport.initialize());
app.use(passport.session());

// configuring the passport to use local strategy
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
})





//routes
app.use(postRoutes);
app.use(authRoutes);
app.use(categoryRoutes);
app.use(profileRoutes);


app.listen(3000, () => {
    console.log("Server Started AT PORT 3000");
})