import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../services/firebase/firebase"; // adjust path if needed

import ConfidencePicker from "../components/Student/ConfidencePicker";
import MCQQuestion from "../components/Student/MCQQuestion";
import ShortQuestion from "../components/Student/ShortQuestion";

// Fisher–Yates shuffle (stable when you call it once and store result)
function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StudentTicket() {
  const { ticketId } = useParams();

  const [status, setStatus] = useState({ state: "loading", message: "" });
  const [ticket, setTicket] = useState(null);

  // Student responses (MVP)
  const [mcqSelectionIds, setMcqSelectionIds] = useState([]); // store choice IDs (A/B/C/D), not indexes
  const [shortAnswer, setShortAnswer] = useState("");
  const [confidence, setConfidence] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      try {
        setStatus({ state: "loading", message: "Loading ticket..." });

        if (!ticketId) {
          setStatus({ state: "error", message: "Missing ticket id." });
          return;
        }

        // NOTE: We only read the public doc in student view
        const ref = doc(db, "tickets_public", ticketId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setStatus({ state: "error", message: "Ticket not found." });
          return;
        }

        const data = { id: snap.id, ...snap.data() };

        // Optional: If you want to enforce "live" on client side too
        if (!data.isLive) {
          setStatus({ state: "error", message: "This ticket is not live." });
          return;
        }

        // Block owner from taking their own ticket (teacher device)
        const uid = auth.currentUser?.uid ?? null;
        if (uid && data.ownerId === uid) {
          setStatus({
            state: "blocked",
            message: "You are the owner of this ticket. Open the teacher view instead.",
          });
          return;
        }

        if (!cancelled) {
          setTicket(data);
          setStatus({ state: "ready", message: "" });

          // reset responses when ticket loads
          setMcqSelectionIds([]);
          setShortAnswer("");
          setConfidence(null);
        }
      } catch (err) {
        console.error("StudentTicket load error:", err);

        // Common with rules: Missing or insufficient permissions
        if (!cancelled) {
          setStatus({
            state: "error",
            message:
              "Could not load this ticket (permissions or network issue). Make sure the ticket is live.",
          });
        }
      }
    }

    loadTicket();
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  // Scramble choices once per ticket load (important!)
  const scrambledChoices = useMemo(() => {
    if (!ticket) return [];
    if (ticket.questionType !== "multipleChoice") return [];
    const choices = ticket.publicConfig?.choices ?? [];
    return shuffle(choices);
  }, [ticket?.id]); // only re-shuffle when the ticket changes

  if (status.state === "loading") return <p>{status.message}</p>;

  if (status.state === "error" || status.state === "blocked") {
    return (
      <div>
        <p>{status.message}</p>
      </div>
    );
  }

  // status.state === "ready"
  const questionText = ticket?.questionText ?? "";
  const questionType = ticket?.questionType ?? "";

  return (
    <div>
      <h2>Exit Ticket</h2>

      <div>
        <p>{questionText}</p>
      </div>

      {/* Conditional render by questionType */}
      <div>
        {questionType === "multipleChoice" && (
          <MCQQuestion
            choices={scrambledChoices} // [{id,text}]
            allowMultiple={ticket.publicConfig?.allowMultiple ?? false}
            selectedIds={mcqSelectionIds}
            onChangeSelectedIds={setMcqSelectionIds}
          />
        )}

        {questionType === "shortResponse" && (
          <ShortQuestion value={shortAnswer} onChange={setShortAnswer} />
        )}

        {!["multipleChoice", "shortResponse"].includes(questionType) && (
          <p>Unsupported question type.</p>
        )}
      </div>

      {/* Confidence picker (wire later) */}
      <div style={{ marginTop: 16 }}>
        <ConfidencePicker value={confidence} onChange={setConfidence} />
      </div>

      {/* Next: Submit button to write to submissions subcollection */}
      {/* <button disabled>Submit</button> */}
    </div>
  );
}
