export default function ShortEditor({ value, onChange }) {
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div style={{ border: "1px solid #ccc", padding: 12, marginTop: 12 }}>
      <h3>Short Response Setup</h3>

      <label style={{ display: "block" }}>Expected Answer (teacher-only)</label>
      <textarea
        value={value.expectedAnswer ?? ""}
        onChange={(e) => update({ expectedAnswer: e.target.value })}
        placeholder="Type the expected answer / exemplar response..."
        rows={4}
        style={{ width: "100%", marginTop: 6 }}
      />
    </div>
  );
}
