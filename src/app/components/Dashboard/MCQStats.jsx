import { useMemo } from "react";
import PieChart from "./PieChart";

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function percent(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

export default function MCQStats({ ticket, submissions, answerKey }) {
  const mcqStats = useMemo(() => {
    if (!ticket || ticket.questionType !== "multipleChoice") return null;

    const choices = ticket.publicConfig?.choices ?? [];
    const labelsById = Object.fromEntries(choices.map((c) => [c.id, c.text]));

    const counts = {};
    for (const c of choices) counts[c.id] = 0;

    for (const s of submissions ?? []) {
      const ans = Array.isArray(s.answer) ? s.answer : [];
      for (const id of ans) counts[id] = (counts[id] ?? 0) + 1;
    }

    const correctIds = (answerKey?.correctIds ?? []).map(String);
    const correctSet = new Set(correctIds);

    let correctCount = 0;
    for (const s of submissions ?? []) {
      const ansArr = Array.isArray(s.answer) ? s.answer.map(String) : [];
      const ansSet = new Set(ansArr);
      if (correctSet.size > 0 && setsEqual(ansSet, correctSet)) correctCount += 1;
    }

    const total = (submissions ?? []).length;

    return {
      counts,
      labelsById,
      correctCount,
      total,
      correctPct: percent(correctCount, total),
    };
  }, [ticket, answerKey, submissions]);



  return (
    <div className="stats-block">
      <div className="stats-header">
        <h4 className="stats-title">Multiple Choice Analysis</h4>

        
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <h5 className="stats-card-title">Distribution</h5>
          <PieChart
            counts={mcqStats?.counts ?? {}}
            labelsById={mcqStats?.labelsById ?? {}}
            size={220}
          />
        </div>

        <div className="stats-card">
          <h5 className="stats-card-title">Counts</h5>
          <div className="counts-list">
            {Object.entries(mcqStats?.counts ?? {}).map(([id, count]) => (
              <div key={id} className="count-row">
                <div className="count-left">
                  <span className="count-pill">{id}</span>
                  <span className="count-label">{mcqStats?.labelsById?.[id] ?? ""}</span>
                </div>
                <div className="count-right">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
