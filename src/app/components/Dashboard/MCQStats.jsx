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
      for (const id of ans) {
        if (counts[id] == null) counts[id] = 0;
        counts[id] += 1;
      }
    }

    const correctIds = (answerKey?.correctIds ?? []).map(String);
    const correctSet = new Set(correctIds);

    let correctCount = 0;
    for (const s of submissions ?? []) {
      const ansArr = Array.isArray(s.answer) ? s.answer.map(String) : [];
      const ansSet = new Set(ansArr);
      if (correctSet.size > 0 && setsEqual(ansSet, correctSet)) {
        correctCount += 1;
      }
    }

    return {
      counts,
      labelsById,
      correctCount,
      correctPct: percent(correctCount, (submissions ?? []).length),
    };
  }, [ticket, answerKey, submissions]);

  return (
    <div style={{ marginTop: 16 }}>
      <h4>Multiple Choice Results</h4>

      <p>
        <strong>Correct:</strong> {mcqStats?.correctCount ?? 0} /{" "}
        {(submissions ?? []).length} ({mcqStats?.correctPct ?? 0}%)
      </p>

      <PieChart
        counts={mcqStats?.counts ?? {}}
        labelsById={mcqStats?.labelsById ?? {}}
        size={200}
      />
    </div>
  );
}
