

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const User = require('../models/User');

// Profile page
router.get('/', ensureAuthenticated, (req, res) => {
  res.render('profile');
});

// Update profile
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { codeforces_handle, leetcode_username, codechef_username, geeksforgeeks_username } = req.body;
    
    // Update user profile
    const user = req.user;
    user.codeforces_handle = codeforces_handle;
    user.leetcode_username = leetcode_username;
    user.codechef_username = codechef_username;
    user.geeksforgeeks_username = geeksforgeeks_username;
    
    await user.save();
    
    return res.render('profile', { success: 'Profile updated successfully!' });
  } catch (error) {
    console.error(`Error updating profile: ${error.message}`);
    return res.render('profile', { error: 'Failed to update profile' });
  }
});

module.exports = router;