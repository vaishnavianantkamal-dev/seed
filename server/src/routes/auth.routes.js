const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_me', { expiresIn: process.env.JWT_EXPIRES || '7d' });
  res.json({ success: true, data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } } });
});

router.post('/register', requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role });
  res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
