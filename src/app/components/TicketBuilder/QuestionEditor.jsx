import { useState } from "react";
import { db, auth } from "../../services/firebase/firebase";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import MCQEditor from "../TicketBuilder/MCQEditor";
import ShortEditor from "../TicketBuilder/ShortEditor";

export default function QuestionEditor() {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState(""); // empty until selected
  const [isLive, setIsLive] = useState(false);
  const [shareLink, setShareLink] = useState("");

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

  const [status, setStatus] = useState({ state: "idle", message: "" });

  

 

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

    /// type-specific validation short response
    if (questionType === "shortResponse" && !shortData.expectedAnswer.trim()) {
      setStatus({
        state: "error",
        message: "Enter an expected answer (teacher-only).",
      });
      return;
    }

    setStatus({ state: "saving", message: "Saving ticket..." });

    const uid = auth.currentUser.uid;
    const nextIsLive = false; //draft by default 

    // Build public doc (student-readable)
    const publicDoc = {
      ownerId: uid,
      questionText: questionText.trim(),
      questionType,
      isLive: nextIsLive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

      // public doc for students only, no answers
      publicConfig:
        questionType === "multipleChoice"
          ? {
              allowMultiple: mcqData.allowMultiple,
              choices: mcqData.choices, // [{id, text}]
            }
          : {},
    };

    // Build private doc (teacher-only answer key)
    const privateDoc = {
      ownerId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

      // Teacher-only info
      answerKey:
        questionType === "multipleChoice"
          ? { correctIds: mcqData.correctIds }
          : { expectedAnswer: shortData.expectedAnswer?.trim() ?? "" },
    };

    try {
      // Create a ticketId first so both docs share the same ID
      const publicRef = doc(collection(db, "tickets_public")); // auto id - fireStore native
      const ticketId = publicRef.id;

      const privateRef = doc(db, "tickets_private", ticketId);

      await Promise.all([
        setDoc(publicRef, publicDoc),
        setDoc(privateRef, privateDoc),
      ]);

      setIsLive(nextIsLive);
      setShareLink(`/student/${ticketId}`);

      setStatus({
        state: "success",
        message: `Ticket published! Ticket ID: ${ticketId}`,
      });

      // Clear form state (keep shareLink so they can copy)
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

  return (
    <div>
      <h2>Create New Exit Ticket</h2>

      <div>
        <label>Question</label>
        <input
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Type your question..."
        />
      </div>

      <div>
        <label>Select Question Type</label>
        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
        >
          <option value="">-- choose --</option>
          <option value="shortResponse">Short Response</option>
          <option value="multipleChoice">Multiple Choice</option>
        </select>
      </div>

      <div>
        {questionType === "shortResponse" && (
          <ShortEditor value={shortData} onChange={setShortData} />
        )}

        {questionType === "multipleChoice" && (
          <MCQEditor value={mcqData} onChange={setMcqData} />
        )}
      </div>

      <button onClick={handleMakeTicket} disabled={status.state === "saving"}>
        {status.state === "saving" ? "Saving..." : "Generate Ticket"}
      </button>

      {status.state !== "idle" && <p>{status.message}</p>}

      {isLive && <p>This ticket is NOT live.</p>}

      {shareLink && (
        <div>
          <p>Student link:</p>
          <code>{shareLink}</code>
          <button
            onClick={() =>
              navigator.clipboard.writeText(window.location.origin + shareLink)
            }
          >
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
