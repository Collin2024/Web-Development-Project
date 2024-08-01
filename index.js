const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');
const app = express();
const indexRouter = require('./routes');

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Set view engine
app.set('view engine', 'pug');

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize default user
const initializeUser = async () => {
    try {
        const username = 'cmps369';
        const password = 'rcnj';
        const hashedPassword = await bcrypt.hash(password, 10);

        db.get(`SELECT username FROM Users WHERE username = ?`, [username], (err, row) => {
            if (err) {
                console.error('Error querying database:', err);
                return;
            }
            if (!row) {
                db.run(`INSERT INTO Users (firstName, lastName, username, password) VALUES (?, ?, ?, ?)`,
                    ['Admin', 'User', username, hashedPassword], (err) => {
                        if (err) {
                            console.error('Error inserting user:', err);
                        } else {
                            console.log('Default user initialized.');
                        }
                    });
            } else {
                console.log('Default user already exists.');
            }
        });
    } catch (error) {
        console.error('Error initializing user:', error);
    }
};

initializeUser();

// Add user to response locals
app.use((req, res, next) => {
    res.locals.user = req.session.userId ? { id: req.session.userId, username: req.session.username } : null;
    next();
});

// Routes
app.use('/', indexRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
