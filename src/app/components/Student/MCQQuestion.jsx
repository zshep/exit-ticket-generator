export default function MCQQuestion({
  choices,
  allowMultiple,
  selectedIds,
  onChangeSelectedIds,
}) {
  const toggle = (id) => {
    if (allowMultiple) {
      onChangeSelectedIds(
        selectedIds.includes(id)
          ? selectedIds.filter((x) => x !== id)
          : [...selectedIds, id]
      );
    } else {
      onChangeSelectedIds(selectedIds[0] === id ? [] : [id]);
    }
  };

return (
  <div className="student-mcq">
    <p className="student-mcq-label">
      Select your answer{allowMultiple ? "(s)" : ""}:
    </p>

    <div className="student-mcq-options">
      {choices.map((c) => {
        const selected = selectedIds.includes(c.id);

        return (
          <label
            key={c.id}
            className={`student-mcq-option ${selected ? "selected" : ""}`}
          >
            <input
              type={allowMultiple ? "checkbox" : "radio"}
              name="mcq"
              checked={selected}
              onChange={() => toggle(c.id)}
            />
            <span className="student-mcq-text">{c.text}</span>
          </label>
        );
      })}
    </div>
  </div>
);

}
