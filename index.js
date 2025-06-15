require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());

const userRoutes = require ('./routes/userRoutes');

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Profiler backend is live');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
