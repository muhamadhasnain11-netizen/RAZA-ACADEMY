export const LESSONS = [
  { key: "l1", title: "Alertness and attitude" },
  { key: "l2", title: "Road signs and markings" },
  { key: "l3", title: "Rules of the road" },
  { key: "l4", title: "Speed and stopping distances" },
  { key: "l5", title: "Junctions and roundabouts" },
  { key: "l6", title: "Motorway driving" },
  { key: "l7", title: "Vulnerable road users" },
  { key: "l8", title: "Hazard awareness" },
  { key: "l9", title: "Vehicle safety and documents" },
  { key: "l10", title: "Incidents and emergencies" },
  { key: "l11", title: "Hazard perception" },
  { key: "l12", title: "Mock tests and test day" },
];
export const pct = (r) => Math.round((r.score / r.total) * 100);
export const currentLesson = (done) => LESSONS.findIndex((l) => !done.has(l.key));
export const fdate = (d) => new Date(d).toLocaleDateString("en-GB");
// Adds up per-topic scores saved with each test result.
export function topicTotals(results) {
  const t = {};
  results.forEach((r) => {
    Object.entries(r.answers || {}).forEach(([k, v]) => {
      if (v && typeof v === "object" && "total" in v) {
        t[k] = t[k] || { right: 0, total: 0 };
        t[k].right += v.right; t[k].total += v.total;
      }
    });
  });
  return Object.entries(t).map(([name, v]) => ({ name, ...v, pct: Math.round((v.right / v.total) * 100) })).sort((a, b) => a.pct - b.pct);
}
