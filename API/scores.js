export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

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
}
