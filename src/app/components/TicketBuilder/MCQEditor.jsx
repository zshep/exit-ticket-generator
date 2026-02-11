export default function MCQEditor({ value, onChange }) {
  const { allowMultiple, choices, correctIds } = value;

  const update = (patch) => onChange({ ...value, ...patch });

  const setChoiceText = (id, text) => {
    const nextChoices = choices.map((c) => (c.id === id ? { ...c, text } : c));
    update({ choices: nextChoices });
  };

  const toggleCorrect = (id) => {
    if (allowMultiple) {
      const nextCorrectIds = correctIds.includes(id)
        ? correctIds.filter((x) => x !== id)
        : [...correctIds, id];
      update({ correctIds: nextCorrectIds });
      return;
    }

    update({ correctIds: correctIds[0] === id ? [] : [id] });
  };

  const setAllowMultiple = (checked) => {
    if (checked) {
      update({ allowMultiple: true });
      return;
    }
    update({ allowMultiple: false, correctIds: correctIds.slice(0, 1) });
  };

  const hasEmptyChoice = choices.some((c) => !c.text.trim());
  const noCorrectSelected = correctIds.length === 0;

  return (
    <div className="qb-block">
      <div className="qb-header">
        <h3 className="qb-title">Multiple Choice</h3>

        <label className="qb-toggle">
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={(e) => setAllowMultiple(e.target.checked)}
          />
          <span>Allow multiple correct answers</span>
        </label>
      </div>

      <div className="qb-choices">
        {choices.map((c) => {
          const isCorrect = correctIds.includes(c.id);
          return (
            <div key={c.id} className="qb-choice-row">
              <button
                type="button"
                className={`qb-correct-btn ${isCorrect ? "is-correct" : ""}`}
                onClick={() => toggleCorrect(c.id)}
                aria-pressed={isCorrect}
                title={allowMultiple ? "Toggle correct answer" : "Set correct answer"}
              >
                <span className="qb-choice-letter">{c.id}</span>
                <span className="qb-choice-state">
                  {isCorrect ? "Correct" : "Not correct"}
                </span>
              </button>

              <input
                className="qb-choice-input"
                value={c.text}
                onChange={(e) => setChoiceText(c.id, e.target.value)}
                placeholder={`Choice ${c.id}`}
              />
            </div>
          );
        })}
      </div>

      {(hasEmptyChoice || noCorrectSelected) && (
        <div className="qb-warning">
          {hasEmptyChoice && <div>Fill all 4 choices.</div>}
          {noCorrectSelected && <div>Select at least one correct answer.</div>}
        </div>
      )}
    </div>
  );
}
