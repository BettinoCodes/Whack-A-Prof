import dotenv from 'dotenv';
// Load environment variables FIRST before other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import scoresRouter from './routes/scores';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the parent directory (game files)
app.use(express.static(path.join(__dirname, '../../')));

// Serve assets folder from the project root (one level above Whack-A-Prof folder)
// This handles paths like ../assets/Animation/... in the HTML/CSS/JS
app.use('/assets', express.static(path.join(__dirname, '../../../assets')));

// API Routes
app.use('/api/scores', scoresRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the game HTML for the root route
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../game.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🎮 Whack-A-Prof server running at http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  /api/scores  - Get high scores`);
  console.log(`   POST /api/scores  - Save a high score`);
  console.log(`   GET  /api/health  - Health check`);
});

