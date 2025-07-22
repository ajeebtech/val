const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your actual MongoDB connection string
const uri = '/';
const client = new MongoClient(uri);

app.post('/api/players', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('vlr');
    const result = await db.collection('players').insertMany(req.body.players);
    res.json({ insertedCount: result.insertedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
