import { Router, Request, Response } from 'express';
import pool from '../db/config';

const router = Router();

interface HighScore {
  id: number;
  name: string;
  score: number;
  created_at: Date;
}

interface SaveScoreBody {
  name?: string;
  score: number;
}

const MAX_HIGH_SCORES = 10;

/**
 * GET /api/scores
 * Retrieves the top high scores from the database
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<HighScore>(
      'SELECT id, name, score, created_at FROM high_scores ORDER BY score DESC LIMIT $1',
      [MAX_HIGH_SCORES]
    );
    
    res.json({
      success: true,
      scores: result.rows.map(row => ({
        name: row.name,
        score: row.score
      }))
    });
  } catch (error) {
    console.error('Error fetching high scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch high scores'
    });
  }
});

/**
 * POST /api/scores
 * Saves a new high score to the database
 */
router.post('/', async (req: Request<object, object, SaveScoreBody>, res: Response): Promise<void> => {
  try {
    const { name = 'Anonymous', score } = req.body;

    // Validate score
    if (typeof score !== 'number' || isNaN(score) || score <= 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid score. Score must be a positive number.'
      });
      return;
    }

    // Validate name
    const sanitizedName = String(name).trim().slice(0, 50) || 'Anonymous';

    // Insert the new score
    const result = await pool.query<HighScore>(
      'INSERT INTO high_scores (name, score) VALUES ($1, $2) RETURNING id, name, score, created_at',
      [sanitizedName, score]
    );

    console.log('High score saved:', result.rows[0]);

    res.status(201).json({
      success: true,
      score: {
        name: result.rows[0].name,
        score: result.rows[0].score
      }
    });
  } catch (error) {
    console.error('Error saving high score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save high score'
    });
  }
});

/**
 * DELETE /api/scores
 * Clears all high scores (for testing/admin purposes)
 */
router.delete('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM high_scores');
    res.json({
      success: true,
      message: 'All high scores cleared'
    });
  } catch (error) {
    console.error('Error clearing high scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear high scores'
    });
  }
});

export default router;

