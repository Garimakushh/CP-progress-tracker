# CP Progress Tracker

A web application to track your progress across multiple competitive programming platforms.

## Features

- Track submissions from Codeforces and LeetCode
- Visualize problem-solving patterns and rating history
- Monitor progress across difficulty levels
- View recent submissions across platforms

## Tech Stack

- Node.js and Express
- MongoDB with Mongoose
- EJS templating
- Chart.js for visualizations
- Bootstrap 5 for responsive UI

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your configuration
4. Start the application: `npm start`

## Environment Variables

Create a `.env` file with the following:

```
PORT=5000
SESSION_SECRET=your_session_secret_key_here
MONGODB_URI=mongodb://localhost:27017/cp-tracker
```

## Platforms Supported

- Codeforces
- LeetCode
- CodeChef (coming soon)
- GeeksforGeeks (coming soon)

## License

This project is licensed under the MIT License.
