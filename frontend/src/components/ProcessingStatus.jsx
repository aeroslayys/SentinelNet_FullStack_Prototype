export default function ProcessingStatus(){
  const rows = [['IndicBERT sentiment','READY'],['Code-mixed language parser','READY'],['Graph bot classifier','READY'],['Evidence audit ledger','READY'],['Streaming ingestion','SIMULATED']];
  return <section className="panel status-panel">
    <div className="panel-head"><div><div className="eyebrow">MODEL STATUS</div><h2>Processing Stack</h2></div></div>
    <div className="status-list">{rows.map(([a,b]) => <div className="status-row" key={a}><span>{a}</span><b className={b==='SIMULATED'?'sim':''}>{b}</b></div>)}</div>
  </section>;
}
