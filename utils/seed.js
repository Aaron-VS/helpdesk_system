// Run with: node utils/seed.js
// Creates one manager, one agent, and default SLA rules so you can start
// testing immediately without manually flipping roles in the DB.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const SlaRule = require('../models/SlaRule');
const { ROLES, TICKET_CATEGORY, TICKET_PRIORITY } = require('../config/constants');

const run = async () => {
  await connectDB();
  const salt = await bcrypt.genSalt(10);

  const managerEmail = 'manager@helpdesk.com';
  const agentEmail = 'agent@helpdesk.com';

  const existingManager = await User.findOne({ email: managerEmail });
  if (!existingManager) {
    await User.create({
      name: 'Default Manager',
      email: managerEmail,
      passwordHash: await bcrypt.hash('password123', salt),
      role: ROLES.MANAGER,
    });
    console.log(`Created manager: ${managerEmail} / password123`);
  }

  const existingAgent = await User.findOne({ email: agentEmail });
  if (!existingAgent) {
    await User.create({
      name: 'Default Agent',
      email: agentEmail,
      passwordHash: await bcrypt.hash('password123', salt),
      role: ROLES.AGENT,
    });
    console.log(`Created agent: ${agentEmail} / password123`);
  }

  const defaultRules = [
    { category: TICKET_CATEGORY.TECHNICAL, priority: TICKET_PRIORITY.URGENT, resolutionHours: 4 },
    { category: TICKET_CATEGORY.TECHNICAL, priority: TICKET_PRIORITY.HIGH, resolutionHours: 8 },
    { category: TICKET_CATEGORY.TECHNICAL, priority: TICKET_PRIORITY.MEDIUM, resolutionHours: 24 },
    { category: TICKET_CATEGORY.TECHNICAL, priority: TICKET_PRIORITY.LOW, resolutionHours: 48 },
    { category: TICKET_CATEGORY.BILLING, priority: TICKET_PRIORITY.URGENT, resolutionHours: 4 },
    { category: TICKET_CATEGORY.BILLING, priority: TICKET_PRIORITY.HIGH, resolutionHours: 8 },
    { category: TICKET_CATEGORY.BILLING, priority: TICKET_PRIORITY.MEDIUM, resolutionHours: 24 },
    { category: TICKET_CATEGORY.BILLING, priority: TICKET_PRIORITY.LOW, resolutionHours: 48 },
    { category: TICKET_CATEGORY.ACCOUNT, priority: TICKET_PRIORITY.URGENT, resolutionHours: 4 },
    { category: TICKET_CATEGORY.ACCOUNT, priority: TICKET_PRIORITY.HIGH, resolutionHours: 8 },
    { category: TICKET_CATEGORY.ACCOUNT, priority: TICKET_PRIORITY.MEDIUM, resolutionHours: 24 },
    { category: TICKET_CATEGORY.ACCOUNT, priority: TICKET_PRIORITY.LOW, resolutionHours: 48 },
    { category: TICKET_CATEGORY.GENERAL, priority: TICKET_PRIORITY.URGENT, resolutionHours: 6 },
    { category: TICKET_CATEGORY.GENERAL, priority: TICKET_PRIORITY.HIGH, resolutionHours: 12 },
    { category: TICKET_CATEGORY.GENERAL, priority: TICKET_PRIORITY.MEDIUM, resolutionHours: 24 },
    { category: TICKET_CATEGORY.GENERAL, priority: TICKET_PRIORITY.LOW, resolutionHours: 72 },
    { category: TICKET_CATEGORY.BUG, priority: TICKET_PRIORITY.URGENT, resolutionHours: 2 },
    { category: TICKET_CATEGORY.BUG, priority: TICKET_PRIORITY.HIGH, resolutionHours: 6 },
    { category: TICKET_CATEGORY.BUG, priority: TICKET_PRIORITY.MEDIUM, resolutionHours: 24 },
    { category: TICKET_CATEGORY.BUG, priority: TICKET_PRIORITY.LOW, resolutionHours: 48 },
  ];

  for (const rule of defaultRules) {
    await SlaRule.updateOne(
      { category: rule.category, priority: rule.priority },
      { $setOnInsert: rule },
      { upsert: true }
    );
  }
  console.log(`Seeded ${defaultRules.length} SLA rules (category x priority).`);

  await mongoose.connection.close();
  console.log('Seeding complete.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
