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

// ── AI Prediction (Google Gemini Flash — free) ──
app.post('/api/predict', async (req, res) => {
  const { teamA, teamB, stage, conditions, isPro, injuries, form } = req.body;

  const prompt = `You are a world-class football analyst. Search for recent news about both teams and predict this FIFA World Cup 2026 match.

Match: ${teamA} vs ${teamB}
Stage: ${stage}
Conditions: ${conditions}
${isPro ? `Injuries/suspensions: ${injuries || 'None reported'}
Recent form: ${form || 'Not provided'}` : ''}

Use your knowledge of current form, FIFA rankings, head-to-head history, squad quality, and any recent news about these teams.

Return ONLY valid JSON, no markdown:
{
  "homeWin": <integer 0-100>,
  "draw": <integer 0-100>,
  "awayWin": <integer 0-100>,
  "predictedScore": "<e.g. 2-1>",
  "winner": "<${teamA} or ${teamB} or Draw>",
  "confidence": "<Low|Medium|High>",
  "summary": "<3-4 sentences of analysis>",
  "keyFactors": ["<factor>","<factor>","<factor>"],
  ${isPro ? `"tacticalBreakdown": "<2-3 sentences on tactics>",` : ''}
  "bothTeamsScore": <true|false>,
  "over25Goals": <true|false>
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const prediction = JSON.parse(clean);
    res.json({ success: true, prediction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Live Scores (football-data.org — free) ──
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

app.get('/', (_, res) => res.json({ status: 'ScoutAI running — zero cost stack' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ScoutAI backend on port ${PORT}`));
