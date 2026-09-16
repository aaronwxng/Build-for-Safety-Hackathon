import { doors, motionSensors, zones, type Track } from '../data/scenarios';
import type { PairScore } from '../engine/followScore';
import './CampusMap.css';
type Props = { tracks: Track[]; history: Track[][]; pair?: PairScore };
export default function CampusMap({ tracks, history, pair }: Props) {
  const leader = tracks.find(t => t.token === pair?.leader), follower = tracks.find(t => t.token === pair?.follower);
  return <div className="map-wrap"><svg className="campus-map" viewBox="0 0 100 60" role="img" aria-label="Campus map with six sensor zones and anonymous tracks">
    <rect width="100" height="60" fill="var(--map-bg)" />
    <path d="M 0 18 H 100 M 50 18 V 60" className="map-path" />
    {zones.map(z => <g key={z.id}><rect className="map-zone" x={z.x} y={z.y} width={z.width} height={z.height} rx="1" /><text className="zone-label" x={z.x + 1.5} y={z.y + 4}>{z.label}</text></g>)}
    {doors.map(d => <g key={d.id}><rect x={d.x - 1} y={d.y - 1} width="2" height="2" fill="var(--accent)" /><text className="sensor-label" x={d.x + 2} y={d.y + 1}>Door</text></g>)}
    {motionSensors.map(s => <g key={s.id}><circle cx={s.x} cy={s.y} r=".8" fill="var(--warning)" /><text className="sensor-label" x={s.x + 1} y={s.y + 1}>Motion</text></g>)}
    {pair && pair.tier !== 'Normal' && leader && follower && <line x1={leader.x} y1={leader.y} x2={follower.x} y2={follower.y} className="pair-line" />}
    {tracks.map(t => {
      const trail = history.map((frame, i) => ({ point: frame.find(item => item.token === t.token), opacity: (i + 1) / (history.length + 2) })).filter(item => item.point);
      const danger = pair?.tier === 'Respond' && pair.follower === t.token;
      return <g key={t.token}>{trail.map((item, i) => <circle key={i} cx={item.point!.x} cy={item.point!.y} r=".35" fill={danger ? 'var(--danger)' : 'var(--accent)'} opacity={item.opacity} />)}<circle className={danger ? 'track-dot danger pulse' : 'track-dot'} cx={t.x} cy={t.y} r="1.15" /><text className="track-label" x={t.x + 1.5} y={t.y - 1}>{t.token}</text></g>;
    })}
  </svg><div className="map-key"><span>● Anonymous track</span><span>■ Door sensor</span><span>● Motion sensor</span></div></div>;
}
