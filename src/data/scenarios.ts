export type Zone = { id: string; label: string; x: number; y: number; width: number; height: number; lowTraffic?: boolean };
export type Track = { token: string; x: number; y: number; heading: number; speed: number; phoneRaised?: boolean };
export type SensorEvent = { type: 'badge' | 'door-open-no-badge' | 'motion'; token?: string; zone: string; door?: string };
export type Tick = { tracks: Track[]; events: SensorEvent[] };
export type Scenario = { id: string; label: string; startHour: number; startMinute: number; lowTraffic: boolean; ticks: Tick[] };

export const zones: Zone[] = [
  { id: 'library', label: 'Library Entrance', x: 0, y: 8, width: 18, height: 20 },
  { id: 'arts', label: 'Arts Quad', x: 18, y: 8, width: 19, height: 20 },
  { id: 'ring', label: 'Ring Road North', x: 37, y: 8, width: 19, height: 20 },
  { id: 'engineering', label: 'Engineering Walkway', x: 56, y: 8, width: 19, height: 20 },
  { id: 'residence', label: 'Residence Entrance', x: 75, y: 8, width: 25, height: 20, lowTraffic: true },
  { id: 'parking', label: 'Parking Lot N', x: 39, y: 36, width: 26, height: 20, lowTraffic: true },
];
export const doors = [{ id: 'residence-door', zone: 'residence', x: 87, y: 18 }];
export const motionSensors = [{ id: 'arts-motion', zone: 'arts', x: 26, y: 18 }, { id: 'parking-motion', zone: 'parking', x: 50, y: 46 }];
export function zoneAt(x: number, y: number): Zone | undefined { return zones.find(z => x >= z.x && x < z.x + z.width && y >= z.y && y < z.y + z.height); }

const rounded = (n: number) => Math.round(n * 10) / 10;
function track(token: string, x: number, y: number, previousX: number, previousY: number, phoneRaised = false): Track {
  const dx = x - previousX, dy = y - previousY;
  return { token, x: rounded(x), y: rounded(y), heading: Math.atan2(dy, dx), speed: rounded(Math.hypot(dx, dy)), phoneRaised };
}
function route(t: number, pauseAt: number): { x: number; y: number } {
  const effective = t >= pauseAt ? t - 1 : t;
  const x = Math.min(91, 6 + effective * 1.18);
  // A visible turn at the quad, then a return to the main walkway.
  const y = effective < 20 ? 17 : effective < 28 ? 17 + (effective - 20) * 0.55 : effective < 36 ? 21.4 - (effective - 28) * 0.55 : 17;
  return { x, y };
}
function background(t: number, a: string, b: string): Track[] {
  const p = { x: 43 + Math.sin(t / 8) * 7, y: 45 + Math.cos(t / 11) * 3 };
  const q = { x: 78 + Math.sin(t / 10) * 5, y: 43 + Math.cos(t / 7) * 4 };
  const pp = { x: 43 + Math.sin((t - 1) / 8) * 7, y: 45 + Math.cos((t - 1) / 11) * 3 };
  const qq = { x: 78 + Math.sin((t - 1) / 10) * 5, y: 43 + Math.cos((t - 1) / 7) * 4 };
  return [track(a, p.x, p.y, pp.x, pp.y), track(b, q.x, q.y, qq.x, qq.y)];
}
function followingTicks(): Tick[] {
  const followPosition = (t: number) => { const p = route(t === 41 ? 40 : t, 40); return { x: p.x - 10, y: p.y }; };
  return Array.from({ length: 90 }, (_, t) => {
    const lead = route(t, 40), prevLead = route(t - 1, 40);
    const follow = followPosition(t), prevFollow = followPosition(t - 1);
    const events: SensorEvent[] = [];
    if (t === 26 || t === 50) events.push({ type: 'motion', zone: t === 26 ? 'arts' : 'parking' });
    if (t === 69) events.push({ type: 'badge', token: 'T-1', zone: 'residence', door: 'residence-door' });
    if (t === 71) events.push({ type: 'door-open-no-badge', token: 'T-2', zone: 'residence', door: 'residence-door' });
    return { tracks: [track('T-1', lead.x, lead.y, prevLead.x, prevLead.y), track('T-2', follow.x, follow.y, prevFollow.x, prevFollow.y, [30, 48, 62].includes(t)), ...background(t, 'T-5', 'T-6')], events };
  });
}
function friendsTicks(): Tick[] {
  return Array.from({ length: 90 }, (_, t) => {
    const p = route(t, 40), prev = route(t - 1, 40);
    const events: SensorEvent[] = [];
    if (t === 68) events.push({ type: 'badge', token: 'T-3', zone: 'residence', door: 'residence-door' });
    if (t === 69) events.push({ type: 'badge', token: 'T-4', zone: 'residence', door: 'residence-door' });
    return { tracks: [track('T-3', p.x, p.y, prev.x, prev.y), track('T-4', p.x + 1.5, p.y + 0.5, prev.x + 1.5, prev.y + 0.5), ...background(t, 'T-7', 'T-8')], events };
  });
}
export const scenarios: Scenario[] = [
  { id: 'following', label: 'Following incident · 11:40 PM', startHour: 23, startMinute: 40, lowTraffic: true, ticks: followingTicks() },
  { id: 'friends', label: 'Friends walking together · 7:30 PM', startHour: 19, startMinute: 30, lowTraffic: false, ticks: friendsTicks() },
];
