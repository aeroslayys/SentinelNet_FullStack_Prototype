export default function ProcessingStatus({ systemStatus, summary }){
  const engine = systemStatus?.nlp?.engine;
  const nlpReady = systemStatus?.nlp?.status === 'ok';
  const mode = engine?.mode || 'unavailable';
  const modelLabel = mode === 'transformer' ? 'ACTIVE' : mode === 'heuristic-fallback' ? 'FALLBACK' : 'OFFLINE';
  const rows = [
    ['NLP service', nlpReady ? 'READY' : 'OFFLINE'],
    ['Multilingual sentiment', modelLabel],
    ['Graph risk signals', 'READY'],
    ['Evidence SHA-256', 'READY'],
    ['Analyzed posts', `${summary?.analyzedPosts ?? 0}/${summary?.totalPosts ?? 0}`]
  ];

  return <section className="panel status-panel">
    <div className="panel-head"><div><div className="eyebrow">MODEL STATUS</div><h2>Processing Stack</h2></div></div>
    <div className="status-list">{rows.map(([a,b]) => <div className="status-row" key={a}><span>{a}</span><b className={['FALLBACK','OFFLINE'].includes(b)?'sim':''}>{b}</b></div>)}</div>
  </section>;
}
