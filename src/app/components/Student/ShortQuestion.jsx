export default function ShortQuestion({ value, onChange }) {
  return (
    <div>
      <label>Your answer</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        style={{ width: "100%" }}
        placeholder="Type your response..."
      />
    </div>
  );
}
