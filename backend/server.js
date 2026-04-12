const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectToDatabase = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// Routes
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/farmers', farmerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handling middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
