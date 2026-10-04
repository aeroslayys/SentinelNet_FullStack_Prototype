function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export function graphSignalForNode(node) {
  if (!node) return 0;
  const bot = clamp01(node.bot);
  const synchronizedActivity = clamp01((Number(node.synced) || 0) / 25);
  return clamp01((bot * 0.65) + (synchronizedActivity * 0.35));
}

export function calculateRisk(nlpResult, graphSignal = 0) {
  const sentimentLabel = String(nlpResult?.sentiment?.label || 'neutral').toLowerCase();
  const sentimentConfidence = clamp01(nlpResult?.sentiment?.score);
  const negativeSentiment = sentimentLabel === 'negative'
    ? sentimentConfidence
    : sentimentLabel === 'neutral'
      ? 0.2 * sentimentConfidence
      : 0.05;

  const urgency = clamp01(nlpResult?.urgency);
  const manipulation = clamp01(nlpResult?.manipulation);
  const claimSignal = clamp01(nlpResult?.claimSignal);
  const graph = clamp01(graphSignal);

  const weighted =
    (negativeSentiment * 0.20) +
    (urgency * 0.20) +
    (manipulation * 0.15) +
    (claimSignal * 0.15) +
    (graph * 0.30);

  const risk = Math.round(clamp01(weighted) * 100);

  return {
    risk,
    components: {
      negativeSentiment: Math.round(negativeSentiment * 100),
      urgency: Math.round(urgency * 100),
      manipulation: Math.round(manipulation * 100),
      claimSignal: Math.round(claimSignal * 100),
      graphSignal: Math.round(graph * 100)
    }
  };
}

export function classifyCategory(nlpResult, graphSignal, risk) {
  const urgency = clamp01(nlpResult?.urgency);
  const manipulation = clamp01(nlpResult?.manipulation);
  const claimSignal = clamp01(nlpResult?.claimSignal);

  if (graphSignal >= 0.75 && risk >= 60) return 'Coordinated Risk';
  if (claimSignal >= 0.70 && manipulation >= 0.50) return 'Potential Misinformation';
  if (urgency >= 0.75) return 'High-Urgency Narrative';
  if (risk >= 45) return 'Needs Review';
  return 'Low-Risk Discussion';
}
