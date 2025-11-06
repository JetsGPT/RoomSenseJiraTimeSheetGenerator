// Simple Express server to proxy Jira API requests and serve the React app
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for Jira API requests
app.post('/api/jira-proxy', async (req, res) => {
    const { url, email, apiToken } = req.body;

    if (!url || !email || !apiToken) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ 
                error: `Jira API error: ${response.status}`,
                details: errorText 
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`📊 For development, run: npm run dev`);
        console.log(`📊 Then open: http://localhost:5173`);
    }
});
