import { useMemo } from "react";

function normalizeText(s) {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function percent(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

export default function ShortStats({ ticket, submissions, answerKey }) {
  const shortStats = useMemo(() => {
    if (!ticket || ticket.questionType !== "shortResponse") return null;

    const expected = normalizeText(answerKey?.expectedAnswer ?? "");
    const responses = (submissions ?? [])
      .map((s) => String(s.answer ?? ""))
      .map((a) => a.trim())
      .filter(Boolean);

    const freq = new Map();
    for (const r of responses) {
      const key = normalizeText(r);
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }

    let mostCommon = "";
    let mostCommonCount = 0;
    for (const [k, c] of freq.entries()) {
      if (c > mostCommonCount) {
        mostCommon = k;
        mostCommonCount = c;
      }
    }

    const correctCount =
      expected.length === 0
        ? 0
        : responses.filter((r) => normalizeText(r) === expected).length;

    return {
      responses,
      correctCount,
      correctPct: percent(correctCount, responses.length),
      mostCommon,
      mostCommonCount,
    };
  }, [ticket, answerKey, submissions]);

  const total = shortStats?.responses.length ?? 0;

  return (
    <div className="stats-block">
      <div className="stats-header">
        <h4 className="stats-title">Short Response Analysis</h4>

        <div className="stats-kpi">
          <div className="summary-card">
            <div className="summary-label">Correct</div>
            <div className="summary-value">
              {shortStats?.correctCount ?? 0} / {total} ({shortStats?.correctPct ?? 0}%)
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Most Common</div>
            <div className="summary-value">
              {shortStats?.mostCommon
                ? `"${shortStats.mostCommon}" (${shortStats.mostCommonCount})`
                : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-card">
        <h5 className="stats-card-title">Responses</h5>
        {total ? (
          <ol className="response-list">
            {shortStats.responses.map((r, idx) => (
              <li key={idx} className="response-item">
                {r}
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ margin: 0, color: "#6b7280" }}>No responses yet.</p>
        )}
      </div>
    </div>
  );
}
