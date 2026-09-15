import { posts, nodes, edges } from '../data/store.js';
import { sha256 } from '../utils/hash.js';

export function listPosts({ q = '', risk = 'all' } = {}) {
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

export function getSummary() {
  const highRiskPosts = posts.filter((p) => p.risk >= 75).length;
  const suspectedBots = nodes.filter((n) => n.bot >= 0.8).length;
  const suspiciousClusters = [...new Set(nodes.filter((n) => n.bot >= 0.8).map((n) => n.cluster))];
  const averageRisk = Math.round(posts.reduce((sum, p) => sum + p.risk, 0) / Math.max(posts.length, 1));

  const narratives = Object.values(posts.reduce((acc, post) => {
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
    narratives
  };
}

export function getAlerts() {
  return [...posts]
    .filter((p) => p.risk >= 60)
    .sort((a, b) => b.risk - a.risk)
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
  return `${post.id}|${post.handle}|${post.text}|${post.timestamp}|${post.category}|${post.risk}`;
}

export function getEvidenceRecords() {
  return posts.filter((p) => p.evidence).map((p) => {
    const payload = evidencePayload(p);
    return {
      id: `EV-${p.id.slice(2)}`,
      postId: p.id,
      title: `${p.handle} · ${p.category}`,
      timestamp: p.timestamp,
      algorithm: 'SHA-256',
      hash: sha256(payload),
      ledger: 'Hyperledger Fabric (simulated permissioned audit trail)',
      status: 'IMMUTABLE'
    };
  });
}

export function verifyEvidence(id) {
  const record = getEvidenceRecords().find((r) => r.id === id);
  if (!record) return null;
  const post = posts.find((p) => p.id === record.postId);
  const recomputedHash = sha256(evidencePayload(post));
  return { ...record, recomputedHash, valid: recomputedHash === record.hash };
}

export function injectDemoEvent() {
  const existing = posts.find((p) => p.id === 'P-1029');
  if (existing) return { created: false, post: existing };

  const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' });
  const post = {
    id: 'P-1029', handle: '@metro_signal_x',
    text: 'Forward now: emergency curfew begins at 18:00. Official notice will follow. #Alert',
    language: 'EN', sentiment: 'Alarm', risk: 96, category: 'Coordinated', timestamp,
    cluster: 'C-RED', evidence: true, narrative: 'Emergency curfew rumor'
  };
  posts.unshift(post);
  return { created: true, post };
}

export function buildReport() {
  return {
    product: 'SentinelNet Prototype',
    generatedAt: new Date().toISOString(),
    disclaimer: 'Synthetic hackathon demo data. No live social-media collection is performed.',
    summary: getSummary(),
    priorityPosts: posts.filter((p) => p.risk >= 60),
    evidence: getEvidenceRecords()
  };
}
