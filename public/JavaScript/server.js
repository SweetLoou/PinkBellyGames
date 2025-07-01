require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

app.use(express.static('public'));

app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_KEY,
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
