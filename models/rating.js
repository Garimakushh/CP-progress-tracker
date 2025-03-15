
const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true
  },
  rating: {
    type: Number
  },
  contest_id: {
    type: String
  },
  contest_name: {
    type: String
  },
  rating_time: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Rating', RatingSchema);
