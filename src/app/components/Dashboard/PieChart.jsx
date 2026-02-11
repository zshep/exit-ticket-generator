import { useMemo } from "react";

function safeSum(obj) {
  return Object.values(obj).reduce((a, b) => a + (Number(b) || 0), 0);
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default function PieChart({ counts, labelsById, size = 220 }) {
  const total = useMemo(() => safeSum(counts || {}), [counts]);

  const entries = useMemo(() => {
    return Object.entries(counts || {}).map(([id, value]) => ({
      id,
      value: Number(value) || 0,
      label: labelsById?.[id] ?? "",
    }));
  }, [counts, labelsById]);

  const nonZero = useMemo(() => entries.filter((e) => e.value > 0), [entries]);

  const r = Math.floor(size / 2) - 6;
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);

  const palette = [
    "#22c55e", // green
    "#ef4444", // red
    "#3b82f6", // blue
    "#facc15", // yellow
    "#a855f7", // purple (backup)
    "#06b6d4", // cyan (backup)
  ];

  let angle = 0;

  return (
    <div className="pie-wrap">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Answer distribution"
      >
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="#e5e7eb" />
        ) : (
          nonZero.map((slice, idx) => {
            const deg = (slice.value / total) * 360;
            const start = angle;
            const end = angle + deg;
            angle = end;

            return (
              <path
                key={slice.id}
                d={arcPath(cx, cy, r, start, end)}
                fill={palette[idx % palette.length]}
                stroke="#ffffff"
                strokeWidth="2"
              />
            );
          })
        )}
      </svg>

      <div className="pie-legend">
        {entries.map((e, idx) => (
          <div key={e.id} className="pie-legend-row">
            <span
              className="pie-swatch"
              style={{ background: palette[idx % palette.length] }}
            />
            <div className="pie-legend-text">
              <div className="pie-legend-top">
                <strong>{e.id}</strong>{" "}
                <span className="pie-legend-label">
                  {e.label ? `— ${e.label}` : ""}
                </span>
              </div>

              <div className="pie-legend-bottom">
                <span className="pie-metric">{e.value}</span>
                <span className="pie-dot">•</span>
                <span className="pie-metric">{pct(e.value, total)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
