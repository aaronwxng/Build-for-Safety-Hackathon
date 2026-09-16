import type { Alert } from '../engine/useSimulation';
import './AlertFeed.css';
export const actions = ['Dispatch nearest patrol', 'Increase lighting in zone', 'Notify walker (opt-in)'] as const;
export type ActionName = typeof actions[number];
export default function AlertFeed({ alerts, formatTime, done, onAction }: { alerts: Alert[]; formatTime: (tick: number) => string; done: Set<string>; onAction: (alert: Alert, action: ActionName) => void }) {
  return <section className="panel alerts-panel"><h2>Alert feed</h2>{alerts.length === 0 && <p className="quiet">No alerts. Play a scenario to watch sensor fusion.</p>}{alerts.map(alert => <article className={`alert-card ${alert.tier.toLowerCase()}`} key={alert.id}><div className="alert-top"><strong>{alert.tier}</strong><time>{formatTime(alert.tick)}</time></div><p>{alert.pair.reason}</p><small>{alert.pair.zone}</small>{alert.tier === 'Respond' && <div className="action-list">{actions.map(action => { const key = `${alert.id}/${action}`; return <button key={action} disabled={done.has(key)} onClick={() => onAction(alert, action)}>{done.has(key) ? '✓ ' : ''}{action}</button>; })}</div>}</article>)}</section>;
}
