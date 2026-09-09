require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const slaRuleRoutes = require('./routes/slaRuleRoutes');
const reportRoutes = require('./routes/reportRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Health check - useful to confirm the server is up before hitting real routes.
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Helpdesk API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/sla-rules', slaRuleRoutes);
app.use('/api', reportRoutes); // exposes /api/agents/:id/workload and /api/manager/reports/*

// 404 handler for unmatched routes, then the centralized error handler.
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
