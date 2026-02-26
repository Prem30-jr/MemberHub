const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { verifyToken } = require('../middleware/auth');

// @route   POST /api/auth/sync
// @desc    Sync Firebase user with MongoDB Member model
// @access  Private (after Firebase Login)
router.post('/sync', verifyToken, async (req, res) => {
  console.log(`[AuthSync] Sync request received for UID: ${req.user.uid}, Email: ${req.user.email}`);
  try {
    let member = await Member.findOne({ firebaseUid: req.user.uid });

    if (!member) {
      console.log(`[AuthSync] No member with UID ${req.user.uid}. Checking for email ${req.user.email}...`);
      // check if member was manually onboarded by email
      member = await Member.findOne({ email: req.user.email });

      if (member) {
        console.log(`[AuthSync] Found member by email. Updating UID from ${member.firebaseUid} to ${req.user.uid}`);
        member.firebaseUid = req.user.uid;
        await member.save();
      } else {
        console.log(`[AuthSync] Creating new member for ${req.user.email}`);
        // Extract names from display name or email
        const displayName = req.user.name || req.user.email.split('@')[0];
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || 'Member';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        // Create new member record on first login
        member = new Member({
          personalInfo: {
            firstName,
            lastName,
          },
          email: req.user.email,
          firebaseUid: req.user.uid,
          role: req.user.email.includes('admin') ? 'admin' : 'staff',
        });
        await member.save();
      }
    } else {
      console.log(`[AuthSync] Found existing member by UID ${req.user.uid}`);
      if (!member.role) {
        member.role = req.user.email.includes('admin') ? 'admin' : 'staff';
        await member.save();
      }
    }

    res.json(member);
  } catch (err) {
    res.status(500).json({ message: 'Sync failed', error: err.message });
  }
});

// @route   POST /api/auth/login-staff
// @desc    Custom login for staff (Non-Firebase)
// @access  Public
router.post('/login-staff', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[StaffLogin] Login attempt for ${email}`);
  try {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'memberhub_secret_2024';

    const member = await Member.findOne({ email, role: 'staff' }).select('+password');
    if (!member) return res.status(401).json({ message: 'Invalid credentials' });

    if (member.status !== 'Active') {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: member._id, email: member.email }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, member });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// @route   POST /api/auth/register-user
// @desc    Custom registration for users
// @access  Public
router.post('/register-user', async (req, res) => {
  const { name, email, password } = req.body;
  console.log(`[UserRegister] Registration attempt for ${email}`);
  try {
    const existingMember = await Member.findOne({ email });
    if (existingMember) return res.status(400).json({ message: 'User already exists' });

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'Member';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const newMember = new Member({
      personalInfo: { firstName, lastName },
      email,
      password, // Hashed by Member model pre-save hook
      role: 'user',
      status: 'Active'
    });

    await newMember.save();

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'memberhub_secret_2024';
    const token = jwt.sign({ id: newMember._id, email: newMember.email }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ token, member: newMember });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// @route   POST /api/auth/login-user
// @desc    Simplified login for users (Email only)
// @access  Public
router.post('/login-user', async (req, res) => {
  const { email } = req.body;
  console.log(`[UserLogin] Login attempt for ${email}`);
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'memberhub_secret_2024';

    const member = await Member.findOne({ email, role: 'user' })
      .populate('currentPlan')
      .populate('recommendation.plan');

    if (!member) {
      return res.status(404).json({ message: 'Email not registered. Please contact staff.' });
    }

    // Allow login regardless of status (e.g. Expired users can still login to renew)
    if (member.status === 'Suspended') {
      return res.status(403).json({ message: 'Account is suspended. Please contact support.' });
    }

    const token = jwt.sign({ id: member._id, email: member.email }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, member });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

module.exports = router;