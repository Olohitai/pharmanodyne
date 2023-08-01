// models/user.js

const db = require('sqlite3').verbose();

class User {
    constructor({
        username,
        email,
        password,
        firstname,
        lastname
    }) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.firstname = firstname;
        this.lastname = lastname;
    }

    static async createUser(user) {
        const query = 'INSERT INTO users (username, email, password, firstname, lastname) VALUES (?, ?, ?, ?, ?)';
        return new Promise((resolve, reject) => {
            db.run(query, [user.username, user.email, user.password, user.firstname, user.lastname], function (err) {
                if (err) {
                    console.error('Error creating user:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = ?';
        return new Promise((resolve, reject) => {
            db.get(query, [username], (err, row) => {
                if (err) {
                    console.error('Error finding user by username:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = ?';
        return new Promise((resolve, reject) => {
            db.get(query, [id], (err, row) => {
                if (err) {
                    console.error('Error finding user by ID:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}

module.exports = User;