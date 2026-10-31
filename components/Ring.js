export function Ring({ value, size = 132, sub }) {
  const r = size / 2 - 10, c = 2 * Math.PI * r, v = Math.min(Math.max(value, 0), 100);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${sub} ${v}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e4d9da" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#d61f26" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-in"><b>{v}%</b><small>{sub}</small></div>
    </div>
  );
}
