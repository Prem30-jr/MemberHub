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

module.exports = router;