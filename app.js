const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();


// const mongoose = require('mongoose');
const passport = require('passport');
const bcrypt = require("bcrypt") // Importing bcrypt package
const LocalStrategy = require('passport-local').Strategy;
// const initializePassport = require("./passport-config")
const flash = require("express-flash")
const bodyParser = require("body-parser");

const ADR = require("./models/adr")
const User = require("./models/user");
const methodOverride = require("method-override")
const app = express()

// Function to find a user by email in the SQLite database
function findUserByEmail(email, callback) {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.get(query, [email], (err, row) => {
        if (err) {
            console.error('Error finding user by email:', err.message);
            return callback(err, null);
        }
        return callback(null, row);
    });
}

// Function to find a user by id in the SQLite database
function findUserById(id, callback) {
    const query = 'SELECT * FROM users WHERE id = ?';
    db.get(query, [id], (err, row) => {
        if (err) {
            console.error('Error finding user by id:', err.message);
            return callback(err, null);
        }
        return callback(null, row);
    });
}

// Function to initialize Passport.js with local strategy
function initializePassport(passport) {
    const authenticateUser = async (email, password, done) => {
        findUserByEmail(email, async (err, user) => {
            if (err) return done(err);
            if (!user) return done(null, false, {
                message: 'No user with this email found.'
            });

            try {
                if (await bcrypt.compare(password, user.password)) {
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: 'Incorrect password.'
                    });
                }
            } catch (err) {
                return done(err);
            }
        });
    };

    passport.use(new LocalStrategy({
        usernameField: 'email'
    }, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => findUserById(id, done));
}

initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

app.use(express.urlencoded({
    extended: false
}))
app.use(flash())


// Connect to SQLite database
const db = new sqlite3.Database('pharmasafe.db', (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }


    // Create the adr_reports table if it doesn't exist
    db.run(
        'CREATE TABLE IF NOT EXISTS adr_reports (id INTEGER PRIMARY KEY, age INTEGER, sex TEXT, weight INTEGER, drugs TEXT, reactions TEXT, images TEXT)',
        (err) => {
            if (err) {
                console.error('Error creating adr_reports table:', err.message);
            } else {
                console.log('adr_reports table created successfully');
            }
        }
    );
    // db.run('DROP TABLE IF EXISTS users', (err) => {
    //     if (err) {
    //         console.error('Error dropping users table:', err.message);
    //     } else {
    //         console.log('Dropped users table successfully');
    //     }
    // })

    // Create the users table if it doesn't exist
    db.run(
        'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, email TEXT UNIQUE, password TEXT)',
        (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('users table created successfully');
            }
        }
    );
});





const port = 3000;



const users = []

// Configure express-session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));



// Configure Passport.js
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"))


// Configuring the register post functionality
app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}))



// passport.use(new LocalStrategy(User.authenticate()));


//Serialize and Deserialize deals with how information is stored and recieved in a session
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

app.use(bodyParser.urlencoded({
    extended: false
}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));






// Configure Multer to handle file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage
});

// Redirect authenticated users to the "/report" page
app.get("/", checkAuthenticated, (req, res) => {
    res.redirect("/report");
});



// User sign-up page
app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register');
});


// Configuring the register post functionality
app.post("/register", checkNotAuthenticated, async (req, res) => {


    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
        })
        const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
        db.run(
            query,
            [req.body.username, req.body.email, hashedPassword, req.body.firstname, req.body.lastname],
            function (err) {
                if (err) {
                    console.error('Error creating user:', err.message);
                    return res.redirect("/register");
                } else {
                    console.log("New user registered:", req.body.email);
                    return res.redirect('/login');
                }
            }
        );
        console.log(users); // Display newly registered in the console
        // res.redirect("/login")

    } catch (error) {
        console.error('Error signing up:', error);
        res.redirect("/register");
    }
})

// Login page
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login')
});


// Handle user login (POST request)
app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/report',
        failureRedirect: '/login',
        failureFlash: true
    })

);



// Serve the HTML form
app.get('/report', checkAuthenticated, (req, res) => {
    res.render('index')
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect("/login")
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/report")
    }
    next()
}
console.log(users)
// Handle the form submission
app.post('/report', upload.array('images', 5), async (req, res) => {
    const {
        age,
        sex,
        weight,
        drugs,
        reactions
    } = req.body;
    const images = req.files.map((file) => file.filename);

    try {
        // Save the form data to the SQLite database
        const query =
            'INSERT INTO adr_reports (age, sex, weight, drugs, reactions, images) VALUES (?, ?, ?, ?, ?, ?)';
        db.run(
            query,
            [parseInt(age), sex, parseInt(weight), drugs, reactions, images.join(',')],
            function (err) {
                if (err) {
                    console.error('Error saving ADR report to database:', err.message);
                    res.status(500).json({
                        error: 'Failed to save ADR report.'
                    });
                } else {
                    res.send('Thank you for reporting the Adverse Drug Reaction!');
                }
            }
        );
    } catch (error) {
        console.error('Error saving ADR report to database:', error);
        res.status(500).json({
            error: 'Failed to save ADR report.'
        });
    }
});






app.get('/adr_reports', checkAuthenticated, (req, res) => {
    const query = 'SELECT * FROM adr_reports';
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error fetching ADR reports:', err.message);
            res.status(500).json({
                error: 'Failed to fetch ADR reports.'
            });
        } else {
            res.render('reports', adrReports = rows);
        }
    });
});


// Handle user logout
app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            console.error('Error logging out:', err.message);
            res.status(500).json({
                error: 'Failed to log out.'
            });
        } else {
            res.redirect('/login');
        }
    });
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});