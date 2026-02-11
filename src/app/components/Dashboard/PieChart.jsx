import { useMemo } from "react";

export default function PieChart({ counts, labelsById, size = 180 }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const radius = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;

  const slices = useMemo(() => {
    let startAngle = -Math.PI / 2;

    const entries = Object.entries(counts);
    const nonZero = entries.filter(([, c]) => c > 0);

    // single-slice full circle fix
    if (total > 0 && nonZero.length === 1) {
      const [id, count] = nonZero[0];
      const hue = 0;
      const fill = `hsl(${hue} 70% 55%)`;

      const x1 = cx + radius;
      const y1 = cy;

      const d = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy}`,
        `A ${radius} ${radius} 0 1 1 ${x1} ${y1}`,
        "Z",
      ].join(" ");

      return [
        {
          id,
          count,
          d,
          fill,
          pct: 100,
          label: labelsById?.[id] ?? id,
        },
      ];
    }

    return entries.map(([id, count], idx) => {
      const frac = total ? count / total : 0;
      const angle = frac * Math.PI * 2;
      const endAngle = startAngle + angle;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      const d = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        "Z",
      ].join(" ");

      const hue = (idx * 67) % 360;
      const fill = `hsl(${hue} 70% 55%)`;

      const slice = {
        id,
        count,
        d,
        fill,
        pct: total ? Math.round(frac * 100) : 0,
        label: labelsById?.[id] ?? id,
      };

      startAngle = endAngle;
      return slice;
    });
  }, [counts, labelsById, total, cx, cy, radius]);

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
      <svg width={size} height={size} role="img" aria-label="Response distribution pie chart">
        <circle cx={cx} cy={cy} r={radius} fill="#f3f3f3" stroke="#ddd" />
        {slices.map((s) => (
          <path key={s.id} d={s.d} fill={s.fill} stroke="#fff" strokeWidth="2" />
        ))}
      </svg>

      <div>
        <h4 style={{ margin: "0 0 8px 0" }}>Distribution</h4>
        {slices.map((s) => (
          <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{ width: 12, height: 12, background: s.fill, display: "inline-block", borderRadius: 2 }} />
            <span style={{ fontWeight: 700 }}>{s.id}</span>
            <span style={{ opacity: 0.85 }}>{s.label}</span>
            <span style={{ marginLeft: "auto" }}>
              {s.count} ({s.pct}%)
            </span>
          </div>
        ))}
        {total === 0 && <p style={{ marginTop: 8 }}>No submissions yet.</p>}
      </div>
    </div>
  );
}