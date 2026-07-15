const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const importRoutes = require('./routes/import.routes');
const userRoutes = require('./routes/users.routes');
const errorHandler = require('./middleware/error');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

async function start() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ellora_crm');
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
