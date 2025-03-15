/**
 * API utilities for the CP Progress Tracker
 */

/**
 * Fetches user stats from the backend API
 * @returns {Promise<Object>} Promise resolving to user stats data
 */
async function fetchUserStats() {
  try {
    const response = await fetch('/api/user_stats');
    if (!response.ok) throw new Error('Failed to fetch user stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null; // Return null if fetching fails to prevent crashes
  }
}

/**
 * Fetches recent submissions from the backend API
 * @returns {Promise<Array>} Promise resolving to an array of recent submissions
 */
async function fetchRecentSubmissions() {
  try {
    const response = await fetch('/api/recent_submissions');
    if (!response.ok) throw new Error('Failed to fetch recent submissions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent submissions:', error);
    return []; // Return an empty array to prevent breaking UI loops
  }
}

/**
 * Triggers a data refresh from competitive programming platforms
 * @returns {Promise<Object>} Promise resolving to refresh status
 */
async function refreshUserData() {
  try {
    const response = await fetch('/api/refresh_data', { method: 'POST' }); // Use POST for triggering actions
    if (!response.ok) throw new Error('Failed to refresh data');
    return await response.json();
  } catch (error) {
    console.error('Error refreshing user data:', error);
    return { success: false, error: error.message };
  }
}
