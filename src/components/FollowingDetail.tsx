import type { PairScore } from '../engine/followScore';
import type { Track } from '../data/scenarios';
import CampusMap from './CampusMap';
import CameraTile from './CameraTile';
import AuditLog, { type AuditEntry } from './AuditLog';
import PhoneMockup from './PhoneMockup';
import './FollowingDetail.css';

type Props = { pair: PairScore; tracks: Track[]; history: Track[][]; time: string; startTime: string; audit: AuditEntry[]; notified: boolean; done: Set<string>; onAction: (action: string) => void; onCameraRequest: (reason: string) => void; onCall: () => void };
const labels = ['Cross-zone continuity', 'Persistent proximity', 'Direction matching', 'Phone / pose cue', 'Tailgate after badge'];
const indices = [0, 1, 2, 3, 4];
const level = (points: number, max: number) => points >= max * .75 ? 'HIGH' : points >= max * .3 ? 'MED' : 'LOW';
export default function FollowingDetail({ pair, tracks, history, time, startTime, audit, notified, done, onAction, onCameraRequest, onCall }: Props) {
  const signalRows = indices.map((index, i) => ({ label: labels[i], row: pair.breakdown[index], max: [30, 20, 20, 10, 15][i] })).filter(item => item.row && (item.label !== 'Tailgate after badge' || item.row.points > 0));
  return <div className="following-detail"><div className="incident-intro"><h2>{pair.reason === 'companions' ? 'COMPANION PATTERN' : 'FOLLOWING PATTERN DETECTED'}</h2><p>{pair.leader} → {pair.follower} · {startTime}–{time}</p><p className="incident-summary">{pair.reason}</p></div><div className="detail-grid"><div className="detail-map"><div className="detail-box-title">CAMPUS MAP</div><CampusMap tracks={tracks} history={history} pair={pair} /></div><div className="signal-box"><div className="detail-box-title">SIGNAL BREAKDOWN <span>{pair.score}/100</span></div><div className="detail-score-bar" aria-label={`Follow Score ${pair.score} of 100`}><div style={{ width: `${pair.score}%` }} /></div>{pair.reason === 'companions' ? <p className="companion-note">Companion exclusion: the pair stayed within 3 units for most of the rolling window. Follow Score is zero.</p> : signalRows.map(item => <div className="signal-row" key={item.label}><span>● {item.label}<small>{item.row.value} · +{item.row.points} pts</small></span><b>{level(item.row.points, item.max)}</b></div>)}<div className="context-row">{pair.breakdown[5]?.value ?? 'Normal traffic ×1.0'}</div></div></div>
    <div className="detail-section"><h3>SENSOR EVIDENCE</h3><CameraTile zone={pair.zone} token={pair.follower} onRequest={onCameraRequest} /></div>
    <div className="next-action"><h3>NEXT ACTION</h3><p>Current location: {pair.zone}</p>{pair.reason === 'companions' ? <p>No action required. Companion exclusion prevented an alert.</p> : <><div className="next-buttons">{['Dispatch nearest patrol', 'Continue monitoring'].map(action => <button disabled={done.has(action)} key={action} onClick={() => onAction(action)}>[ {done.has(action) ? 'DONE: ' : ''}{action.toUpperCase()} ]</button>)}</div><div className="secondary-actions">{['Increase lighting in zone', 'Notify walker (opt-in)'].map(action => <button disabled={done.has(action)} key={action} onClick={() => onAction(action)}>[ {done.has(action) ? 'DONE: ' : ''}{action.toUpperCase()} ]</button>)}</div></>}</div>
    <div className="detail-lower"><AuditLog entries={audit} /><PhoneMockup notified={notified} onCall={onCall} /></div></div>;
}
