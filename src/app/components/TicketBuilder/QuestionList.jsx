import { useEffect, useMemo, useState } from "react";
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
import { db } from "../../services/firebase/firebase";
import { useAuth } from "../../context/AuthContext";

async function setTicketLive(uid, ticketId, isLive) {
  if (!uid) throw new Error("Auth not ready");

  const ref = doc(db, "tickets_public", ticketId);
  await updateDoc(ref, {
    isLive,
    updatedAt: serverTimestamp(),
  });
}

async function deleteTicket(uid, ticketId) {
  if (!uid) throw new Error("Auth not ready");

  const pubRef = doc(db, "tickets_public", ticketId);
  const privRef = doc(db, "tickets_private", ticketId);

  await Promise.all([deleteDoc(pubRef), deleteDoc(privRef)]);
}

export default function QuestionList() {
  const navigate = useNavigate();
  const { uid, loading, authError } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [toast, setToast] = useState(""); // for "Copied!" etc.
  const [error, setError] = useState(""); // for snapshot/delete errors
  const [filter, setFilter] = useState("all"); // "all" | "live" | "closed"

  useEffect(() => {
    if (loading || authError || !uid) return;

    setError("");

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
      },
      (err) => {
        console.error("QuestionList snapshot error:", err);
        setError("Failed to load tickets (permissions or network).");
      }
    );

    return () => unsub();
  }, [uid, loading, authError]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1200);
  };

  const copyStudentLink = async (ticketId) => {
    const link = `${window.location.origin}/student/${ticketId}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast("Copied student link!");
    } catch (e) {
      console.error(e);
      setError("Could not copy link.");
    }
  };

  const goTeacherLive = (ticketId) => {
    navigate(`/teacher/live/${ticketId}`);
  };

  const counts = useMemo(() => {
    const live = tickets.filter((t) => !!t.isLive).length;
    const closed = tickets.length - live;
    return { all: tickets.length, live, closed };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (filter === "live") return tickets.filter((t) => !!t.isLive);
    if (filter === "closed") return tickets.filter((t) => !t.isLive);
    return tickets;
  }, [tickets, filter]);

  if (loading) return <p>Loading…</p>;
  if (authError) return <p>Auth Error: {authError.message}</p>;
  if (!uid) return <p>Loading…</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      {/* Toolbar */}
      <div className="list-toolbar">
        <div className="list-toolbar-left">
          <h3 className="list-title">Tickets</h3>

          <div className="pill-row" role="tablist" aria-label="Ticket filters">
            <button
              type="button"
              className={`pill ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All <span className="pill-count">{counts.all}</span>
            </button>

            <button
              type="button"
              className={`pill ${filter === "live" ? "active" : ""}`}
              onClick={() => setFilter("live")}
            >
              Live <span className="pill-count">{counts.live}</span>
            </button>

            <button
              type="button"
              className={`pill ${filter === "closed" ? "active" : ""}`}
              onClick={() => setFilter("closed")}
            >
              Closed <span className="pill-count">{counts.closed}</span>
            </button>
          </div>
        </div>

        <div className="list-toolbar-right">
          {toast && <div className="toolbar-message">{toast}</div>}
        </div>
      </div>

      {tickets.length === 0 && <p>No tickets yet.</p>}

      {filteredTickets.length === 0 && tickets.length > 0 && (
        <p style={{ marginTop: 10, color: "#6b7280" }}>
          No tickets match that filter.
        </p>
      )}

      {filteredTickets.map((t) => {
        const isLive = !!t.isLive;
        const typeLabel =
          t.questionType === "multipleChoice"
            ? "MCQ"
            : t.questionType === "shortResponse"
            ? "Short"
            : t.questionType;

        return (
          <div key={t.id} className="ticket-card">
            <div className="ticket-main">
              <div className="ticket-meta">
                <div className="ticket-type">{typeLabel}</div>
                <div className={`ticket-status ${isLive ? "live" : "closed"}`}>
                  {isLive ? "Live" : "Closed"}
                </div>
              </div>

              <p className="ticket-question">
                {t.questionText || <em>(no question text)</em>}
              </p>

              <p className="ticket-id">
                <code>{t.id}</code>
              </p>
            </div>

            <div className="ticket-actions">
              <button
                className={`btn ${isLive ? "btn-secondary" : "btn-primary"}`}
                type="button"
                onClick={async () => {
                  try {
                    await setTicketLive(uid, t.id, !isLive);
                    showToast(!isLive ? "Ticket is now Live." : "Ticket closed.");
                  } catch (e) {
                    console.error(e);
                    setError("Update failed (permissions or network).");
                  }
                }}
              >
                {isLive ? "Close Ticket" : "Make Live"}
              </button>

              <button className="btn btn-secondary" type="button" onClick={() => copyStudentLink(t.id)}>
                Copy Link
              </button>

              <button className="btn btn-secondary" type="button" onClick={() => goTeacherLive(t.id)}>
                Teacher Live View
              </button>

              <button
                className="btn btn-danger"
                type="button"
                onClick={async () => {
                  const ok = window.confirm("Delete this ticket? This cannot be undone.");
                  if (!ok) return;

                  try {
                    await deleteTicket(uid, t.id);
                    showToast("Ticket deleted.");
                  } catch (e) {
                    console.error(e);
                    setError("Delete failed (permissions or network).");
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
