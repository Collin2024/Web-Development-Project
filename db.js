const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./contacts.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the contacts database.');
    }
});

db.serialize(() => {
    // Create Users table if it does not exist
    db.run(`
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firstName TEXT,
            lastName TEXT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    // Create Contacts table with new columns
    db.run(`
        CREATE TABLE IF NOT EXISTS Contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            firstName TEXT,
            lastName TEXT,
            phoneNumber TEXT,
            emailAddress TEXT,
            street TEXT,
            city TEXT,
            state TEXT,
            zip TEXT,
            country TEXT,
            Latitude REAL,
            Longitude REAL,
            contactByEmail INTEGER,
            contactByPhone INTEGER,
            contactByMail INTEGER
        )
    `);

    // Function to add column if it does not exist
    function addColumnIfNotExists(columnName, columnType) {
        db.all(`PRAGMA table_info(Contacts)`, (err, columns) => {
            if (err) {
                console.error(err);
                return;
            }
            
            // Check if the column already exists
            const columnExists = columns.some(col => col.name === columnName);

            if (!columnExists) {
                db.run(`ALTER TABLE Contacts ADD COLUMN ${columnName} ${columnType}`, (err) => {
                    if (err) {
                        console.error(`Error adding column ${columnName}:`, err);
                    } else {
                        console.log(`Added column ${columnName}`);
                    }
                });
            }
        });
    }

    // Add new columns if they do not exist
    addColumnIfNotExists('title', 'TEXT');
    addColumnIfNotExists('Latitude', 'REAL');
    addColumnIfNotExists('Longitude', 'REAL');
    addColumnIfNotExists('contactByMail', 'INTEGER');
});

module.exports = db;
