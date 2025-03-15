
const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true
  },
  problem_id: {
    type: String,
    required: true
  },
  problem_name: {
    type: String
  },
  difficulty: {
    type: String
  },
  status: {
    type: String
  },
  language: {
    type: String
  },
  submission_time: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
