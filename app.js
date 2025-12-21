require('dotenv').config();
require('./models/Profile');
require('./models/ServiceRequest');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://profiler-frontend-mauve.vercel.app',
];

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET','POST','PUT','DELETE','PATCH'],
  credentials: true,
}));

app.use(express.json());

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', require('./routes/uploadApi/uploadRoutes'));
app.use('/api', require('./routes/userRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/portfolios', require('./routes/portfolioRoutes'));
app.use('/api', require('./routes/serviceBookingsRoutes'));
app.use('/api/providers', require('./routes/publicRoutes'));
app.use('/api/providers', require('./routes/searchRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));


app.get('/api/health', (_, res) => res.send('Profiler backend is live'));

module.exports = app;
