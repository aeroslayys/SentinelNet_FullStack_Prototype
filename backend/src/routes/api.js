import { Router } from 'express';
import { validatePostQuery } from '../middleware/validateQuery.js';
import {
  listPosts, getSummary, getAlerts, getNetwork,
  getEvidenceRecords, verifyEvidence, injectDemoEvent, buildReport
} from '../services/intelligenceService.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sentinelnet-api', timestamp: new Date().toISOString() });
});

apiRouter.get('/posts', validatePostQuery, (req, res) => {
  res.json({ items: listPosts(req.query) });
});

apiRouter.get('/summary', (_req, res) => res.json(getSummary()));
apiRouter.get('/alerts', (_req, res) => res.json({ items: getAlerts() }));
apiRouter.get('/network', (_req, res) => res.json(getNetwork()));
apiRouter.get('/evidence', (_req, res) => res.json({ items: getEvidenceRecords() }));

apiRouter.post('/analyze', (_req, res) => {
  res.json({
    status: 'complete',
    analyzedAt: new Date().toISOString(),
    summary: getSummary(),
    alerts: getAlerts()
  });
});

apiRouter.post('/demo-event', (_req, res) => {
  const result = injectDemoEvent();
  res.status(result.created ? 201 : 200).json(result);
});

apiRouter.post('/evidence/:id/verify', (req, res) => {
  const result = verifyEvidence(req.params.id);
  if (!result) return res.status(404).json({ error: 'Evidence record not found' });
  res.json(result);
});

apiRouter.get('/report', (_req, res) => res.json(buildReport()));
