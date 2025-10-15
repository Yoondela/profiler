require('dotenv').config();
require('./models/Profile');
require('./models/ServiceRequest');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const swaggerDocument = YAML.load('./swagger.yaml');
const express = require('express');
const connectDB = require('./config/db');

const app = express();

const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));


if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const userRoutes = require ('./routes/userRoutes');
app.use('/api', userRoutes);
app.use('/api/users', userRoutes);

const profileRoutes = require('./routes/profileRoutes');
app.use('/api/profiles', profileRoutes);

const serviceBookingsRoutes = require('./routes/serviceBookingsRoutes');
app.use('/api', serviceBookingsRoutes);

app.get('/', (req, res) => {
  res.send('Profiler backend is live');
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
