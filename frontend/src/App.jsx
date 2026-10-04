import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Metrics from './components/Metrics';
import SocialFeed from './components/SocialFeed';
import Alerts from './components/Alerts';
import Narratives from './components/Narratives';
import ProcessingStatus from './components/ProcessingStatus';
import NetworkGraph from './components/NetworkGraph';
import EvidenceLedger from './components/EvidenceLedger';
import { api } from './services/api';

export default function App(){
  const [view,setView] = useState('dashboard');
  const [summary,setSummary] = useState(null);
  const [posts,setPosts] = useState([]);
  const [alerts,setAlerts] = useState([]);
  const [network,setNetwork] = useState({nodes:[],edges:[]});
  const [evidence,setEvidence] = useState([]);
  const [query,setQuery] = useState('');
  const [risk,setRisk] = useState('all');
  const [busy,setBusy] = useState(false);
  const [online,setOnline] = useState(false);
  const [systemStatus,setSystemStatus] = useState(null);
  const [lastAnalysis,setLastAnalysis] = useState('not run');
  const [selectedEvidenceId,setSelectedEvidenceId] = useState(null);
  const [toast,setToast] = useState('');
  const [error,setError] = useState('');

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(()=>setToast(''),2400);
  };

  const loadCore = useCallback(async () => {
    try {
      setError('');
      const [health, summaryData, alertData, networkData, evidenceData] = await Promise.all([
        api.health(), api.summary(), api.alerts(), api.network(), api.evidence()
      ]);
      setOnline(health.status === 'ok');
      setSystemStatus(health);
      setSummary(summaryData);
      setAlerts(alertData.items);
      setNetwork(networkData);
      setEvidence(evidenceData.items);
    } catch (e) {
      setOnline(false);
      setError(e.message);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const data = await api.posts(query,risk);
      setPosts(data.items);
    } catch (e) { setError(e.message); }
  }, [query,risk]);

  useEffect(()=>{ loadCore(); },[loadCore]);
  useEffect(()=>{ const id=setTimeout(loadPosts,120); return()=>clearTimeout(id); },[loadPosts]);

  async function analyze(){
    setBusy(true);
    try{
      const data=await api.analyze();
      setSummary(data.summary); setAlerts(data.alerts);
      setLastAnalysis(new Date(data.analyzedAt).toLocaleTimeString());
      await Promise.all([loadPosts(), loadCore()]);
      notify('Analysis complete: coordinated cluster C-RED prioritized.');
    } catch(e){ setError(e.message); }
    finally{ setBusy(false); }
  }

  async function inject(){
    setBusy(true);
    try{
      const result=await api.injectDemoEvent();
      await Promise.all([loadPosts(),loadCore()]);
      notify(result.created ? 'New 96-risk coordinated event injected.' : 'Demo event already exists.');
    }catch(e){setError(e.message);} finally{setBusy(false);}
  }

  function openEvidence(post){
    const record=evidence.find(e=>e.postId===post.id);
    if(record){ setSelectedEvidenceId(record.id); setView('evidence'); notify(`${record.id} opened in Evidence Ledger`); }
  }

  return <div className="app-root">
    <div className="scanline"/>
    <Header onAnalyze={analyze} onInject={inject} busy={busy} online={online}/>
    <div className="app-shell">
      <Sidebar view={view} onChange={setView}/>
      <main className="main">
        {error && <div className="error-banner"><strong>Backend unavailable:</strong> {error}. Start the API with <code>npm run dev</code> from the project root.</div>}

        {view==='dashboard' && <section className="view active">
          <div className="page-head">
            <div><div className="eyebrow">LIVE INTELLIGENCE OVERVIEW</div><h1>Threat Operations Dashboard</h1><p>Multilingual sentiment, coordinated-behavior detection and cryptographic evidence integrity.</p></div>
            <div className="last-analysis">Last analysis: {lastAnalysis}</div>
          </div>
          <Metrics summary={summary}/>
          <div className="dashboard-grid">
            <SocialFeed posts={posts} query={query} risk={risk} onQuery={setQuery} onRisk={setRisk} onOpenEvidence={openEvidence}/>
            <Alerts alerts={alerts}/>
          </div>
          <div className="dashboard-grid lower"><Narratives narratives={summary?.narratives}/><ProcessingStatus systemStatus={systemStatus} summary={summary}/></div>
        </section>}

        {view==='network' && <section className="view active">
          <div className="page-head">
            <div><div className="eyebrow">GRAPH INTELLIGENCE</div><h1>Coordinated Network Detection</h1><p>Inspect high-centrality accounts, synchronized behavior and suspicious communities.</p></div>
            <div className="legend"><span><i className="dot human"/>Human-like</span><span><i className="dot bot"/>Suspected bot</span><span><i className="dot hub"/>High-centrality hub</span></div>
          </div>
          <NetworkGraph network={network}/>
        </section>}

        {view==='evidence' && <section className="view active">
          <EvidenceLedger evidence={evidence} selectedEvidenceId={selectedEvidenceId} onRefresh={loadCore}/>
        </section>}
      </main>
    </div>
    {toast && <div className="toast show">{toast}</div>}
  </div>;
}
