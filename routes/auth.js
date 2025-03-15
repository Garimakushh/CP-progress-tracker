
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { forwardAuthenticated } = require('../middleware/auth');

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => {
  res.render('register');
});

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => {
  res.render('login');
});

// Register Handle
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, codeforces_handle, leetcode_username, codechef_username, geeksforgeeks_username } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.render('register', { 
          error: 'Username already taken',
          username, email, codeforces_handle, leetcode_username, codechef_username, geeksforgeeks_username 
        });
      } else {
        return res.render('register', { 
          error: 'Email already registered',
          username, email, codeforces_handle, leetcode_username, codechef_username, geeksforgeeks_username 
        });
      }
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      codeforces_handle,
      leetcode_username,
      codechef_username,
      geeksforgeeks_username
    });
    
    await newUser.save();
    
    // Redirect to login
    return res.render('login', { 
      success: 'Registration successful! Please login.' 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return res.render('register', { 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: false
  })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/auth/login');
  });
});

module.exports = router;
