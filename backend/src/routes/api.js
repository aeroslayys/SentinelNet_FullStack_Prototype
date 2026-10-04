import { Router } from 'express';
import { validatePostQuery } from '../middleware/validateQuery.js';
import {
  listPosts, getSummary, getAlerts, getNetwork,
  getEvidenceRecords, verifyEvidence, injectDemoEvent, buildReport,
  analyzeAllPosts, getSystemStatus, createRawPost
} from '../services/intelligenceService.js';

export const apiRouter = Router();

apiRouter.get('/health', async (_req, res, next) => {
  try {
    res.json(await getSystemStatus());
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/posts', validatePostQuery, async (req, res, next) => {
  try {
    res.json({ items: await listPosts(req.query) });
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/posts', async (req, res, next) => {
  try {
    const result = await createRawPost(req.body);
    res.status(result.created ? 201 : 200).json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/summary', async (_req, res, next) => {
  try { res.json(await getSummary()); } catch (error) { next(error); }
});

apiRouter.get('/alerts', async (_req, res, next) => {
  try { res.json({ items: await getAlerts() }); } catch (error) { next(error); }
});

apiRouter.get('/network', (_req, res) => res.json(getNetwork()));

apiRouter.get('/evidence', async (_req, res, next) => {
  try { res.json({ items: await getEvidenceRecords() }); } catch (error) { next(error); }
});

apiRouter.post('/analyze', async (_req, res, next) => {
  try {
    const result = await analyzeAllPosts();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/demo-event', async (_req, res, next) => {
  try {
    const result = await injectDemoEvent();
    res.status(result.created ? 201 : 200).json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/evidence/:id/verify', async (req, res, next) => {
  try {
    const result = await verifyEvidence(req.params.id);
    if (!result) return res.status(404).json({ error: 'Evidence record not found' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/report', async (_req, res, next) => {
  try { res.json(await buildReport()); } catch (error) { next(error); }
});
