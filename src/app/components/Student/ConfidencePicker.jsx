export default function ConfidencePicker({ value, onChange }) {
  const options = [
    { n: 1, label: "Guessed" },
    { n: 2, label: "Little Idea" },
    { n: 3, label: "I think I'm right" },
    { n: 4, label: "I'm willing to bet money" },
  ];

  return (
    <div className="conf">
      <h4 className="conf-title">Confidence</h4>

      <div className="conf-buttons" role="group" aria-label="Confidence level">
        {options.map((opt) => {
          const selected = value === opt.n;
          return (
            <button
              key={opt.n}
              type="button"
              className={`conf-btn ${selected ? "is-selected" : ""}`}
              onClick={() => onChange(opt.n)}
              aria-pressed={selected}
            >
              {opt.n}
            </button>
          );
        })}
      </div>

      <div className="conf-labels">
        {options.map((opt) => {
          const selected = value === opt.n;
          return (
            <div
              key={opt.n}
              className={`conf-row ${selected || value == null ? "" : "is-dim"}`}
            >
              <span className="conf-num">{opt.n}:</span>
              <span>{opt.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
