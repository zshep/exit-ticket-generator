import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../services/firebase/firebase"; 
import MCQStats from "../components/Dashboard/MCQStats";
import ShortStats from "../components/Dashboard/ShortStats";




// ---------- component ----------
export default function TeacherLive() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState({
    state: "loading",
    message: "Loading...",
  });

  const [ticket, setTicket] = useState(null); // from tickets_public
  const [answerKey, setAnswerKey] = useState(null); // from tickets_private
  const [submissions, setSubmissions] = useState([]); // from subcollection

  // Load ticket_public + ticket_private once; then subscribe to submissions live
  useEffect(() => {
    let unsubSubmissions = null;

    async function init() {
      try {
        setStatus({ state: "loading", message: "Loading ticket..." });

        const uid = auth.currentUser?.uid;
        if (!uid) {
          setStatus({
            state: "error",
            message: "Auth not ready. Refresh and try again.",
          });
          return;
        }
        if (!ticketId) {
          setStatus({ state: "error", message: "Missing ticketId in route." });
          return;
        }

        // Load public ticket
        const pubRef = doc(db, "tickets_public", ticketId);
        const pubSnap = await getDoc(pubRef);
        if (!pubSnap.exists()) {
          setStatus({ state: "error", message: "Ticket not found." });
          return;
        }
        const pubData = { id: pubSnap.id, ...pubSnap.data() };

        // Enforce ownership in UI too (rules should already enforce)
        if (pubData.ownerId !== uid) {
          setStatus({ state: "error", message: "You do not own this ticket." });
          return;
        }

        // Load private answer key
        const privRef = doc(db, "tickets_private", ticketId);
        const privSnap = await getDoc(privRef);
        const privData = privSnap.exists() ? privSnap.data() : null;

        setTicket(pubData);
        setAnswerKey(privData?.answerKey ?? null);

        // Subscribe to submissions live
        const subQ = query(
          collection(db, "tickets_public", ticketId, "submissions"),
          orderBy("submittedAt", "asc"),
        );

        unsubSubmissions = onSnapshot(
          subQ,
          (snap) => {
            const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setSubmissions(rows);
            setStatus({ state: "ready", message: "" });
          },
          (err) => {
            console.error("submissions onSnapshot error:", err);
            setStatus({
              state: "error",
              message: "Failed to stream submissions (permissions/network).",
            });
          },
        );
      } catch (err) {
        console.error("TeacherLive init error:", err);
        setStatus({ state: "error", message: "Failed to load TeacherLive." });
      }
    }

    init();

    return () => {
      if (unsubSubmissions) unsubSubmissions();
    };
  }, [ticketId]);

  const submissionCount = submissions.length;

  

  

  async function toggleTicketLive() {
    try {
      if (!ticketId) return;
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Auth not ready");

      const next = !ticket?.isLive;

      await updateDoc(doc(db, "tickets_public", ticketId), {
        isLive: next,
        updatedAt: serverTimestamp(),
      });

      // Optimistic UI update (snapshot will confirm)
      setTicket((t) => (t ? { ...t, isLive: next } : t));
    } catch (err) {
      console.error("toggleTicketLive error:", err);
      alert("Failed to update ticket status.");
    }
  }

  if (status.state === "loading") return <p>{status.message}</p>;
  if (status.state === "error") return <p>{status.message}</p>;

  // ready
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ marginBottom: 6 }}>Teacher Live</h2>
          <p style={{ marginTop: 0 }}>
            <strong>Status:</strong> {ticket?.isLive ? "🟢 Live" : "⚪ Closed"}{" "}
            <br />
            <strong>Submissions:</strong> {submissionCount}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <button type="button" onClick={() => navigate("/teacher/new")}>
            Back
          </button>
          <button type="button" onClick={toggleTicketLive}>
            {ticket?.isLive ? "Close Ticket" : "Open Ticket"}
          </button>

          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(
                `${window.location.origin}/student/${ticketId}`,
              )
            }
          >
            Copy Student Link
          </button>
        </div>
      </div>

      <hr />

      <h3 style={{ marginTop: 12 }}>{ticket?.questionText}</h3>

      {/* ---------- SHORT RESPONSE VIEW ---------- */}
      {ticket?.questionType === "shortResponse" && (
       <ShortStats ticket={ticket} submissions={submissions} answerKey={answerKey} />
      )}

      {/* ---------- MCQ VIEW ---------- */}
      {ticket?.questionType === "multipleChoice" && (
     <MCQStats ticket={ticket} submissions={submissions} answerKey={answerKey} />
      )}

      {!["multipleChoice", "shortResponse"].includes(ticket?.questionType) && (
        <p>Unsupported question type: {ticket?.questionType}</p>
      )}
    </div>
  );
}
