const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.static(path.join(__dirname)));
app.use(express.json());

// API to get all dashboard data
app.get('/api/dashboard', async (req, res) => {
    try {
        const { data: visitorsData, error: visitorsError } = await supabase
            .from('site_stats')
            .select('value')
            .eq('key', 'visitors')
            .single();

        if (visitorsError && visitorsError.code !== 'PGRST116') {
            throw visitorsError;
        }

        const { count: subscribersCount, error: subscribersCountError } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true });

        if (subscribersCountError) {
            throw subscribersCountError;
        }

        const { data: subscribers, error: subscribersError } = await supabase
            .from('subscribers')
            .select('email, subscribed_at')
            .order('subscribed_at', { ascending: false });

        if (subscribersError) {
            throw subscribersError;
        }

        res.json({
            visitors: visitorsData ? visitorsData.value : 0,
            subscribersCount: subscribersCount,
            subscribers: subscribers
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
