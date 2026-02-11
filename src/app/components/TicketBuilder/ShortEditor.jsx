export default function ShortEditor({ value, onChange }) {
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="qb-block">
      <div className="qb-header">
        <h3 className="qb-title">Short Response</h3>
        <p className="qb-muted">Teacher-only exemplar answer for feedback and scoring.</p>
      </div>

      <label className="qb-label">Expected Answer</label>
      <textarea
        className="qb-textarea"
        value={value.expectedAnswer ?? ""}
        onChange={(e) => update({ expectedAnswer: e.target.value })}
        placeholder="Type the expected answer / exemplar response…"
        rows={4}
      />
    </div>
  );
}
