
const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Submission, Rating } = require('./models');
const { 
  fetchCodeforcesData, 
  fetchLeetcodeData, 
  fetchCodeChefData, 
  fetchGeeksforGeeksData 
} = require('./api_utils');

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.redirect('/login');
};

// Home page
router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('index');
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('register');
});

// Handle registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if username or email exists
    const existingUser = await User.findOne({
      where: {
        [Sequelize.Op.or]: [
          { username: username },
          { email: email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: passwordHash
    });
    
    // Set user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error(`Error during registration: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login');
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({
      where: { username }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Set user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error(`Error during login: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(`Error during logout: ${err.message}`);
    }
    res.redirect('/');
  });
});

// Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    res.render('dashboard', { user });
  } catch (error) {
    console.error(`Error loading dashboard: ${error.message}`);
    res.status(500).send('Error loading dashboard');
  }
});

// Profile page
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    res.render('profile', { user });
  } catch (error) {
    console.error(`Error loading profile: ${error.message}`);
    res.status(500).send('Error loading profile');
  }
});

// Update profile
router.post('/api/profile', isAuthenticated, async (req, res) => {
  try {
    const { codeforces_handle, leetcode_username, codechef_username, geeksforgeeks_username } = req.body;
    
    await User.update({
      codeforces_handle,
      leetcode_username,
      codechef_username,
      geeksforgeeks_username
    }, {
      where: { id: req.session.user.id }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Error updating profile: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API: Dashboard data
router.get('/api/dashboard', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    
    // Get submissions by platform
    const codeforcesSubmissions = await Submission.findAll({
      where: {
        UserId: user.id,
        platform: 'Codeforces'
      }
    });
    
    const leetcodeSubmissions = await Submission.findAll({
      where: {
        UserId: user.id,
        platform: 'LeetCode'
      }
    });
    
    const codechefSubmissions = await Submission.findAll({
      where: {
        UserId: user.id,
        platform: 'CodeChef'
      }
    });
    
    const geeksforgeeksSubmissions = await Submission.findAll({
      where: {
        UserId: user.id,
        platform: 'GeeksforGeeks'
      }
    });
    
    // Get ratings
    const ratings = await Rating.findAll({
      where: {
        UserId: user.id
      },
      order: [['rating_time', 'ASC']]
    });
    
    // Format data for dashboard
    const dashboardData = {
      total_solved: codeforcesSubmissions.length + leetcodeSubmissions.length + 
                    codechefSubmissions.length + geeksforgeeksSubmissions.length,
      platform_distribution: [
        { platform: 'Codeforces', count: codeforcesSubmissions.length },
        { platform: 'LeetCode', count: leetcodeSubmissions.length },
        { platform: 'CodeChef', count: codechefSubmissions.length },
        { platform: 'GeeksforGeeks', count: geeksforgeeksSubmissions.length }
      ],
      leetcode_stats: {
        easy: leetcodeSubmissions.filter(s => s.difficulty === 'Easy').length,
        medium: leetcodeSubmissions.filter(s => s.difficulty === 'Medium').length,
        hard: leetcodeSubmissions.filter(s => s.difficulty === 'Hard').length
      },
      codeforces_stats: {
        div1: codeforcesSubmissions.filter(s => s.difficulty && parseInt(s.difficulty) >= 1900).length,
        div2: codeforcesSubmissions.filter(s => s.difficulty && parseInt(s.difficulty) >= 1600 && parseInt(s.difficulty) < 1900).length,
        div3: codeforcesSubmissions.filter(s => s.difficulty && parseInt(s.difficulty) < 1600).length
      },
      codechef_stats: {
        easy: codechefSubmissions.filter(s => s.difficulty && s.difficulty.toLowerCase() === 'easy').length,
        medium: codechefSubmissions.filter(s => s.difficulty && s.difficulty.toLowerCase() === 'medium').length,
        hard: codechefSubmissions.filter(s => s.difficulty && s.difficulty.toLowerCase() === 'hard').length
      },
      geeksforgeeks_stats: {
        school: geeksforgeeksSubmissions.filter(s => s.difficulty && s.difficulty.toLowerCase() === 'school').length,
        basic: geeksforgeeksSubmissions.filter(s => s.difficulty && s.difficulty.toLowerCase() === 'basic').length,
        easy: geeksforgeeksSubmissions.filter(s => s.difficulty && s.difficulty.toLowerCase() === 'easy').length,
        medium: geeksforgeeksSubmissions.filter(s => s.difficulty && s.difficulty.toLowerCase() === 'medium').length,
        hard: geeksforgeeksSubmissions.filter(s => s.difficulty && s.difficulty.toLowerCase() === 'hard').length
      },
      ratings: ratings.map(r => ({
        platform: r.platform,
        rating: r.rating,
        time: r.rating_time.toISOString().split('T')[0]
      }))
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error(`Error fetching dashboard data: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API: Recent Submissions
router.get('/api/recent_submissions', isAuthenticated, async (req, res) => {
  try {
    const recent = await Submission.findAll({
      where: {
        UserId: req.session.user.id
      },
      order: [['submission_time', 'DESC']],
      limit: 10
    });
    
    const submissions = recent.map(sub => ({
      platform: sub.platform,
      problem_name: sub.problem_name,
      problem_id: sub.problem_id,
      difficulty: sub.difficulty,
      status: sub.status,
      language: sub.language,
      time: sub.submission_time.toISOString().slice(0, 16).replace('T', ' ')
    }));
    
    res.json(submissions);
  } catch (error) {
    console.error(`Error getting recent submissions: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API: Fetch Codeforces data
router.get('/api/platforms/codeforces/:handle', isAuthenticated, async (req, res) => {
  try {
    const { handle } = req.params;
    
    // Fetch data
    const [submissions, ratings] = await fetchCodeforcesData(handle);
    
    // Save submissions
    for (const sub of submissions) {
      await Submission.findOrCreate({
        where: {
          UserId: req.session.user.id,
          platform: 'Codeforces',
          problem_id: sub.problem_id,
          status: sub.status
        },
        defaults: {
          problem_name: sub.problem_name,
          difficulty: sub.difficulty,
          language: sub.language,
          submission_time: sub.submission_time
        }
      });
    }
    
    // Save ratings
    for (const r of ratings) {
      await Rating.findOrCreate({
        where: {
          UserId: req.session.user.id,
          platform: 'Codeforces',
          contest_id: r.contest_id
        },
        defaults: {
          contest_name: r.contest_name,
          rating: r.rating,
          rating_time: r.rating_time
        }
      });
    }
    
    res.json({ 
      success: true, 
      message: `Updated Codeforces data for ${handle}: ${submissions.length} submissions, ${ratings.length} contests` 
    });
  } catch (error) {
    console.error(`Error fetching Codeforces data: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API: Fetch LeetCode data
router.get('/api/platforms/leetcode/:username', isAuthenticated, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Fetch data
    const [submissions, stats] = await fetchLeetcodeData(username);
    
    // Save submissions
    for (const sub of submissions) {
      await Submission.findOrCreate({
        where: {
          UserId: req.session.user.id,
          platform: 'LeetCode',
          problem_id: sub.problem_id,
          status: sub.status
        },
        defaults: {
          problem_name: sub.problem_name,
          difficulty: sub.difficulty,
          language: sub.language,
          submission_time: sub.submission_time
        }
      });
    }
    
    res.json({ 
      success: true, 
      message: `Updated LeetCode data for ${username}: ${submissions.length} submissions` 
    });
  } catch (error) {
    console.error(`Error fetching LeetCode data: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API: Fetch CodeChef data
router.get('/api/platforms/codechef/:username', isAuthenticated, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Fetch data
    const [submissions, ratings] = await fetchCodeChefData(username);
    
    // Save submissions
    for (const sub of submissions) {
      await Submission.findOrCreate({
        where: {
          UserId: req.session.user.id,
          platform: 'CodeChef',
          problem_id: sub.problem_id,
          status: sub.status
        },
        defaults: {
          problem_name: sub.problem_name,
          difficulty: sub.difficulty,
          language: sub.language,
          submission_time: sub.submission_time
        }
      });
    }
    
    // Save ratings
    for (const r of ratings) {
      await Rating.findOrCreate({
        where: {
          UserId: req.session.user.id,
          platform: 'CodeChef',
          contest_id: r.contest_id
        },
        defaults: {
          contest_name: r.contest_name,
          rating: r.rating,
          rating_time: r.rating_time
        }
      });
    }
    
    res.json({ 
      success: true, 
      message: `Updated CodeChef data for ${username}: ${submissions.length} submissions, ${ratings.length} contests` 
    });
  } catch (error) {
    console.error(`Error fetching CodeChef data: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// API: Fetch GeeksforGeeks data
router.get('/api/platforms/geeksforgeeks/:username', isAuthenticated, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Fetch data
    const [submissions, stats] = await fetchGeeksforGeeksData(username);
    
    // Save submissions
    for (const sub of submissions) {
      await Submission.findOrCreate({
        where: {
          UserId: req.session.user.id,
          platform: 'GeeksforGeeks',
          problem_id: sub.problem_id,
          status: sub.status
        },
        defaults: {
          problem_name: sub.problem_name,
          difficulty: sub.difficulty,
          language: sub.language,
          submission_time: sub.submission_time
        }
      });
    }
    
    res.json({ 
      success: true, 
      message: `Updated GeeksforGeeks data for ${username}: ${submissions.length} submissions` 
    });
  } catch (error) {
    console.error(`Error fetching GeeksforGeeks data: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
