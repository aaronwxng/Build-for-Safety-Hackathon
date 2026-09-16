import { useState } from 'react';
import { scenarios, type Scenario } from './data/scenarios';
import { useSimulation } from './engine/useSimulation';
import SafetyAlerts, { type SensorNotice } from './components/SafetyAlerts';
import FollowingDetail from './components/FollowingDetail';
import ScorePanel from './components/ScorePanel';
import type { AuditEntry } from './components/AuditLog';
import './App.css';

type View = 'alerts' | 'detail' | 'privacy';
export default function App() {
  const [scenario, setScenario] = useState<Scenario>(scenarios[0]);
  const [view, setView] = useState<View>('alerts');
  const sim = useSimulation(scenario);
  const [notified, setNotified] = useState(false), [audit, setAudit] = useState<AuditEntry[]>([]), [done, setDone] = useState<Set<string>>(new Set());
  const formatTime = (tick: number) => {
    const total = scenario.startHour * 3600 + scenario.startMinute * 60 + tick;
    const hour = Math.floor(total / 3600) % 24, minute = Math.floor(total / 60) % 60, second = total % 60;
    return `${String(hour % 12 || 12)}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  };
  const addAudit = (text: string) => setAudit(previous => [{ id: Date.now() + Math.random(), time: formatTime(sim.tick), text }, ...previous]);
  const clear = () => { sim.reset(); setView('alerts'); setAudit([]); setDone(new Set()); setNotified(false); };
  const changeScenario = (id: string) => { clear(); setScenario(scenarios.find(s => s.id === id)!); };
  const pair = scenario.id === 'friends' ? sim.scores.find(p => p.leader === 'T-3' && p.follower === 'T-4') : sim.scores.find(p => p.leader === 'T-1' && p.follower === 'T-2');
  const onAction = (action: string) => { setDone(previous => new Set(previous).add(action)); addAudit(`${action} · ${pair?.zone ?? 'Campus'} · ${pair?.follower ?? 'No track'} → ${pair?.leader ?? 'No track'}`); if (action === 'Notify walker (opt-in)') setNotified(true); };
  const followAlert = sim.alerts.find(a => a.pair.leader === 'T-1' && a.pair.follower === 'T-2' && a.tier === 'Respond') ?? sim.alerts.find(a => a.pair.leader === 'T-1' && a.pair.follower === 'T-2');
  const notices: SensorNotice[] = scenario.ticks.slice(0, sim.tick + 1).flatMap((tick, i) => tick.events.filter(event => event.type === 'motion' || event.type === 'door-open-no-badge').map((event, j) => ({ id: `${i}-${j}`, event, tick: i }))).reverse();
  const history = scenario.ticks.slice(Math.max(0, sim.tick - 8), sim.tick).map(t => t.tracks);
  const status = scenario.id === 'friends' ? 'NORMAL' : followAlert?.tier === 'Respond' ? 'ELEVATED' : followAlert ? 'MONITORING' : 'NORMAL';
  return <div className="app"><div className="screen-shell"><header className="screen-header">{view === 'alerts' ? <><strong>TRAILGUARD</strong><span>● LIVE</span><time>SEP 15, {formatTime(sim.tick)}</time></> : <><button onClick={() => setView('alerts')}>← SAFETY ALERTS</button><strong>{view === 'privacy' ? "WHAT'S STORED" : scenario.id === 'friends' ? 'PAIR ANALYSIS' : 'FOLLOWING PATTERN'}</strong><span>● {view === 'privacy' ? 'PRIVATE' : status}</span></>}</header>
      <div className="sim-controls"><label>SCENARIO <select value={scenario.id} onChange={e => changeScenario(e.target.value)}>{scenarios.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label><div className="play-controls"><button onClick={() => sim.setPlaying(!sim.playing)}>[ {sim.playing ? 'PAUSE' : 'PLAY'} ]</button><button onClick={clear}>[ RESET ]</button><label>SPEED <select value={sim.speed} onChange={e => sim.setSpeed(Number(e.target.value) as 1 | 2 | 4)}><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label></div><button className="privacy-link" onClick={() => setView(view === 'privacy' ? 'alerts' : 'privacy')}>{view === 'privacy' ? '[ BACK ]' : "[ WHAT'S STORED ]"}</button></div>
      {view === 'alerts' && <SafetyAlerts alert={followAlert} pair={pair} tick={sim.tick} notices={notices} time={formatTime} onView={() => setView('detail')} onPairAnalysis={() => setView('detail')} isFriends={scenario.id === 'friends'} />}
      {view === 'detail' && pair && <FollowingDetail pair={scenario.id === 'friends' ? pair : { ...pair, tier: followAlert?.tier ?? pair.tier }} tracks={sim.tracks} history={history} time={formatTime(sim.tick)} startTime={formatTime(0)} audit={audit} notified={notified} done={done} onAction={onAction} onCameraRequest={reason => addAudit(`Break-glass footage request · ${pair.zone} · ${pair.follower} · Reason: ${reason}`)} onCall={() => addAudit('Student selected Call campus security in Walk Mode')} />}
      {view === 'privacy' && <div className="privacy-view"><ScorePanel pair={pair} privacy onPrivacy={() => setView('alerts')} /></div>}
    </div></div>;
}
