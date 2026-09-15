export default function Narratives({ narratives=[] }) {
  return <section className="panel narrative-panel">
    <div className="panel-head"><div><div className="eyebrow">NARRATIVE SIGNALS</div><h2>Escalation Velocity</h2></div><span className="mini-tag">12-language pipeline</span></div>
    <div className="narrative-bars">
      {narratives.slice(0,5).map(n => <div className="narrative-row" key={n.name}>
        <label>{n.name}</label><div className="bar-track"><span style={{width:`${n.score}%`}}/></div><strong>{n.score}</strong>
      </div>)}
    </div>
  </section>;
}
