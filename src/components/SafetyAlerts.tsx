import { useState } from 'react';
import type { Alert } from '../engine/useSimulation';
import type { SensorEvent } from '../data/scenarios';
import type { PairScore } from '../engine/followScore';
import './SafetyAlerts.css';

export type SensorNotice = { id: string; event: SensorEvent; tick: number };
type Filter = 'All' | 'High priority' | 'Monitoring';
export default function SafetyAlerts({ alert, pair, tick, notices, time, onView, onPairAnalysis, isFriends }: {
  alert?: Alert; pair?: PairScore; tick: number; notices: SensorNotice[]; time: (tick: number) => string; onView: () => void; onPairAnalysis: () => void; isFriends: boolean;
}) {
  const [filter, setFilter] = useState<Filter>('All');
  const visibleAlert = filter !== 'Monitoring' && alert;
  const visibleNotices = filter !== 'High priority' ? notices : [];
  const count = (alert ? 1 : 0) + notices.length;
  const signals = (pair ?? alert?.pair)?.breakdown.filter(row => row.points > 0 && row.signal !== 'Context').length ?? 0;
  return <section className="safety-alerts"><div className="list-title"><h2>SAFETY ALERTS</h2><span>{count} ACTIVE</span></div><div className="alert-filters" aria-label="Alert filters">{(['All', 'High priority', 'Monitoring'] as Filter[]).map(item => <button className={filter === item ? 'selected' : ''} key={item} onClick={() => setFilter(item)}>[{item.toUpperCase()}]</button>)}</div>
    {visibleAlert && <article className="list-card main-alert"><div className="list-card-head"><span><i className={alert.tier === 'Respond' ? 'status-dot red' : 'status-dot yellow'} />FOLLOWING PATTERN</span><time>{time(tick)}</time></div><div className="list-card-body"><p>{alert.tier === 'Respond' ? 'Elevated' : 'Monitoring'}<br />{alert.pair.reason}</p><p>📍 Library Entrance → {pair?.zone ?? alert.pair.zone}<br />{time(0)} — {time(tick)}</p></div><div className="list-card-foot"><span>{signals} corroborating signals</span><button onClick={onView}>VIEW ALERT →</button></div></article>}
    {visibleNotices.map(notice => <article className="list-card sensor-alert" key={notice.id}><div className="list-card-head"><span><i className={`status-dot ${notice.event.type === 'motion' ? 'yellow' : 'green'}`} />{notice.event.type === 'motion' ? 'AFTER-HOURS MOTION' : 'DOOR OPEN WITHOUT BADGE'}</span><time>{time(notice.tick)}</time></div><p>{notice.event.type === 'motion' ? 'Unusual movement detected' : 'No access credential detected'}<br />📍 {notice.event.zone === 'residence' ? 'Residence Entrance' : notice.event.zone === 'arts' ? 'Arts Quad' : 'Parking Lot N'}</p></article>)}
    {!visibleAlert && visibleNotices.length === 0 && <div className="empty-alerts"><p>{isFriends ? 'No safety alerts. T-3 and T-4 are classified as companions.' : 'No alerts yet. Play the scenario to watch signals arrive.'}</p>{isFriends && <button onClick={onPairAnalysis}>VIEW PAIR ANALYSIS →</button>}</div>}
  </section>;
}
