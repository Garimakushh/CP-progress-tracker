const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Rating = require('../models/Rating');
const { fetchCodeforcesData, fetchLeetcodeData, fetchCodechefData, fetchGfgData } = require('../utils/apiUtils');

const platforms = {
  codeforces: fetchCodeforcesData,
  leetcode: fetchLeetcodeData,
  codechef: fetchCodechefData,
  geeksforgeeks: fetchGfgData
};

router.get('/refresh_data', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    const platformsRefreshed = [];

    for (const [platform, fetchFunction] of Object.entries(platforms)) {
      const usernameKey = `${platform}_handle` in user ? `${platform}_handle` : `${platform}_username`;

      if (user[usernameKey]) {
        try {
          const { submissions = [], ratings = [] } = await fetchFunction(user[usernameKey]);

          // Save submissions
          for (const submission of submissions) {
            if (submission.status === 'Accepted') {
              const exists = await Submission.exists({
                user: user._id,
                platform,
                problem_id: submission.problem_id,
                status: 'Accepted'
              });

              if (!exists) {
                await Submission.create({
                  user: user._id,
                  platform,
                  problem_id: submission.problem_id,
                  problem_name: submission.problem_name,
                  difficulty: submission.difficulty,
                  status: submission.status,
                  language: submission.language,
                  submission_time: submission.submission_time
                });
              }
            }
          }

          // Save ratings if the platform has ratings
          if (ratings.length) {
            for (const rating of ratings) {
              const exists = await Rating.exists({
                user: user._id,
                platform,
                contest_id: rating.contest_id
              });

              if (!exists) {
                await Rating.create({
                  user: user._id,
                  platform,
                  rating: rating.rating,
                  contest_id: rating.contest_id,
                  contest_name: rating.contest_name,
                  rating_time: rating.rating_time
                });
              }
            }
          }

          platformsRefreshed.push(platform);
        } catch (error) {
          console.error(`Error refreshing ${platform} data: ${error.message}`);
        }
      }
    }

    user.last_refresh = new Date();
    await user.save();

    return res.json({
      success: true,
      platforms_refreshed: platformsRefreshed,
      last_refresh: user.last_refresh.toISOString()
    });
  } catch (error) {
    console.error(`Error refreshing data: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/user_stats', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    const stats = {
      total_solved: 0,
      rating_history: [],
      last_refresh: user.last_refresh ? user.last_refresh.toISOString() : null
    };

    for (const platform of Object.keys(platforms)) {
      // Fetch accepted submissions
      const submissions = await Submission.find({ user: user._id, platform, status: 'Accepted' });
      stats[`${platform}_solved`] = submissions.length;
      stats.total_solved += submissions.length;

      // Fetch latest ratings
      const ratings = await Rating.find({ user: user._id, platform }).sort({ rating_time: -1 });

      stats[`${platform}_rating`] = ratings.length > 0 ? ratings[0].rating : 0;

      // Add rating history for visualization
      stats.rating_history.push(
        ...ratings.map(rating => ({
          time: rating.rating_time.toISOString().split('T')[0],
          rating: rating.rating,
          contest: rating.contest_name,
          platform
        }))
      );
    }

    return res.json(stats);
  } catch (error) {
    console.error(`Error fetching user stats: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});


router.get('/recent_submissions', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    const recentSubmissions = await Submission.find({ user: user._id }).sort({ submission_time: -1 }).limit(10);

    return res.json(
      recentSubmissions.map(sub => ({
        platform: sub.platform,
        problem_name: sub.problem_name,
        problem_id: sub.problem_id,
        difficulty: sub.difficulty,
        status: sub.status,
        language: sub.language,
        time: sub.submission_time.toISOString().split('.')[0].replace('T', ' ')
      }))
    );
  } catch (error) {
    console.error(`Error fetching recent submissions: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
