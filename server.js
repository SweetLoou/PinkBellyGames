const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const supabaseUrl = 'https://nabbbowykckcfsixxgws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hYmJib3d5a2NrY2ZzaXh4Z3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMTA3MDgsImV4cCI6MjA2Njc4NjcwOH0.NRILPviKwcDE1b7cvJxjSCAJZXp_2ox80WiT35QrpNg';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.static(path.join(__dirname)));
app.use(express.json());

// API to get visitor stats
app.get('/api/stats/visitors', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('site_stats')
            .select('value')
            .eq('key', 'visitors')
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        res.json({ visitors: data ? data.value : 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get subscribers
app.get('/api/subscribers', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('subscribers')
            .select('email, subscribed_at')
            .order('subscribed_at', { ascending: false });

        if (error) {
            throw error;
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get subscriber count
app.get('/api/subscribers/count', async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true });

        if (error) {
            throw error;
        }
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
