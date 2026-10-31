// Points: 10 per test + 1 per correct answer + 50 for a pass, 25 per lesson done, 15 per class.
export const LEVELS = [
  { name: "Learner Driver", min: 0 }, { name: "Road Rookie", min: 100 }, { name: "Sign Spotter", min: 250 },
  { name: "Junction Pro", min: 500 }, { name: "Motorway Master", min: 900 }, { name: "Theory Champion", min: 1500 },
];
export const pointsOf = ({ results, logs, done }) =>
  results.reduce((t, r) => t + 10 + r.score + (r.passed ? 50 : 0), 0) + done.size * 25 + logs.length * 15;

export function levelOf(p) {
  let i = 0;
  LEVELS.forEach((l, k) => { if (p >= l.min) i = k; });
  const cur = LEVELS[i], next = LEVELS[i + 1];
  return { index: i, name: cur.name, next: next ? next.name : null, toNext: next ? next.min - p : 0, pct: next ? Math.round(((p - cur.min) / (next.min - cur.min)) * 100) : 100 };
}

const day = (d) => new Date(d).toLocaleDateString("en-CA");
export function streaks(results) {
  const days = [...new Set(results.map((r) => day(r.taken_at)))].sort();
  let best = 0, run = 0, prev = null;
  days.forEach((d) => {
    run = prev && Math.round((new Date(d) - new Date(prev)) / 864e5) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = d;
  });
  const set = new Set(days);
  const t = new Date();
  if (!set.has(day(t))) t.setDate(t.getDate() - 1);
  let current = 0;
  while (set.has(day(t))) { current++; t.setDate(t.getDate() - 1); }
  return { current, best };
}

export const BADGES = [
  { key: "first_test", title: "First Test", desc: "Take your first mock test", icon: "Flag", has: (s) => s.results.length >= 1 },
  { key: "first_pass", title: "First Pass", desc: "Pass a mock test", icon: "BadgeCheck", has: (s) => s.results.some((r) => r.passed) },
  { key: "perfect", title: "Perfect Score", desc: "Get every question right", icon: "Star", has: (s) => s.results.some((r) => r.score === r.total) },
  { key: "ten_tests", title: "Ten Tests", desc: "Take 10 mock tests", icon: "Target", has: (s) => s.results.length >= 10 },
  { key: "streak3", title: "3-Day Streak", desc: "Practise 3 days in a row", icon: "Flame", has: (s) => s.streak.best >= 3 },
  { key: "streak5", title: "5-Day Streak", desc: "Practise 5 days in a row", icon: "Zap", has: (s) => s.streak.best >= 5 },
  { key: "first_class", title: "In Class", desc: "Attend your first class", icon: "Car", has: (s) => s.logs.length >= 1 },
  { key: "lesson1", title: "Lesson Done", desc: "Finish your first lesson", icon: "BookOpen", has: (s) => s.done.size >= 1 },
  { key: "half", title: "Halfway There", desc: "Finish 6 lessons", icon: "Medal", has: (s) => s.done.size >= 6 },
  { key: "all", title: "Course Complete", desc: "Finish all 12 lessons", icon: "Trophy", has: (s) => s.done.size >= 12 },
];

export function summary({ results, logs, done }) {
  const streak = streaks(results);
  const points = pointsOf({ results, logs, done });
  const earned = BADGES.filter((b) => b.has({ results, logs, done, streak })).map((b) => b.key);
  return { points, level: levelOf(points), streak, earned };
}
// Average of the last 5 tests.
export function readiness(results) {
  const last = [...results].sort((a, b) => (a.taken_at < b.taken_at ? 1 : -1)).slice(0, 5);
  return last.length ? Math.round(last.reduce((t, r) => t + (r.score / r.total) * 100, 0) / last.length) : 0;
}
