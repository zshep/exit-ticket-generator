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

  return (
    <div style={{ marginTop: 16 }}>
      <h4>Short Response Results</h4>

      <p>
        <strong>Correct:</strong> {shortStats?.correctCount ?? 0} /{" "}
        {shortStats?.responses.length ?? 0} ({shortStats?.correctPct ?? 0}%)
      </p>

      <p>
        <strong>Most common answer:</strong>{" "}
        {shortStats?.mostCommon
          ? `"${shortStats.mostCommon}" (${shortStats.mostCommonCount})`
          : "—"}
      </p>

      <div style={{ marginTop: 12 }}>
        <h4>Responses</h4>
        {shortStats?.responses?.length ? (
          <ol>
            {shortStats.responses.map((r, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                {r}
              </li>
            ))}
          </ol>
        ) : (
          <p>No responses yet.</p>
        )}
      </div>
    </div>
  );
}
