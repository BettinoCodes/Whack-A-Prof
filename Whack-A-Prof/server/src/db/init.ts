import dotenv from 'dotenv';
// Load environment variables before importing config
dotenv.config();

import pool from './config';

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS high_scores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL DEFAULT 'Anonymous',
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create index for faster sorting by score
  CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
`;

async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');
    await pool.query(createTableQuery);
    console.log('Database initialized successfully!');
    console.log('Table "high_scores" is ready.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
initializeDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

