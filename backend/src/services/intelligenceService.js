import { nodes, edges } from '../data/networkStore.js';
import {
  getAllPosts, findPostById, saveAnalysis, insertPost, toClientPost
} from '../repositories/postRepository.js';
import { analyzeBatch, getMlHealth } from './mlClient.js';
import { calculateRisk, classifyCategory, graphSignalForNode } from './riskService.js';
import { sha256 } from '../utils/hash.js';

function sortByRisk(items) {
  return [...items].sort((a, b) => b.risk - a.risk);
}

function nodeForHandle(handle) {
  return nodes.find((node) => node.label === handle);
}

export async function listPosts({ q = '', risk = 'all' } = {}) {
  const posts = (await getAllPosts()).map(toClientPost);
  const query = String(q).trim().toLowerCase();

  return posts.filter((post) => {
    const text = [post.handle, post.text, post.category, post.language, post.narrative].join(' ').toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const matchesRisk = risk === 'all'
      || (risk === 'high' && post.risk >= 75)
      || (risk === 'medium' && post.risk >= 45 && post.risk < 75)
      || (risk === 'low' && post.risk < 45);
    return matchesQuery && matchesRisk;
  });
}

export async function getSummary() {
  const posts = (await getAllPosts()).map(toClientPost);
  const analyzed = posts.filter((post) => post.analysisStatus === 'complete');
  const highRiskPosts = analyzed.filter((p) => p.risk >= 75).length;
  const suspectedBots = nodes.filter((n) => n.bot >= 0.8).length;
  const suspiciousClusters = [...new Set(nodes.filter((n) => n.bot >= 0.8).map((n) => n.cluster))];
  const averageRisk = analyzed.length
    ? Math.round(analyzed.reduce((sum, p) => sum + p.risk, 0) / analyzed.length)
    : 0;

  const narratives = Object.values(analyzed.reduce((acc, post) => {
    acc[post.narrative] ??= { name: post.narrative, count: 0, riskTotal: 0 };
    acc[post.narrative].count += 1;
    acc[post.narrative].riskTotal += post.risk;
    return acc;
  }, {})).map((item) => ({
    name: item.name,
    count: item.count,
    score: Math.min(100, Math.round((item.riskTotal / item.count) * (1 + (item.count - 1) * 0.09)))
  })).sort((a, b) => b.score - a.score);

  return {
    highRiskPosts,
    suspectedBots,
    suspiciousClusters: suspiciousClusters.length,
    suspiciousClusterIds: suspiciousClusters,
    averageRisk,
    analyzedPosts: analyzed.length,
    totalPosts: posts.length,
    narratives
  };
}

export async function getAlerts() {
  const posts = (await getAllPosts()).map(toClientPost);
  return sortByRisk(posts.filter((p) => p.analysisStatus === 'complete' && p.risk >= 60))
    .slice(0, 6)
    .map((p) => ({
      id: `A-${p.id.slice(2)}`,
      severity: p.risk >= 85 ? 'critical' : 'elevated',
      category: p.category,
      message: `${p.narrative} linked to ${p.handle} with risk score ${p.risk}/100.`,
      timestamp: p.timestamp,
      cluster: p.cluster
    }));
}

export function getNetwork() {
  return { nodes, edges };
}

export function evidencePayload(post) {
  const clientPost = toClientPost(post);
  return [
    clientPost.id,
    clientPost.handle,
    clientPost.text,
    clientPost.timestamp,
    clientPost.category,
    clientPost.risk
  ].join('|');
}

export async function getEvidenceRecords() {
  const posts = await getAllPosts();
  return posts
    .filter((p) => p.evidence && p.analysis)
    .map((p) => {
      const clientPost = toClientPost(p);
      const payload = evidencePayload(p);
      return {
        id: `EV-${clientPost.id.slice(2)}`,
        postId: clientPost.id,
        title: `${clientPost.handle} · ${clientPost.category}`,
        timestamp: clientPost.timestamp,
        algorithm: 'SHA-256',
        hash: sha256(payload),
        ledger: 'Local evidence registry (Fabric integration planned)',
        status: 'HASHED'
      };
    });
}

