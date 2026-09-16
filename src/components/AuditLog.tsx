import './AuditLog.css';
export type AuditEntry = { id: number; time: string; text: string };
export default function AuditLog({ entries }: { entries: AuditEntry[] }) { return <section className="panel audit-panel"><h2>Audit log</h2>{entries.length ? <ol>{entries.map(e => <li key={e.id}><time>{e.time}</time><span>{e.text}</span></li>)}</ol> : <p>No actions recorded.</p>}</section>; }
