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
    <div>
      <p>Select your answer{allowMultiple ? "(s)" : ""}:</p>
      {choices.map((c) => (
        <label key={c.id} style={{ display: "block", marginBottom: 8 }}>
          <input
            type={allowMultiple ? "checkbox" : "radio"}
            name="mcq"
            checked={selectedIds.includes(c.id)}
            onChange={() => toggle(c.id)}
          />
          {" "}{c.text}
        </label>
      ))}
    </div>
  );
}