export async function verifyEvidence(id) {
  const record = (await getEvidenceRecords()).find((r) => r.id === id);
  if (!record) return null;

  const post = await findPostById(record.postId);
  const recomputedHash = sha256(evidencePayload(post));
  return {
    ...record,
    recomputedHash,
    valid: recomputedHash === record.hash,
    verificationStatus: recomputedHash === record.hash ? 'VERIFIED' : 'TAMPER_WARNING'
  };
}

export async function analyzeAllPosts() {
  const rawPosts = await getAllPosts();
  if (!rawPosts.length) {
    return {
      status: 'complete',
      analyzedAt: new Date().toISOString(),
      analyzedCount: 0,
      summary: await getSummary(),
      alerts: []
    };
  }

  const nlp = await analyzeBatch(rawPosts);
  const byId = new Map(nlp.items.map((item) => [item.id, item]));

  for (const post of rawPosts) {
    const nlpResult = byId.get(post.id);
    if (!nlpResult) continue;

    const graphSignal = graphSignalForNode(nodeForHandle(post.handle));
    const riskResult = calculateRisk(nlpResult, graphSignal);
    const category = classifyCategory(nlpResult, graphSignal, riskResult.risk);

    await saveAnalysis(post.id, {
      ...nlpResult,
      category,
      risk: riskResult.risk,
      riskBreakdown: riskResult.components,
      graphSignal: Math.round(graphSignal * 100),
      analyzedAt: new Date().toISOString()
    });
  }

  const analyzedAt = new Date().toISOString();
  return {
    status: 'complete',
    analyzedAt,
    analyzedCount: rawPosts.length,
    engine: nlp.engine,
    summary: await getSummary(),
    alerts: await getAlerts()
  };
}

export async function injectDemoEvent() {
  const timestamp = new Date().toLocaleTimeString('en-GB', {
    hour12: false,
    timeZone: 'Asia/Kolkata'
  });

  const result = await insertPost({
    id: 'P-1029',
    handle: '@metro_signal_x',
    text: 'Forward now: emergency curfew begins at 18:00. Official notice will follow. #Alert',
    timestamp,
    cluster: 'C-RED',
    evidence: true,
    source: 'demo-event',
    order: 0
  });

  return { ...result, post: toClientPost(result.post) };
}

export async function createRawPost(input = {}) {
  const text = String(input.text || '').trim();
  const handle = String(input.handle || '').trim();

  if (!text) {
    const error = new Error('Post text is required.');
    error.status = 400;
    throw error;
  }

  if (!handle) {
    const error = new Error('Post handle is required.');
    error.status = 400;
    throw error;
  }

  const suffix = Date.now().toString().slice(-8);
  const id = input.id ? String(input.id) : `P-${suffix}`;
  const timestamp = input.timestamp
    ? String(input.timestamp)
    : new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' });

  const result = await insertPost({
    id,
    handle,
    text,
    timestamp,
    cluster: input.cluster ? String(input.cluster) : null,
    evidence: Boolean(input.evidence),
    source: input.source ? String(input.source) : 'manual-ingestion',
    order: Number.isFinite(input.order) ? input.order : 0
  });

  return { ...result, post: toClientPost(result.post) };
}

export async function buildReport() {
  const posts = (await getAllPosts()).map(toClientPost);
  return {
    product: 'SentinelNet',
    generatedAt: new Date().toISOString(),
    disclaimer: 'Current development feed uses synthetic demo data. Live social-media collection is not enabled.',
    summary: await getSummary(),
    priorityPosts: posts.filter((p) => p.analysisStatus === 'complete' && p.risk >= 60),
    evidence: await getEvidenceRecords()
  };
}

export async function getSystemStatus() {
  const ml = await getMlHealth();
  return {
    status: 'ok',
    service: 'sentinelnet-api',
    dataSource: String(process.env.DATA_SOURCE || 'memory').toLowerCase(),
    nlp: ml,
    timestamp: new Date().toISOString()
  };
}
