import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function EvidenceLedger({ evidence, selectedEvidenceId, onRefresh }) {
  const [selectedId, setSelectedId] = useState(selectedEvidenceId || null);
  const [verification, setVerification] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const selected = evidence.find(e => e.id === selectedId);

  useEffect(() => { if (selectedEvidenceId) setSelectedId(selectedEvidenceId); }, [selectedEvidenceId]);
  useEffect(() => { setVerification(null); }, [selectedId]);

  async function verify(){
    if(!selected) return;
    setVerifying(true);
    try { setVerification(await api.verifyEvidence(selected.id)); }
    finally { setVerifying(false); }
  }

  async function exportReport(){
    const data = await api.report();
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `SentinelNet_Threat_Report_${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  return <>
    <div className="page-head">
      <div><div className="eyebrow">CHAIN OF CUSTODY</div><h1>Immutable Evidence Ledger</h1><p>Hash suspicious content and verify that the stored record has not been altered.</p></div>
      <button className="btn primary" onClick={exportReport}>Export Threat Report</button>
    </div>
    <div className="evidence-layout">
      <section className="panel evidence-table-panel">
        <div className="panel-head"><div><div className="eyebrow">AUDIT RECORDS</div><h2>Threat Intelligence Evidence</h2></div><span className="mini-tag">SHA-256</span></div>
        <div className="evidence-table">
          {evidence.map(r => <div key={r.id} className={`evidence-row ${selectedId===r.id?'selected':''}`} onClick={()=>setSelectedId(r.id)}>
            <div className="evidence-id">{r.id}</div><div className="evidence-preview"><strong>{r.title}</strong><code>{r.hash.slice(0,24)}…</code></div><div className="evidence-time">{r.timestamp}</div><div className="verified-badge">IMMUTABLE</div>
          </div>)}
        </div>
      </section>
      <section className="panel verify-panel">
        <div className="eyebrow">VERIFY EVIDENCE</div><h2>{selected?.title || 'Select a record'}</h2>
        <p className="muted">{selected ? `Record ${selected.id} can be recomputed from the stored evidence payload.` : 'Choose an evidence record to recompute its SHA-256 fingerprint.'}</p>
        <div className="hash-box"><label>Stored hash</label><code>{selected?.hash || '—'}</code></div>
        <div className="hash-box"><label>Recomputed hash</label><code>{verification?.recomputedHash || '—'}</code></div>
        <button className="btn primary full" onClick={verify} disabled={!selected || verifying}>{verifying ? 'Verifying…' : 'Verify Evidence'}</button>
        <div className={`verification-result ${verification ? (verification.valid?'success':'fail'):'neutral'}`}>{verification ? (verification.valid ? '✓ Hash match — evidence integrity verified' : '✕ Hash mismatch — possible tampering') : 'Waiting for verification'}</div>
        <div className="ledger-note"><strong>Prototype note</strong><span>This demo uses a local simulated permissioned ledger workflow. A production build would write evidence hashes through a Hyperledger Fabric gateway.</span></div>
      </section>
    </div>
  </>;
}
