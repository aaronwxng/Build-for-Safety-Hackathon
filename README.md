# Trailguard

A browser-only, privacy-first campus safety demo for the Verkada Build for Safety challenge. Cameras contribute derived anonymous motion tracks; access-control and motion events add context. No face, name, or backend is involved.

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. `npm run build` checks TypeScript and creates a production bundle.

## 60-second demo script

1. On **Safety Alerts**, choose **Following incident**, set speed to **4×**, and press **Play**. The following card turns elevated before the residence door; motion and door sensor notices arrive as the simulation advances.
2. Click **View Alert**. Show the animated map and signal breakdown, then click **Dispatch nearest patrol**, **Increase lighting in zone**, and **Notify walker (opt-in)**. Show the audit log and Walk Mode notification.
3. In **Sensor Evidence**, click **View**, enter “Verify active alert”, and request access. Show the audited reason and clearer placeholder.
4. Click **What's stored** to show token rotation, 24-hour non-alert deletion, and excluded identity data.
5. Switch to **Friends walking together**, play at 4×, and click **View Pair Analysis**. Show **Normal / companions** and no safety alert despite their matching route and badges.

The scenarios are scripted at one simulated second per tick, displayed every 250 ms at 1×. All actions and footage access are simulated in browser state.
