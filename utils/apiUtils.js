const axios = require('axios');

// Cache for API responses
const cache = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Fetch data from Codeforces API
 * @param {string} handle - Codeforces handle
 * @returns {Promise} Promise with submissions and ratings
 */
async function fetchCodeforcesData(handle) {
  try {
    const cacheKey = `codeforces_${handle}`;
    
    // Check cache
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_DURATION)) {
      console.log('Using cached Codeforces data');
      return cache[cacheKey].data;
    }

    // Fetch user info
    const userResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
    if (userResponse.data.status !== 'OK') throw new Error(userResponse.data.comment || 'Unknown error');

    // Fetch submissions
    const submissionsResponse = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=100`);
    if (submissionsResponse.data.status !== 'OK') throw new Error(submissionsResponse.data.comment || 'Unknown error');

    const submissions = submissionsResponse.data.result.map(item => ({
      problem_id: `${item.problem?.contestId || ''}${item.problem?.index || ''}`,
      problem_name: item.problem?.name || 'Unknown Problem',
      difficulty: String(item.problem?.rating || 0),
      status: item.verdict === 'OK' ? 'Accepted' : (item.verdict || 'Unknown'),
      language: item.programmingLanguage || 'Unknown',
      submission_time: new Date(item.creationTimeSeconds * 1000)
    }));

    // Fetch ratings
    const ratingsResponse = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);
    if (ratingsResponse.data.status !== 'OK') throw new Error(ratingsResponse.data.comment || 'Unknown error');

    const ratings = ratingsResponse.data.result.map(item => ({
      contest_id: String(item.contestId || ''),
      contest_name: item.contestName || 'Unknown Contest',
      rating: item.newRating || 0,
      rating_time: new Date(item.ratingUpdateTimeSeconds * 1000)
    }));

    // Save to cache
    const result = { submissions, ratings };
    cache[cacheKey] = { data: result, timestamp: Date.now() };
    
    return result;
  } catch (error) {
    console.error(`Error fetching Codeforces data: ${error.message}`);
    return { submissions: [], ratings: [] };
  }
}

/**
 * Fetch data from CodeChef API
 * @param {string} username - CodeChef username
 * @returns {Promise} Promise with contest ratings and submissions
 */
async function fetchCodechefData(username) {
  try {
    const cacheKey = `codechef_${username}`;
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_DURATION)) {
      console.log('Using cached CodeChef data');
      return cache[cacheKey].data;
    }

    const userResponse = await axios.get(`https://www.codechef.com/users/${username}`);
    if (!userResponse.data) throw new Error('Failed to fetch CodeChef user data');

    const ratingMatch = userResponse.data.match(/"rating":(\d+)/);
    const currentRating = ratingMatch ? parseInt(ratingMatch[1]) : 0;

    const submissions = []; // CodeChef does not provide easy API access for submissions

    const result = { submissions, rating: currentRating };
    cache[cacheKey] = { data: result, timestamp: Date.now() };

    return result;
  } catch (error) {
    console.error(`Error fetching CodeChef data: ${error.message}`);
    return { submissions: [], rating: 0 };
  }
}

/**
 * Fetch data from GeeksforGeeks API
 * @param {string} username - GeeksforGeeks username
 * @returns {Promise} Promise with problem-solving stats
 */
async function fetchGeeksforgeeksData(username) {
  try {
    const cacheKey = `geeksforgeeks_${username}`;
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_DURATION)) {
      console.log('Using cached GeeksforGeeks data');
      return cache[cacheKey].data;
    }

    const response = await axios.get(`https://geeksforgeeks.org/user/${username}/practice`);
    if (!response.data) throw new Error('Failed to fetch GeeksforGeeks data');

    const solvedProblemsMatch = response.data.match(/"total_problems_solved":(\d+)/);
    const totalSolved = solvedProblemsMatch ? parseInt(solvedProblemsMatch[1]) : 0;

    const result = { totalSolved };
    cache[cacheKey] = { data: result, timestamp: Date.now() };

    return result;
  } catch (error) {
    console.error(`Error fetching GeeksforGeeks data: ${error.message}`);
    return { totalSolved: 0 };
  }
}

/**
 * Fetch data from LeetCode API (Unofficial)
 * @param {string} username - LeetCode username
 * @returns {Promise} Promise with submissions and stats
 */
async function fetchLeetcodeData(username) {
  try {
    const cacheKey = `leetcode_${username}`;
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_DURATION)) {
      console.log('Using cached LeetCode data');
      return cache[cacheKey].data;
    }

    const url = 'https://leetcode.com/graphql';
    const profileQuery = {
      query: `
        query userProfile($username: String!) {
          matchedUser(username: $username) {
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `,
      variables: { username }
    };

    const profileResponse = await axios.post(url, profileQuery);
    const userData = profileResponse.data.data?.matchedUser || {};

    const submissions = [];
    const solvedProblems = userData.submitStats?.acSubmissionNum || [];
    solvedProblems.forEach(stat => {
      submissions.push({
        problem_name: `LeetCode Problem (${stat.difficulty})`,
        difficulty: stat.difficulty,
        status: 'Accepted',
        submission_time: new Date()
      });
    });

    const result = { submissions, stats: userData };
    cache[cacheKey] = { data: result, timestamp: Date.now() };

    return result;
  } catch (error) {
    console.error(`Error fetching LeetCode data: ${error.message}`);
    return { submissions: [], stats: {} };
  }
}

module.exports = {
  fetchCodeforcesData,
  fetchLeetcodeData,
  fetchCodechefData,
  fetchGeeksforgeeksData
};
