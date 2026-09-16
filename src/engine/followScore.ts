import { zoneAt, type Scenario, type Track } from '../data/scenarios';

export type Tier = 'Normal' | 'Watch' | 'Respond';
export type Breakdown = { signal: string; value: string; points: number };
export type PairScore = { leader: string; follower: string; score: number; tier: Tier; breakdown: Breakdown[]; reason: string; zone: string };
export const tierFor = (score: number): Tier => score >= 70 ? 'Respond' : score >= 40 ? 'Watch' : 'Normal';
const distance = (a: Track, b: Track) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
const stddev = (values: number[]) => Math.sqrt(mean(values.map(v => (v - mean(values)) ** 2)));
function zoneSequence(samples: Track[]): string[] {
  const result: string[] = [];
  for (const sample of samples) {
    const id = zoneAt(sample.x, sample.y)?.id;
    if (id && id !== result[result.length - 1]) result.push(id);
  }
  return result;
}
function sharedOrderedZones(a: string[], b: string[]): number {
  let best = 0;
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    let n = 0;
    while (a[i + n] && a[i + n] === b[j + n]) n++;
    best = Math.max(best, n);
  }
  return best;
}
const isTurn = (now: Track, before: Track) => now.speed > 0.2 && before.speed > 0.2 && Math.abs(Math.atan2(Math.sin(now.heading - before.heading), Math.cos(now.heading - before.heading))) > 0.25;

/** Scores one directed pair using only the most recent 30 ticks. No identity or image data enters this function. */
export function scorePair(scenario: Scenario, tickIndex: number, leaderToken: string, followerToken: string): PairScore {
  const ticks = scenario.ticks.slice(Math.max(0, tickIndex - 29), tickIndex + 1);
  const leaders = ticks.map(t => t.tracks.find(x => x.token === leaderToken)).filter((x): x is Track => !!x);
  const followers = ticks.map(t => t.tracks.find(x => x.token === followerToken)).filter((x): x is Track => !!x);
  const pairs = leaders.map((lead, i) => [lead, followers[i]] as const).filter((p): p is readonly [Track, Track] => !!p[1]);
  const gaps = pairs.map(([a, b]) => distance(a, b));
  const current = pairs[pairs.length - 1];
  const zone = current ? zoneAt(current[1].x, current[1].y)?.label ?? 'Campus walkway' : 'Campus walkway';
  const zero = (reason: string): PairScore => ({ leader: leaderToken, follower: followerToken, score: 0, tier: 'Normal', reason, zone, breakdown: [] });
  if (pairs.length < 5) return zero('Collecting sensor history');
  if (pairs.filter(([lead, follow]) => follow.x > lead.x + 2).length / pairs.length > 0.6) return zero('Track is ahead, not following');
  // A sustained close gap is ordinary side-by-side movement, even if routes match.
  if (gaps.filter(g => g <= 3).length / gaps.length >= 0.7) return zero('companions');

  const commonZones = sharedOrderedZones(zoneSequence(leaders), zoneSequence(followers));
  const zonePoints = commonZones >= 3 ? 30 : commonZones === 2 ? 8 : 0;
  const stableShare = gaps.filter(g => g >= 5 && g <= 20).length / gaps.length;
  const gapPoints = Math.round(20 * stableShare * clamp((4 - stddev(gaps)) / 4));
  let leaderMoves = 0, mirrored = 0;
  for (let i = 1; i < pairs.length; i++) {
    const leadEvent = (pairs[i][0].speed < 0.15 && pairs[i - 1][0].speed >= 0.15) || isTurn(pairs[i][0], pairs[i - 1][0]);
    if (!leadEvent) continue;
    leaderMoves++;
    for (let j = i; j <= Math.min(i + 2, pairs.length - 1); j++) {
      if ((pairs[j][1].speed < 0.15 && pairs[Math.max(0, j - 1)][1].speed >= 0.15) || (j > 0 && isTurn(pairs[j][1], pairs[j - 1][1]))) { mirrored++; break; }
    }
  }
  const mirrorPoints = leaderMoves ? Math.round(20 * mirrored / leaderMoves) : 0;
  const phoneCount = pairs.filter(([lead, follow]) => {
    if (!follow.phoneRaised) return false;
    const toward = Math.atan2(lead.y - follow.y, lead.x - follow.x);
    return Math.cos(follow.heading - toward) > 0.5;
  }).length;
  const phonePoints = Math.min(10, phoneCount * 4);
  const timedEvents = ticks.flatMap((t, i) => t.events.map(event => ({ event, i })));
  // Door evidence only counts when the follower opens the same door shortly after
  // the leader's swipe and there is no intervening follower swipe.
  const tailgatePoints = timedEvents.some(({ event: badge, i: badgeTick }) => badge.type === 'badge' && badge.token === leaderToken &&
    timedEvents.some(({ event: open, i: openTick }) => open.type === 'door-open-no-badge' && open.token === followerToken && open.door === badge.door &&
      openTick > badgeTick && openTick - badgeTick <= 5 &&
      !timedEvents.some(({ event: second, i }) => second.type === 'badge' && second.token === followerToken && second.door === badge.door && i > badgeTick && i <= openTick))) ? 15 : 0;
  const multiplier = scenario.startHour >= 22 || scenario.lowTraffic || zoneAt(current[1].x, current[1].y)?.lowTraffic ? 1.3 : 1;
  const breakdown: Breakdown[] = [
    { signal: 'Zone continuity', value: `${commonZones} shared zones`, points: zonePoints },
    { signal: 'Gap stability', value: `${mean(gaps).toFixed(1)} unit avg · σ ${stddev(gaps).toFixed(1)}`, points: gapPoints },
    { signal: 'Stop / turn mirroring', value: `${mirrored} of ${leaderMoves} moves`, points: mirrorPoints },
    { signal: 'Phone oriented toward walker', value: `${phoneCount} times`, points: phonePoints },
    { signal: 'Tailgate after badge', value: tailgatePoints ? 'Detected' : 'None', points: tailgatePoints },
    { signal: 'Context', value: multiplier === 1.3 ? 'Late / low traffic ×1.3' : 'Normal traffic ×1.0', points: Math.round((zonePoints + gapPoints + mirrorPoints + phonePoints + tailgatePoints) * (multiplier - 1)) },
  ];
  const score = Math.min(100, Math.round((zonePoints + gapPoints + mirrorPoints + phonePoints + tailgatePoints) * multiplier));
  return { leader: leaderToken, follower: followerToken, score, tier: tierFor(score), breakdown, reason: commonZones >= 3 ? `${followerToken} has followed ${leaderToken} across ${commonZones} zones` : score ? 'Monitoring repeated movement' : 'No persistent following pattern', zone };
}

export function scoreAllPairs(scenario: Scenario, tickIndex: number): PairScore[] {
  const tokens = scenario.ticks[tickIndex]?.tracks.map(t => t.token) ?? [];
  return tokens.flatMap(leader => tokens.filter(follower => follower !== leader).map(follower => scorePair(scenario, tickIndex, leader, follower)))
    .sort((a, b) => b.score - a.score);
}
