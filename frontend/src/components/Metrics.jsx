export default function Metrics({ summary }) {
  const s = summary || { highRiskPosts:0, suspectedBots:0, suspiciousClusters:0, averageRisk:0 };
  return (
    <div className="metric-grid">
      <Metric title="High-Risk Posts" value={s.highRiskPosts} tag="▲ critical" foot="Risk score ≥ 75" tone="danger"/>
      <Metric title="Suspected Bots" value={s.suspectedBots} tag="CIB" foot="Behavioral similarity model" tone="warn"/>
      <Metric title="Suspicious Clusters" value={s.suspiciousClusters} tag="graph" foot="Community-level detection"/>
      <article className="metric-card">
        <div className="metric-label">Average Risk</div>
        <div className="metric-row"><strong>{s.averageRisk}</strong><span className="metric-trend danger">/100</span></div>
        <div className="risk-track"><span style={{width:`${s.averageRisk}%`}}/></div>
      </article>
    </div>
  );
}

function Metric({ title, value, tag, foot, tone='' }) {
  return <article className="metric-card">
    <div className="metric-label">{title}</div>
    <div className="metric-row"><strong>{value}</strong><span className={`metric-trend ${tone}`}>{tag}</span></div>
    <div className="metric-foot">{foot}</div>
  </article>;
}
