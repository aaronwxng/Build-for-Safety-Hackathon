import { useEffect, useMemo, useRef, useState } from 'react';
import type { Scenario } from '../data/scenarios';
import { scoreAllPairs, type PairScore, type Tier } from './followScore';
export type Alert = { id: string; tier: Exclude<Tier, 'Normal'>; pair: PairScore; tick: number };

export function useSimulation(scenario: Scenario) {
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const emitted = useRef(new Set<string>());
  const scores = useMemo(() => scoreAllPairs(scenario, tick), [scenario, tick]);
  useEffect(() => {
    setTick(0); setPlaying(false); setAlerts([]); emitted.current.clear();
  }, [scenario]);
  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => setTick(current => {
      if (current >= scenario.ticks.length - 1) { setPlaying(false); return current; }
      return current + 1;
    }), 250 / speed);
    return () => window.clearInterval(interval);
  }, [playing, scenario, speed]);
  useEffect(() => {
    const next: Alert[] = [];
    for (const pair of scores) {
      if (pair.tier === 'Normal') continue;
      const key = `${pair.leader}/${pair.follower}/${pair.tier}`;
      if (!emitted.current.has(key)) {
        emitted.current.add(key);
        next.push({ id: key, tier: pair.tier, pair, tick });
      }
    }
    if (next.length) setAlerts(previous => [...next, ...previous]);
  }, [scores, tick]);
  const reset = () => { setPlaying(false); setTick(0); setAlerts([]); emitted.current.clear(); };
  return { tick, playing, setPlaying, speed, setSpeed, reset, scores, alerts, tracks: scenario.ticks[tick].tracks };
}
