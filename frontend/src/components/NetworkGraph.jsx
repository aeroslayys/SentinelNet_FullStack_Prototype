import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function NetworkGraph({ network }) {
  const svgRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const nodes = network?.nodes || [];
  const edges = network?.edges || [];
  const selectedNode = useMemo(() => nodes.find(n => n.id === selected), [nodes, selected]);

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;
    const width = 900, height = 560;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const localNodes = nodes.map(n => ({...n}));
    const links = edges.map(e => ({...e}));
    const simulation = d3.forceSimulation(localNodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.suspicious ? 80 : 125).strength(.65))
      .force('charge', d3.forceManyBody().strength(-320))
      .force('center', d3.forceCenter(width/2, height/2))
      .force('collide', d3.forceCollide().radius(42));

    const link = svg.append('g').selectAll('line').data(links).join('line')
      .attr('class', d => `graph-edge ${d.suspicious ? 'suspicious':''}`);

    const node = svg.append('g').selectAll('g').data(localNodes).join('g')
      .attr('class', d => `graph-node ${d.type} ${d.id === selected ? 'selected':''}`)
      .on('click', (_, d) => setSelected(d.id))
      .call(d3.drag()
        .on('start', (event,d) => { if (!event.active) simulation.alphaTarget(.3).restart(); d.fx=d.x; d.fy=d.y; })
        .on('drag', (event,d) => { d.fx=event.x; d.fy=event.y; })
        .on('end', (event,d) => { if (!event.active) simulation.alphaTarget(0); d.fx=null; d.fy=null; }));

    node.append('circle').attr('r', d => d.type === 'hub' ? 17 : d.type === 'bot' ? 13 : 11);
    node.filter(d=>d.type==='hub').append('circle').attr('r',24).attr('fill','none').attr('stroke','rgba(139,123,255,.18)').attr('stroke-width',1);
    node.append('text').attr('y', d => (d.type === 'hub' ? 17 : d.type === 'bot' ? 13 : 11) + 18).text(d=>d.label);

    simulation.on('tick', () => {
      link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
      node.attr('transform', d => `translate(${Math.max(35,Math.min(width-35,d.x))},${Math.max(35,Math.min(height-35,d.y))})`);
    });
    return () => simulation.stop();
  }, [network, selected]);

  return <div className="network-layout">
    <section className="panel graph-panel">
      <div className="panel-head"><div><div className="eyebrow">INTERACTION GRAPH</div><h2>Retweet / Mention / Similarity Network</h2></div><button className="btn tiny" onClick={()=>setSelected(null)}>Reset Selection</button></div>
      <svg ref={svgRef} id="networkGraph" viewBox="0 0 900 560"/>
    </section>
    <aside className="panel inspector-panel">
      <div className="eyebrow">NODE INSPECTOR</div>
      <h2>{selectedNode?.label || 'Select an account'}</h2>
      <p className="muted">{selectedNode ? (selectedNode.bot >= .8 ? 'Strong automation/coordinated-behavior signal. Prioritize for campaign-level review.' : selectedNode.type === 'hub' ? 'High network centrality. Influential account with a low automation probability.' : 'Account currently exhibits mostly human-like behavior.') : 'Click any node to inspect bot score, centrality, cluster and coordinated activity.'}</p>
      <div className="inspector-grid">
        <div><span>Bot score</span><strong>{selectedNode ? `${Math.round(selectedNode.bot*100)}%` : '—'}</strong></div>
        <div><span>Centrality</span><strong>{selectedNode?.centrality?.toFixed(2) || '—'}</strong></div>
        <div><span>Cluster</span><strong>{selectedNode?.cluster || '—'}</strong></div>
        <div><span>Synced posts</span><strong>{selectedNode?.synced ?? '—'}</strong></div>
      </div>
      <div className="panel-separator"/>
      <div className="eyebrow">CLUSTER SUMMARY</div>
      <div className="cluster-list">
        <Cluster id="C-RED" risk="HIGH" text="Coordinated amplification · 6 accounts"/>
        <Cluster id="C-BLUE" risk="MEDIUM" text="Local discussion cluster · 3 accounts"/>
        <Cluster id="C-GREEN" risk="LOW" text="Verification / counter-signal · 3 accounts"/>
      </div>
    </aside>
  </div>;
}

function Cluster({id,risk,text}){ return <div className="cluster-item"><strong>{id} · {risk}</strong><span>{text}</span></div>; }
