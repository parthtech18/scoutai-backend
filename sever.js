import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    'https://scoutai-world-cup-pr-lrcv.bolt.host',
    'http://localhost:5173'
  ]
}));

app.post('/api/predict', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/scores', async (req, res) => {
  try {
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?status=LIVE,SCHEDULED,FINISHED',
      { headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY } }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (_, res) => res.json({ status: 'ScoutAI backend running' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ScoutAI backend on port ${PORT}`));
