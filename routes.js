const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const router = express.Router();

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Home route - Display all contacts
router.get('/',  (req, res) => {
    db.all(`SELECT * FROM Contacts `, (err, rows) => {
        if (err) {
            res.status(500).send('Server Error');
        } else {
            // console.log('Fetched Contacts:', rows); 
            res.render('index', { contacts: rows, user: req.session.user });
        }
    });
});

// Login route
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM Users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user || !(await bcrypt.compare(password, user.password))) {
            res.render('login', { error: 'Invalid username or password' });
        } else {
            req.session.user = user;
            res.redirect('/');
        }
    });
});

// Signup route
router.get('/signup', (req, res) => {
    res.render('signup');
});

router.post('/signup', async (req, res) => {
    const { firstName, lastName, username, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        res.render('signup', { error: 'Passwords do not match' });
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO Users (firstName, lastName, username, password) VALUES (?, ?, ?, ?)`,
            [firstName, lastName, username, hashedPassword], (err) => {
                if (err) {
                    res.render('signup', { error: 'Username already taken' });
                } else {
                    res.redirect('/login');
                }
            });
    }
});

// Create contact route
router.get('/create', (req, res) => {
    res.render('create');
});



router.post('/create', (req, res) => {
    const {
        title, firstName, lastName, phoneNumber, emailAddress, street, city, state, zip, country, latitude, longitude, contactByEmail, contactByPhone, contactByMail
    } = req.body;

      // Validate latitude and longitude
      const latRegex = /^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/;
      const lonRegex = /^-?((1[0-7]\d(\.\d+)?|([1-9]?\d(\.\d+)?))|180(\.0+)?)$/;
  
      if (!latRegex.test(latitude)) {
          return res.status(400).send('Invalid latitude. Please enter a value between -90 and 90.');
      }
  
      if (!lonRegex.test(longitude)) {
          return res.status(400).send('Invalid longitude. Please enter a value between -180 and 180.');
      }
  

    db.run(`
        INSERT INTO Contacts (title, firstName, lastName, phoneNumber, emailAddress, street, city, state, zip, country, Latitude, Longitude, contactByEmail, contactByPhone, contactByMail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, firstName, lastName, phoneNumber, emailAddress, street, city, state, zip, country, parseFloat(latitude), parseFloat(longitude), contactByEmail ? 1 : 0, contactByPhone ? 1 : 0, contactByMail ? 1 : 0],
        (err) => {
            if (err) {
                console.error("Error inserting data:", err);
                res.status(500).send('Server Error');
            } else {
                res.redirect('/');
            }
        }
    );
});
// View contact route
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.get(`SELECT * FROM Contacts WHERE id = ?`, [id], (err, row) => {
        if (err || !row) {
            res.status(404).send('Contact not found');
        } else {
            res.render('view', { contact: row });
        }
    });
});




// Edit contact route
router.get('/:id/edit', isAuthenticated, (req, res) => {
    const id = req.params.id;
    db.get(`SELECT * FROM Contacts WHERE id = ?`, [id], (err, row) => {
        if (err || !row) {
            res.status(404).send('Contact not found');
        } else {
            res.render('edit', { contact: row });
        }
    });
});

// Edit contact route - Handle form submission
router.post('/:id/edit', isAuthenticated, (req, res) => {
    const id = req.params.id;
    const { title, firstName, lastName, phoneNumber, emailAddress, street, city, state, zip, country, latitude, longitude, contactByEmail, contactByPhone, contactByMail } = req.body;

    // Validate latitude and longitude
    const latRegex = /^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/;
    const lonRegex = /^-?((1[0-7]\d(\.\d+)?|([1-9]?\d(\.\d+)?))|180(\.0+)?)$/;

    if (!latRegex.test(latitude)) {
        return res.status(400).send('Invalid latitude. Please enter a value between -90 and 90.');
    }

    if (!lonRegex.test(longitude)) {
        return res.status(400).send('Invalid longitude. Please enter a value between -180 and 180.');
    }

    db.run(`UPDATE Contacts SET title = ?, firstName = ?, lastName = ?, phoneNumber = ?, emailAddress = ?, street = ?, city = ?, state = ?, zip = ?, country = ?, latitude = ?, longitude = ?, contactByEmail = ?, contactByPhone = ?, contactByMail = ? WHERE id = ?`,
        [title, firstName, lastName, phoneNumber, emailAddress, street, city, state, zip, country, parseFloat(latitude), parseFloat(longitude), contactByEmail ? 1 : 0, contactByPhone ? 1 : 0, contactByMail ? 1 : 0, id], (err) => {
            if (err) {
                res.status(500).send('Server Error');
            } else {
                res.redirect(`/${id}`);
            }
        });
});



// Delete contact route
router.get('/:id/delete', isAuthenticated, (req, res) => {
    const id = req.params.id;
    db.get(`SELECT * FROM Contacts WHERE id = ?`, [id], (err, row) => {
        if (err || !row) {
            res.status(404).send('Contact not found');
        } else {
            res.render('delete', { contact: row });
        }
    });
});

router.post('/:id/delete', isAuthenticated, (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM Contacts WHERE id = ?`, [id], (err) => {
        if (err) {
            res.status(500).send('Server Error');
        } else {
            res.redirect('/');
        }
    });
});

router.post('/logout', isAuthenticated, async (req, res) => {
    try {
        console.log("Attempting to log out");

        // Destroy the session
        await new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // Clear the cookie
        await new Promise((resolve, reject) => {
            res.clearCookie('connect.sid', { path: '/' }, (clearErr) => {
                if (clearErr) {
                    console.error('Cookie clear error:', clearErr);
                    reject(clearErr);
                } else {
                    resolve();
                }
            });
        });

        console.log('User logged out and cookie cleared');
        res.redirect('/login');

    } catch (error) {
        console.error('Logout error:', error);
        res.redirect('/');
    }
});


module.exports = router;
