require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes   = require('./routes/authRoutes');
const waterRoutes  = require('./routes/waterRoutes');
const sensorRoutes = require('./routes/sensorRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',    authRoutes);
app.use('/api/water',   waterRoutes);
app.use('/api/sensors', sensorRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
