
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  codeforces_handle: {
    type: String,
    default: ''
  },
  leetcode_username: {
    type: String,
    default: ''
  },
  codechef_username: {
    type: String,
    default: ''
  },
  geeksforgeeks_username: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  last_refresh: {
    type: Date
  }
});

// Method to get active platforms
UserSchema.methods.getActivePlatforms = function() {
  const platforms = [];
  if (this.codeforces_handle) platforms.push('codeforces');
  if (this.leetcode_username) platforms.push('leetcode');
  if (this.codechef_username) platforms.push('codechef');
  if (this.geeksforgeeks_username) platforms.push('geeksforgeeks');
  return platforms;
};

// Method to compare passwords
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
