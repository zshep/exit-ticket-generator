export default function ConfidencePicker({ value, onChange }) {
  const options = [
    { n: 1, label: "Guessed" },
    { n: 2, label: "Little Idea" },
    { n: 3, label: "I think I'm right" },
    { n: 4, label: "I'm willing to bet money" },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ marginBottom: 8 }}>Confidence</h4>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {options.map((opt) => {
          const selected = value === opt.n;

          return (
            <button
              key={opt.n}
              type="button"
              onClick={() => onChange(opt.n)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #ccc",
                cursor: "pointer",
                fontWeight: 700,
                background: selected ? "#2e7d32" : "white",
                color: selected ? "white" : "black",
                minWidth: 56,
              }}
              aria-pressed={selected}
            >
              {opt.n}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 10 }}>
        {options.map((opt) => {
          const selected = value === opt.n;

          return (
            <div
              key={opt.n}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "baseline",
                opacity: selected || value == null ? 1 : 0.6,
                marginTop: 6,
              }}
            >
              <span style={{ fontWeight: 700, width: 18 }}>{opt.n}:</span>
              <span>{opt.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
