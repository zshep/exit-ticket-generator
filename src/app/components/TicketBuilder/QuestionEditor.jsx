import { useState } from "react";
import { db, auth } from "../../services/firebase/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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
    if (!questionText.trim()) {
      setStatus({ state: "error", message: "Question text is required." });
      return;
    }
    if (!questionType) {
      setStatus({ state: "error", message: "Pick a question type." });
      return;
    }

    // guard against empty MC options/ answer
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

    //guard against empty short Answer response
    if (questionType === "shortResponse" && !shortData.expectedAnswer.trim()) {
      setStatus({
        state: "error",
        message: "Enter an expected answer (teacher-only).",
      });
      return;
    }

    setStatus({ state: "saving", message: "Saving ticket..." });

    const nextIsLive = true;

    const ticketPayload = {
      questionText: questionText.trim(),
      questionType,
      isLive: nextIsLive,
      ownerId: auth.currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      config: questionType === "multipleChoice" ? mcqData : shortData,
    };

    try {
      if (!auth.currentUser) {
        setStatus({
          state: "error",
          message: "Auth not ready yet. Refresh and try again.",
        });
        return;
      }

      const docRef = await addDoc(collection(db, "tickets"), ticketPayload);

      const ticketId = docRef.id;

      setIsLive(nextIsLive);
      setStatus({
        state: "success",
        message: `Ticket saved! Ticket ID: ${ticketId}`,
      });

      // student route to share
      const studentPath = `/student/${ticketId}`;
      console.log("Share this link:", studentPath);

      // clear question data after success
      setQuestionText("");
      setQuestionType("");
      setMcqData({ choices: ["", "", "", ""], correctIndex: null });
      setShortData({});

      // optional: store it in state to display + copy button
      setShareLink(studentPath);
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

      {isLive && <p>This ticket is live.</p>}

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
