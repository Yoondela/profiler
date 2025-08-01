require('dotenv').config();
require('./models/Profile');
require('./models/ServiceRequest');

const express = require('express');
const connectDB = require('./config/db');

const app = express();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());

const userRoutes = require ('./routes/userRoutes');
app.use('/api/users', userRoutes);

const profileRoutes = require('./routes/profileRoutes');
app.use('/api/profiles', profileRoutes);

app.get('/', (req, res) => {
  res.send('Profiler backend is live');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
