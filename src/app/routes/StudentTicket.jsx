import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, doc, getDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { db, auth } from "../services/firebase/firebase";

import ConfidencePicker from "../components/Student/ConfidencePicker";
import MCQQuestion from "../components/Student/MCQQuestion";
import ShortQuestion from "../components/Student/ShortQuestion";

// Fisher–Yates shuffle
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

  const [mcqSelectionIds, setMcqSelectionIds] = useState([]);
  const [shortAnswer, setShortAnswer] = useState("");
  const [confidence, setConfidence] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      try {
        setStatus({ state: "loading", message: "Loading ticket..." });

        if (!ticketId) {
          setStatus({ state: "error", message: "Missing ticket id." });
          return;
        }

        const ref = doc(db, "tickets_public", ticketId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setStatus({ state: "error", message: "Ticket not found." });
          return;
        }

        const data = { id: snap.id, ...snap.data() };

        if (!data.isLive) {
          setStatus({ state: "error", message: "This ticket is not live." });
          return;
        }

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

          setMcqSelectionIds([]);
          setShortAnswer("");
          setConfidence(null);
          setIsSubmitting(false);
        }
      } catch (err) {
        console.error("StudentTicket load error:", err);
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

  const scrambledChoices = useMemo(() => {
    if (!ticket) return [];
    if (ticket.questionType !== "multipleChoice") return [];
    const choices = ticket.publicConfig?.choices ?? [];
    return shuffle(choices);
  }, [ticket?.id]);

  if (status.state === "loading") return <p className="page-loading">{status.message}</p>;

  if (status.state === "error" || status.state === "blocked") {
    return (
      <div className="student-page">
        <div className="panel student-panel">
          <h2 className="student-title">Exit Ticket</h2>
          <p className="student-muted">{status.message}</p>
        </div>
      </div>
    );
  }

  if (status.state === "submitted") {
    return (
      <div className="student-page">
        <div className="panel student-panel">
          <h2 className="student-title">Exit Ticket</h2>
          <div className="student-success">{status.message}</div>
        </div>
      </div>
    );
  }

  const questionText = ticket?.questionText ?? "";
  const questionType = ticket?.questionType ?? "";

  const submitHint =
    questionType === "multipleChoice"
      ? "If Submit doesn’t work: pick an answer and choose confidence."
      : questionType === "shortResponse"
      ? "If Submit doesn’t work: type a response and choose confidence."
      : "If Submit doesn’t work: complete the question and choose confidence.";

  const handleSubmit = async () => {
    if (!ticket) return;
    if (isSubmitting) return;

    if (confidence == null) {
      alert("Select your confidence (1–4) before submitting.");
      return;
    }

    if (ticket.questionType === "multipleChoice" && mcqSelectionIds.length === 0) {
      alert("Pick an answer (A–D) before submitting.");
      return;
    }

    if (ticket.questionType === "shortResponse" && !shortAnswer.trim()) {
      alert("Type a response before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const studentId = auth.currentUser?.uid ?? null;

      const submissionPayload = {
        ticketId: ticket.id,
        studentId,
        questionType: ticket.questionType,
        answer: ticket.questionType === "multipleChoice" ? mcqSelectionIds : shortAnswer.trim(),
        confidence,
        submittedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "tickets_public", ticket.id, "submissions"), submissionPayload);

      setStatus({ state: "submitted", message: "Response submitted. Thank you!" });
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit response. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="student-page">
      <div className="panel student-panel">
        <header className="student-header">
          <h2 className="student-title">Exit Ticket</h2>
          <p className="student-muted">Answer the question, then select your confidence.</p>
        </header>

        <hr className="student-divider" />

        <div className="student-question">
          <h3 className="student-question-text student-question-center">{questionText}</h3>

          {questionType === "multipleChoice" && (
            <MCQQuestion
              choices={scrambledChoices}
              allowMultiple={ticket.publicConfig?.allowMultiple ?? false}
              selectedIds={mcqSelectionIds}
              onChangeSelectedIds={setMcqSelectionIds}
            />
          )}

          {questionType === "shortResponse" && (
            <ShortQuestion value={shortAnswer} onChange={setShortAnswer} />
          )}

          {!["multipleChoice", "shortResponse"].includes(questionType) && (
            <p className="student-muted">Unsupported question type.</p>
          )}
        </div>

        <div className="student-confidence">
          <ConfidencePicker value={confidence} onChange={setConfidence} />
        </div>

        <div className="student-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>

          <div className="student-submit-hint">{submitHint}</div>
        </div>
      </div>
    </div>
  );
}
