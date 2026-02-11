import { useMemo, useState } from "react";
import { db, auth } from "../../services/firebase/firebase";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import MCQEditor from "../TicketBuilder/MCQEditor";
import ShortEditor from "../TicketBuilder/ShortEditor";

export default function QuestionEditor() {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState(""); // empty until selected
  const [shareLink, setShareLink] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });

  // MC Data config
  const [mcqData, setMcqData] = useState({
    allowMultiple: false,
    choices: [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" },
    ],
    correctIds: [],
  });

  const [shortData, setShortData] = useState({
    expectedAnswer: "",
  });

  const isSaving = status.state === "saving";

  const studentUrl = useMemo(() => {
    if (!shareLink) return "";
    return `${window.location.origin}${shareLink}`;
  }, [shareLink]);

  const handleMakeTicket = async () => {
    if (!auth.currentUser) {
      setStatus({
        state: "error",
        message: "Auth not ready yet. Refresh and try again.",
      });
      return;
    }
    if (!questionText.trim()) {
      setStatus({ state: "error", message: "Question text is required." });
      return;
    }
    if (!questionType) {
      setStatus({ state: "error", message: "Pick a question type." });
      return;
    }

    // type-specific validation MC
    if (questionType === "multipleChoice") {
      const anyBlank = mcqData.choices.some((c) => !c.text.trim());
      if (anyBlank) {
        setStatus({
          state: "error",
          message: "Fill out all 4 answer choices.",
        });
        return;
      }
      if (!mcqData.correctIds.length) {
        setStatus({
          state: "error",
          message: "Select at least one correct answer.",
        });
        return;
      }
    }

    // type-specific validation short response
    if (questionType === "shortResponse" && !shortData.expectedAnswer.trim()) {
      setStatus({
        state: "error",
        message: "Enter an expected answer (teacher-only).",
      });
      return;
    }

    setStatus({ state: "saving", message: "Saving ticket..." });

    const uid = auth.currentUser.uid;
    const nextIsLive = false; // closed by default

    const publicDoc = {
      ownerId: uid,
      questionText: questionText.trim(),
      questionType,
      isLive: nextIsLive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publicConfig:
        questionType === "multipleChoice"
          ? {
              allowMultiple: mcqData.allowMultiple,
              choices: mcqData.choices,
            }
          : {},
    };

    const privateDoc = {
      ownerId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      answerKey:
        questionType === "multipleChoice"
          ? { correctIds: mcqData.correctIds }
          : { expectedAnswer: shortData.expectedAnswer?.trim() ?? "" },
    };

    try {
      const publicRef = doc(collection(db, "tickets_public"));
      const ticketId = publicRef.id;
      const privateRef = doc(db, "tickets_private", ticketId);

      await Promise.all([setDoc(publicRef, publicDoc), setDoc(privateRef, privateDoc)]);

      setShareLink(`/student/${ticketId}`);
      setStatus({ state: "success", message: "Ticket created (Closed by default)." });

      // reset form
      setQuestionText("");
      setQuestionType("");
      setMcqData({
        allowMultiple: false,
        choices: [
          { id: "A", text: "" },
          { id: "B", text: "" },
          { id: "C", text: "" },
          { id: "D", text: "" },
        ],
        correctIds: [],
      });
      setShortData({ expectedAnswer: "" });
    } catch (err) {
      console.error("Error saving ticket:", err);
      setStatus({ state: "error", message: "Failed to save ticket." });
    }
  };

  const copyLink = async () => {
    if (!studentUrl) return;
    try {
      await navigator.clipboard.writeText(studentUrl);
      setStatus({ state: "success", message: "Copied student link!" });
      setTimeout(() => setStatus({ state: "idle", message: "" }), 1200);
    } catch (e) {
      console.error(e);
      setStatus({ state: "error", message: "Could not copy link." });
    }
  };

  return (
    <div className="qe">
      <div className="qe-header">
        <h2 className="qe-title">Create Ticket</h2>
        <p className="qe-subtitle">Build a question, then make it live from your ticket list.</p>
      </div>

      <div className="qe-form">
        <div className="qe-field">
          <label className="qe-label">Question</label>
          <textarea
            className="qe-textarea"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question…"
            rows={3}
          />
        </div>

        <div className="qe-field">
          <label className="qe-label">Question Type</label>
          <select
            className="qe-select"
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
          >
            <option value="">Choose…</option>
            <option value="shortResponse">Short Response</option>
            <option value="multipleChoice">Multiple Choice</option>
          </select>
        </div>

        {questionType && (
          <div className="qe-config">
            {questionType === "shortResponse" && (
              <ShortEditor value={shortData} onChange={setShortData} />
            )}

            {questionType === "multipleChoice" && (
              <MCQEditor value={mcqData} onChange={setMcqData} />
            )}
          </div>
        )}
      </div>

      <div className="qe-footer">
        <button className="btn btn-primary" onClick={handleMakeTicket} disabled={isSaving}>
          {isSaving ? "Saving…" : "Generate Ticket"}
        </button>

        {studentUrl && (
          <div className="qe-share">
            <div className="qe-share-row">
              <input className="qe-share-input" value={studentUrl} readOnly />
              <button className="btn btn-secondary" type="button" onClick={copyLink}>
                Copy
              </button>
            </div>
            <p className="qe-hint">Ticket starts as <strong>Closed</strong>. Make it <strong>Live</strong> from the list.</p>
          </div>
        )}

        {status.state !== "idle" && (
          <p className={`qe-status ${status.state}`}>{status.message}</p>
        )}
      </div>
    </div>
  );
}
