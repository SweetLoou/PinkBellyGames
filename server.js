const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Custom middleware to count root visits
app.use((req, res, next) => {
    if (req.path === '/') {
        console.log('Root page accessed. Incrementing visitor count...');
        db.run("UPDATE site_stats SET value = value + 1 WHERE key = 'visitors'", function(err) {
            if (err) {
                console.error('Failed to update visitor count:', err.message);
            } else {
                console.log('Visitor count successfully updated.');
            }
        });
    }
    next();
});

app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});
const upload = multer({ storage: storage });

// Create subscribers table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Subscribers table is ready.');
});

// Create a table for site statistics (e.g., visitors)
db.run(`CREATE TABLE IF NOT EXISTS site_stats (
    key TEXT PRIMARY KEY,
    value INTEGER
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    // Initialize visitor count if it doesn't exist
    db.run(`INSERT OR IGNORE INTO site_stats (key, value) VALUES ('visitors', 0)`);
    console.log('Site stats table is ready.');
});

// Create settings table
db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('logo', '')`);
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('socials', '[]')`);
    console.log('Settings table is ready.');
});


// API Routes
app.post('/subscribe', (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const stmt = db.prepare('INSERT INTO subscribers (email) VALUES (?)');
    stmt.run(email, function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ message: 'Email already subscribed' });
            }
            return res.status(500).json({ message: 'Error subscribing email' });
        }
        res.status(201).json({ message: 'Successfully subscribed' });
    });
    stmt.finalize();
});

app.post('/admin/login', (req, res) => {
    console.log('Admin login attempt...');
    const { password } = req.body;
    if (password === 'Admin@123') {
        console.log('Admin login successful.');
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin/settings', (req, res) => {
    db.all('SELECT key, value FROM settings', [], (err, rows) => {
        if (err) {
            res.status(500).json({ message: 'Error fetching settings' });
            return;
        }
        const settings = rows.reduce((acc, row) => {
            acc[row.key] = row.key === 'socials' ? JSON.parse(row.value) : row.value;
            return acc;
        }, {});
        res.json(settings);
    });
});

app.post('/admin/settings', upload.single('logo'), (req, res) => {
    const { socials } = req.body;

    if (req.file) {
        const logoPath = '/uploads/' + req.file.filename;
        db.run(`UPDATE settings SET value = ? WHERE key = 'logo'`, [logoPath], (err) => {
            if (err) return res.status(500).json({ message: 'Error saving logo' });
        });
    }

    if (socials) {
        db.run(`UPDATE settings SET value = ? WHERE key = 'socials'`, [socials], (err) => {
            if (err) return res.status(500).json({ message: 'Error saving social links' });
        });
    }

    res.status(200).json({ message: 'Settings saved successfully' });
});

app.get('/settings.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html'));
});

app.get('/admin/subscribers', (req, res) => {
    console.log('Fetching subscribers list...');
    db.all('SELECT email, subscribed_at FROM subscribers ORDER BY subscribed_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Error fetching subscribers:', err);
            return res.status(500).json({ message: 'Error fetching subscribers' });
        }
        console.log(`Found ${rows.length} subscribers.`);
        res.json(rows);
    });
});

app.get('/admin/stats', (req, res) => {
    console.log('Fetching site stats...');
    db.get("SELECT value FROM site_stats WHERE key = 'visitors'", [], (err, row) => {
        if (err) {
            console.error('Error fetching visitor stats:', err);
            return res.status(500).json({ message: 'Error fetching visitor stats' });
        }
        const visitorCount = row ? row.value : 0;
        console.log(`Visitor count: ${visitorCount}`);
        
        db.get("SELECT COUNT(*) as count FROM subscribers", [], (err, row) => {
            if (err) {
                console.error('Error fetching subscriber stats:', err);
                return res.status(500).json({ message: 'Error fetching subscriber stats' });
            }
            const subscriberCount = row ? row.count : 0;
            console.log(`Subscriber count: ${subscriberCount}`);
            res.json({ visitors: visitorCount, subscribers: subscriberCount });
        });
    });
});

// The app.get('/') route that was here previously was not being called
// because the express.static middleware was intercepting the request first.
// The new custom middleware above solves this issue.

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
