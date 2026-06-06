export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { teamA, teamB, stage, conditions, isPro, injuries, form } = req.body;

  const prompt = `You are a world-class football analyst. Predict this FIFA World Cup 2026 match.

Match: ${teamA} vs ${teamB}
Stage: ${stage}
Conditions: ${conditions}
${isPro ? `Injuries: ${injuries || 'None'}\nForm: ${form || 'Not provided'}` : ''}

Return ONLY valid JSON, no markdown:
{
  "homeWin": <0-100>,
  "draw": <0-100>,
  "awayWin": <0-100>,
  "predictedScore": "<e.g. 2-1>",
  "winner": "<${teamA} or ${teamB} or Draw>",
  "confidence": "<Low|Medium|High>",
  "summary": "<3-4 sentences>",
  "keyFactors": ["<factor>","<factor>","<factor>"],
  ${isPro ? '"tacticalBreakdown": "<2-3 sentences>",' : ''}
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
    const prediction = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json({ success: true, prediction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
