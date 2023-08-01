const LocalStrategy = require("passport-local").Strategy
const bcrypt = require("bcrypt");
const db = require('sqlite3').verbose();

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

// function initialize(passport, getUserByEmail, getUserById) {
//     // Function to authenticate users
//     const authenticateUsers = async (email, password, done) => {
//         // Get users by email
//         const user = getUserByEmail(email)
//         if (user == null) {
//             return done(null, false, {
//                 message: "No user found with that email"
//             })
//         }
//         try {
//             if (await bcrypt.compare(password, user.password)) {
//                 return done(null, user)
//             } else {
//                 return done(null, false, {
//                     message: "Password Incorrect"
//                 })
//             }
//         } catch (e) {
//             console.log(e);
//             return done(e)
//         }
//     }

//     passport.use(new LocalStrategy({
//         usernameField: 'email'
//     }, authenticateUsers))
//     passport.serializeUser((user, done) => done(null, user.id))
//     passport.deserializeUser((id, done) => {
//         return done(null, getUserById(id))
//     })
// }

module.exports = initializePassport