const validRisk = new Set(['all', 'high', 'medium', 'low']);

export function validatePostQuery(req, res, next) {
  if (req.query.risk && !validRisk.has(req.query.risk)) {
    return res.status(400).json({ error: 'risk must be one of: all, high, medium, low' });
  }
  if (req.query.q && String(req.query.q).length > 100) {
    return res.status(400).json({ error: 'q must be 100 characters or fewer' });
  }
  next();
}
