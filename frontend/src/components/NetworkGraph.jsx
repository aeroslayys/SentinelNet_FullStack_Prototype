import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function NetworkGraph({ network }) {
  const svgRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const nodes = network?.nodes || [];
  const edges = network?.edges || [];
  const selectedNode = useMemo(() => nodes.find(n => n.id === selected), [nodes, selected]);

  const clusters = useMemo(() => {
    const map = new Map();
    for (const node of nodes) {
      if (!node.cluster || node.cluster === 'C-SOLO') continue;
      const current = map.get(node.cluster) || { id: node.cluster, members: 0, bots: 0, maxBot: 0 };
      current.members += 1;
      if (node.bot >= .65) current.bots += 1;
      current.maxBot = Math.max(current.maxBot, node.bot || 0);
      map.set(node.cluster, current);
    }
    return [...map.values()].sort((a,b) => b.maxBot - a.maxBot);
  }, [nodes]);

  useEffect(() => {
    if (!svgRef.current) return;
    const width = 900, height = 560;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (!nodes.length) return;

    const localNodes = nodes.map(n => ({...n}));
    const links = edges.map(e => ({...e}));
    const simulation = d3.forceSimulation(localNodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.suspicious ? 72 : 105).strength(d => d.suspicious ? .9 : .55))
      .force('charge', d3.forceManyBody().strength(-170))
      .force('center', d3.forceCenter(width/2, height/2))
      .force('x', d3.forceX(width/2).strength(.055))
      .force('y', d3.forceY(height/2).strength(.075))
      .force('collide', d3.forceCollide().radius(34));

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
  }, [network, selected, nodes.length, edges.length]);

  return <div className="network-layout">
    <section className="panel graph-panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow">INTERACTION GRAPH</div>
          <h2>Runtime Content & Coordination Network</h2>
        </div>
        <button className="btn tiny" onClick={()=>setSelected(null)}>Reset Selection</button>
      </div>
      {!nodes.length && <div className="muted">Run analysis first. SentinelNet will build this graph from the analyzed posts instead of loading a fixed demo network.</div>}
      <div className="graph-stats">
        <span>{network?.stats?.accounts ?? nodes.length} accounts</span>
        <span>{network?.stats?.relationships ?? edges.length} relationships</span>
        <span>{network?.stats?.suspiciousRelationships ?? edges.filter(e=>e.suspicious).length} suspicious links</span>
      </div>
      <svg ref={svgRef} id="networkGraph" viewBox="0 0 900 560"/>
    </section>
    <aside className="panel inspector-panel">
      <div className="eyebrow">NODE INSPECTOR</div>
      <h2>{selectedNode?.label || 'Select an account'}</h2>
      <p className="muted">{selectedNode ? (selectedNode.bot >= .65 ? 'Strong coordination/automation signal derived from the current analyzed dataset.' : selectedNode.type === 'hub' ? 'High network centrality in the current analyzed dataset.' : 'Account currently exhibits mostly human-like behavior in this dataset.') : 'Click any node to inspect coordination score, centrality, cluster and synchronized relationships.'}</p>
      <div className="inspector-grid">
        <div><span>Bot / CIB score</span><strong>{selectedNode ? `${Math.round(selectedNode.bot*100)}%` : '—'}</strong></div>
        <div><span>Centrality</span><strong>{selectedNode?.centrality?.toFixed(2) || '—'}</strong></div>
        <div><span>Cluster</span><strong>{selectedNode?.cluster || '—'}</strong></div>
        <div><span>Synced links</span><strong>{selectedNode?.synced ?? '—'}</strong></div>
      </div>
      <div className="panel-separator"/>
      <div className="eyebrow">CLUSTER SUMMARY</div>
      <div className="cluster-list">
        {clusters.map(cluster => <Cluster key={cluster.id} {...cluster}/>)}
        {!clusters.length && <div className="muted">No coordinated multi-account cluster detected yet.</div>}
      </div>
    </aside>
  </div>;
}

function Cluster({id,members,bots,maxBot}){
  const risk = maxBot >= .75 ? 'HIGH' : maxBot >= .50 ? 'MEDIUM' : 'LOW';
  return <div className="cluster-item"><strong>{id} · {risk}</strong><span>{members} accounts · {bots} elevated coordination scores</span></div>;
}
