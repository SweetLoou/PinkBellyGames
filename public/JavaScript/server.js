require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'pinkBellyGames';
let db;

async function connectToDb() {
    const client = new MongoClient(MONGO_URI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    try {
        await client.connect();
        db = client.db(DB_NAME);
        console.log('Connected to MongoDB');
        // Send a ping to confirm a successful connection
        await client.db('admin').command({ ping: 1 });
        console.log('Pinged your deployment. You successfully connected to MongoDB!');
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        // Do not exit the process, allow the server to start without DB connection
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

app.use(express.json());
const publicPath = path.join(__dirname, '..', '..', 'public');
console.log('Serving static files from:', publicPath);
app.use(express.static(publicPath));
app.use('/uploads', express.static(uploadsDir));
app.use('/assets', express.static(path.join(__dirname, '..', '..', 'assets')));

// API routes
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const subscribersCollection = db.collection('subscribers');
        const existingSubscriber = await subscribersCollection.findOne({ email });
        if (existingSubscriber) {
            return res.status(409).json({ message: 'Email already subscribed' });
        }
        await subscribersCollection.insertOne({ email, subscribedAt: new Date() });
        res.status(201).json({ message: 'Subscription successful' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        const settingsCollection = db.collection('settings');
        const settingsArray = await settingsCollection.find({}).toArray();
        const settings = settingsArray.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const settingsCollection = db.collection('settings');
        const { logo, socials } = req.body;

        if (logo) {
            await settingsCollection.updateOne({ key: 'logo' }, { $set: { value: logo } }, { upsert: true });
        }
        if (socials) {
            await settingsCollection.updateOne({ key: 'socials' }, { $set: { value: socials } }, { upsert: true });
        }
        res.status(200).json({ message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/upload-logo', upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const logoUrl = `/uploads/${req.file.filename}`;
        const settingsCollection = db.collection('settings');
        await settingsCollection.updateOne({ key: 'logo' }, { $set: { value: logoUrl } }, { upsert: true });
        res.status(200).json({ message: 'Logo uploaded successfully', filePath: logoUrl });
    } catch (error) {
        console.error('Logo upload error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    connectToDb();
});
