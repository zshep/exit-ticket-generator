import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../../services/firebase/firebase";

async function setTicketLive(ticketId, isLive) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Auth not ready");

  const ref = doc(db, "tickets_public", ticketId);
  await updateDoc(ref, {
    isLive,
    updatedAt: serverTimestamp(),
  });
}

async function deleteTicket(ticketId) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Auth not ready");

  // Delete public + private docs (same id)
  const pubRef = doc(db, "tickets_public", ticketId);
  const privRef = doc(db, "tickets_private", ticketId);

  // Order doesn't matter; do both
  await Promise.all([deleteDoc(pubRef), deleteDoc(privRef)]);
}

export default function QuestionList() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState({ state: "loading", message: "" });

  useEffect(() => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      setStatus({ state: "error", message: "Auth not ready yet. Refresh." });
      return;
    }

    setStatus({ state: "loading", message: "Loading your tickets..." });

    const q = query(
      collection(db, "tickets_public"),
      where("ownerId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTickets(rows);
        setStatus({ state: "ready", message: "" });
      },
      (err) => {
        console.error("QuestionList snapshot error:", err);
        setStatus({
          state: "error",
          message: "Failed to load tickets (permissions or network).",
        });
      }
    );

    return () => unsub();
  }, []);

  const copyStudentLink = async (ticketId) => {
    const link = `${window.location.origin}/student/${ticketId}`;
    try {
      await navigator.clipboard.writeText(link);
      setStatus({ state: "ready", message: "Copied student link!" });
      // clear message after a moment (optional)
      setTimeout(() => setStatus({ state: "ready", message: "" }), 1200);
    } catch (e) {
      console.error(e);
      setStatus({ state: "error", message: "Could not copy link." });
    }
  };

  const goTeacherLive = (ticketId) => {
    // Adjust this route to match your app
    // Example: /teacher/live/:ticketId
    navigate(`/teacher/live/${ticketId}`);
  };

  if (status.state === "loading") return <p>{status.message}</p>;

  if (status.state === "error") {
    return (
      <div>
        <p>{status.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h3>Question List</h3>

      {status.message && <p>{status.message}</p>}

      {tickets.length === 0 && <p>No tickets yet.</p>}

      {tickets.map((t) => {
        const isLive = !!t.isLive;
        const typeLabel =
          t.questionType === "multipleChoice"
            ? "MCQ"
            : t.questionType === "shortResponse"
            ? "Short"
            : t.questionType;

        return (
          <div
            key={t.id}
            style={{
              border: "1px solid #ccc",
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0 }}>
                  <strong>{typeLabel}</strong>{" "}
                  {isLive ? "🟢 Live" : "⚪ Draft/Closed"}
                </p>
                <p style={{ marginTop: 6 }}>
                  {t.questionText || <em>(no question text)</em>}
                </p>
                <p style={{ margin: 0, fontSize: 12 }}>
                  <code>{t.id}</code>
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setTicketLive(t.id, !isLive)}
                >
                  {isLive ? "Close Ticket" : "Make Live"}
                </button>

                <button type="button" onClick={() => copyStudentLink(t.id)}>
                  Copy Link
                </button>

                <button type="button" onClick={() => goTeacherLive(t.id)}>
                  Teacher Live View
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const ok = window.confirm(
                      "Delete this ticket? This cannot be undone."
                    );
                    if (!ok) return;

                    try {
                      await deleteTicket(t.id);
                    } catch (err) {
                      console.error(err);
                      setStatus({
                        state: "error",
                        message: "Delete failed (permissions or network).",
                      });
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
