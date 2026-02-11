export default function ShortQuestion({ value, onChange }) {
  return (
    <div className="student-short">
      <label className="student-label">Your answer</label>
      <textarea
        className="student-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Type your response..."
      />
    </div>
  );
}