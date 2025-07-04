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

        // Ensure menu and socials are always arrays, even if not in DB
        if (!settings.menu) {
            settings.menu = [];
        }
        if (!settings.socials) {
            settings.socials = [];
        }

        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const settingsCollection = db.collection('settings');
        const { logo, socials, menu } = req.body;

        if (logo) {
            await settingsCollection.updateOne({ key: 'logo' }, { $set: { value: logo } }, { upsert: true });
        }
        if (socials) {
            await settingsCollection.updateOne({ key: 'socials' }, { $set: { value: socials } }, { upsert: true });
        }
        if (menu) {
            await settingsCollection.updateOne({ key: 'menu' }, { $set: { value: menu } }, { upsert: true });
        }
        res.status(200).json({ message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/preview', async (req, res) => {
    try {
        const { logo, socials, menu } = req.body;
        let htmlContent = fs.readFileSync(path.join(publicPath, 'index.html'), 'utf8');

        // Inject logo
        if (logo) {
            htmlContent = htmlContent.replace(/<img[^>]*id="site-logo"[^>]*src="[^"]*"[^>]*>/, `<img src="${logo}" alt="Pink Belly Games Logo" id="site-logo" class="logo logo-1">`);
        }

        // Inject menu
        if (menu && menu.length > 0) {
            const menuHtml = menu.map(item => `
                <li>
                    <a href="${item.url}" class="button n01" role="button" target="_blank" rel="noopener">${item.text}</a>
                </li>
            `).join('');
            htmlContent = htmlContent.replace(/<ul id="buttons02" class="buttons">[\s\S]*?<\/ul>/, `<ul id="buttons02" class="buttons">${menuHtml}</ul>`);
        }

        // Inject social links
        if (socials && socials.length > 0) {
            const socialUrlTemplates = {
                twitter: 'https://twitter.com/{username}',
                xtwitter: 'https://x.com/{username}',
                github: 'https://github.com/{username}',
                linkedin: 'https://linkedin.com/in/{username}',
                facebook: 'https://facebook.com/{username}',
                instagram: 'https://instagram.com/{username}',
                discord: 'https://discord.gg/{username}',
                youtube: 'https://youtube.com/@{username}',
                twitch: 'https://twitch.tv/{username}',
                patreon: 'https://patreon.com/{username}',
                kick: 'https://kick.com/{username}',
                kofi: 'https://ko-fi.com/{username}',
                artstation: 'https://www.artstation.com/{username}',
                bluesky: 'https://bsky.app/profile/{username}',
                cruseforge: 'https://www.curseforge.com/members/{username}/projects',
                deviantart: 'https://www.deviantart.com/{username}',
                fandom: 'https://www.fandom.com/u/{username}',
                modrinth: 'https://modrinth.com/user/{username}',
                sketchfab: 'https://sketchfab.com/{username}',
                snapchat: 'https://www.snapchat.com/add/{username}',
                spotify: 'https://open.spotify.com/user/{username}',
                teamspeak: 'ts3server://{username}',
                telegram: 'https://t.me/{username}',
                threads: 'https://www.threads.net/@{username}',
                tiktok: 'https://www.tiktok.com/@{username}',
                trello: 'https://trello.com/u/{username}',
                tumblr: 'https://{username}.tumblr.com',
                vk: 'https://vk.com/{username}',
                whatsapp: 'https://wa.me/{username}',
                wikipedia: 'https://en.wikipedia.org/wiki/User:{username}',
                reddit: 'https://www.reddit.com/user/{username}',
                domain: '{username}',
                google: 'https://plus.google.com/{username}',
                microsoft: 'https://www.microsoft.com/en-us/store/collections/apps?developer={username}',
                apple: 'https://www.apple.com/us/search/{username}',
                android: 'https://play.google.com/store/search?q={username}&c=apps',
                windows: 'https://www.microsoft.com/en-us/store/search/apps?q={username}',
                wise: 'https://wise.com/us/send-money/{username}',
                paypal: 'https://paypal.me/{username}',
                patreon2: 'https://patreon.com/{username}',
                promptpay: 'https://promptpay.io/{username}',
                qrcode: '{username}',
                qrpayment: '{username}',
                stripe: 'https://stripe.com/{username}',
                truewallet: '{username}',
                notion: 'https://www.notion.so/{username}',
            };

            const socialLinksHtml = socials.map(link => {
                if (!link.username) return '';
                const platform = link.platform.toLowerCase();
                const urlTemplate = socialUrlTemplates[platform];
                if (!urlTemplate) return '';

                const url = urlTemplate.replace('{username}', link.username);
                const iconName = platform === 'x' ? 'xtwitter' : platform;

                return `
                    <a href="${url}" class="social-link" target="_blank" rel="noopener">
                        <img src="/Social Icons (Pixel-Art)/128x/${iconName}_icon.png" alt="${link.platform}" class="social-icon">
                        <img src="/Social Icons (Pixel-Art)/128x/${iconName}_icon_bg.png" alt="${link.platform}" class="social-icon social-icon-hover">
                    </a>
                `;
            }).join('');
            htmlContent = htmlContent.replace(/<div id="socials-container" class="socials">[\s\S]*?<\/div>/, `<div id="socials-container" class="socials">${socialLinksHtml}</div>`);
        }

        // Create a temporary file for preview
        const previewFileName = `preview-${Date.now()}.html`;
        const previewFilePath = path.join(uploadsDir, previewFileName);
        fs.writeFileSync(previewFilePath, htmlContent);

        res.status(200).json({ previewUrl: `/uploads/${previewFileName}` });
    } catch (error) {
        console.error('Error generating preview:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/upload-logo', upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const logoUrl = `/uploads/${req.file.filename}`;
        const logosCollection = db.collection('logos');
        await logosCollection.insertOne({ url: logoUrl, uploadedAt: new Date() });
        res.status(200).json({ message: 'Logo uploaded successfully', filePath: logoUrl });
    } catch (error) {
        console.error('Logo upload error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/logos', async (req, res) => {
    try {
        const logosCollection = db.collection('logos');
        const logos = await logosCollection.find({}).toArray();
        res.json(logos);
    } catch (error) {
        console.error('Error fetching logos:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/delete-logo', async (req, res) => {
    try {
        const { id, url } = req.body;
        const logosCollection = db.collection('logos');
        const settingsCollection = db.collection('settings');

        // Check if the logo being deleted is the current active logo
        const currentSettings = await settingsCollection.findOne({ key: 'logo' });
        if (currentSettings && currentSettings.value === url) {
            // If it is, remove it from settings
            await settingsCollection.updateOne({ key: 'logo' }, { $set: { value: '' } });
        }

        // Delete from database
        await logosCollection.deleteOne({ _id: new MongoClient.ObjectId(id) });

        // Delete file from server
        const filePath = path.join(uploadsDir, path.basename(url));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(200).json({ message: 'Logo deleted successfully' });
    } catch (error) {
        console.error('Error deleting logo:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const subscribersCollection = db.collection('subscribers');
        const visitorsCollection = db.collection('visitors');

        const subscriberCount = await subscribersCollection.countDocuments();
        const visitorCount = await visitorsCollection.countDocuments();
        const subscribersData = await subscribersCollection.find({}).toArray(); // Fetch all subscriber data

        res.json({ visitors: visitorCount, subscribers: subscriberCount, subscribersData: subscribersData });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/subscribers-csv', async (req, res) => {
    try {
        const subscribersCollection = db.collection('subscribers');
        const subscribers = await subscribersCollection.find({}).toArray();

        let csv = 'Email,Time\n';
        subscribers.forEach(sub => {
            const date = new Date(sub.subscribedAt).toLocaleString();
            csv += `${sub.email},"${date}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('subscribers.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error generating CSV:', error);
        res.status(500).send('Internal server error');
    }
});

// Serve static files from the 'public' directory
const publicPath = path.join(__dirname, '..', '..', 'public');
console.log('Serving static files from:', publicPath);
app.use(express.static(publicPath));

// Serve specific HTML files from the public directory
app.get('/', async (req, res) => {
    try {
        const visitorsCollection = db.collection('visitors');
        await visitorsCollection.insertOne({ visitedAt: new Date(), ipAddress: req.ip });
    } catch (error) {
        console.error('Error incrementing visitor count:', error);
    }
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.use('/uploads', express.static(uploadsDir));
app.use('/assets', express.static(path.join(__dirname, '..', '..', 'assets')));

connectToDb().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
