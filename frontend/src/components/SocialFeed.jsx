function riskClass(score){ return score >= 75 ? 'high' : score >= 45 ? 'medium' : 'low'; }

export default function SocialFeed({ posts, query, risk, onQuery, onRisk, onOpenEvidence }) {
  return (
    <section className="panel feed-panel">
      <div className="panel-head">
        <div><div className="eyebrow">SOCIAL INTELLIGENCE FEED</div><h2>Detected Posts & Narratives</h2></div>
        <div className="filters">
          <input value={query} onChange={e=>onQuery(e.target.value)} type="search" placeholder="Search post, handle, tag..."/>
          <select value={risk} onChange={e=>onRisk(e.target.value)}>
            <option value="all">All risk</option><option value="high">High (75+)</option><option value="medium">Medium (45–74)</option><option value="low">Low (&lt;45)</option>
          </select>
        </div>
      </div>
      <div className="feed-list">
        {posts.map(p => {
          const analyzed = p.analysisStatus === 'complete';
          return (
            <article key={p.id} className="feed-item" onClick={()=>p.evidence && onOpenEvidence(p)}>
              <div>
                <div className="feed-top"><span className="handle">{p.handle}</span><span className="lang">{p.language}</span><span className="category">{p.category}</span></div>
                <div className="feed-text">{p.text}</div>
                <div className="feed-meta">{p.id} · {p.timestamp} · {p.sentiment} · {p.narrative}</div>
              </div>
              <div className={`risk-score ${analyzed ? riskClass(p.risk) : ''}`}>{analyzed ? p.risk : '—'}</div>
            </article>
          );
        })}
        {!posts.length && <div className="muted">No posts match this filter.</div>}
      </div>
    </section>
  );
}
