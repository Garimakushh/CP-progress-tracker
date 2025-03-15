
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Home route
router.get('/', (req, res) => {
  res.render('index');
});

// Dashboard route
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard');
});

module.exports = router;
