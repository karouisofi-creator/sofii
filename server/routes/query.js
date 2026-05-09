import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// POST /api/query - Execute a parameterized SQL query
router.post('/', async (req, res) => {
  const { sql, params, page = 1, pageSize = 50 } = req.body;
  if (!sql) {
    return res.status(400).json({ error: 'SQL query is required' });
  }
  try {
    // Add pagination if requested
    let paginatedSql = sql;
    if (page && pageSize) {
      paginatedSql = `${sql} OFFSET ${(page - 1) * pageSize} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
    }
    const result = await query(paginatedSql, params || {});
    res.json({
      rows: result.recordset,
      total: result.rowsAffected ? result.rowsAffected[0] : undefined,
      page,
      pageSize
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
