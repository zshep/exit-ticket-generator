import { useEffect, useMemo, useState } from "react";
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
import { db } from "../services/firebase/firebase";
import { useAuth } from "../context/AuthContext";

import MCQStats from "../components/Dashboard/MCQStats";
import ShortStats from "../components/Dashboard/ShortStats";

export default function TeacherLive() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { uid, loading: authLoading, authError } = useAuth();

  const [status, setStatus] = useState({
    state: "loading",
    message: "Loading...",
  });
  const [ticket, setTicket] = useState(null);
  const [answerKey, setAnswerKey] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // Always compute these (safe defaults) BEFORE early returns
  const submissionCount = submissions.length;

  const studentLink = useMemo(() => {
    if (!ticketId) return "";
    return `${window.location.origin}/student/${ticketId}`;
  }, [ticketId]);

  const correctSummary = useMemo(() => {
    const total = submissions.length;

    // default (safe during loading)
    if (!ticket) return { correctCount: 0, total, pct: 0 };

    if (ticket.questionType === "multipleChoice") {
      const correctIds = (answerKey?.correctIds ?? []).map(String);
      const correctSet = new Set(correctIds);

      const setsEqual = (a, b) => {
        if (a.size !== b.size) return false;
        for (const x of a) if (!b.has(x)) return false;
        return true;
      };

      let correctCount = 0;
      for (const s of submissions) {
        const ansArr = Array.isArray(s.answer) ? s.answer.map(String) : [];
        const ansSet = new Set(ansArr);
        if (correctSet.size > 0 && setsEqual(ansSet, correctSet))
          correctCount += 1;
      }

      const pct = total ? Math.round((correctCount / total) * 100) : 0;
      return { correctCount, total, pct };
    }

    if (ticket.questionType === "shortResponse") {
      const normalize = (s) =>
        (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
      const expected = normalize(answerKey?.expectedAnswer ?? "");
      if (!expected) return { correctCount: 0, total, pct: 0 };

      let correctCount = 0;
      for (const s of submissions) {
        const ans = normalize(String(s.answer ?? ""));
        if (ans && ans === expected) correctCount += 1;
      }

      const pct = total ? Math.round((correctCount / total) * 100) : 0;
      return { correctCount, total, pct };
    }

    return { correctCount: 0, total, pct: 0 };
  }, [ticket, answerKey, submissions]);

  useEffect(() => {
    let unsubSubmissions = null;

    async function init() {
      try {
        if (authLoading) return;

        if (authError) {
          setStatus({
            state: "error",
            message: `Auth Error: ${authError.message}`,
          });
          return;
        }

        if (!uid) {
          setStatus({ state: "loading", message: "Loading..." });
          return;
        }

        if (!ticketId) {
          setStatus({ state: "error", message: "Missing ticketId in route." });
          return;
        }

        setStatus({ state: "loading", message: "Loading ticket..." });

        const pubRef = doc(db, "tickets_public", ticketId);
        const pubSnap = await getDoc(pubRef);

        if (!pubSnap.exists()) {
          setStatus({ state: "error", message: "Ticket not found." });
          return;
        }

        const pubData = { id: pubSnap.id, ...pubSnap.data() };

        if (pubData.ownerId !== uid) {
          setStatus({ state: "error", message: "You do not own this ticket." });
          return;
        }

        const privRef = doc(db, "tickets_private", ticketId);
        const privSnap = await getDoc(privRef);
        const privData = privSnap.exists() ? privSnap.data() : null;

        setTicket(pubData);
        setAnswerKey(privData?.answerKey ?? null);

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
  }, [ticketId, uid, authLoading, authError]);

  async function toggleTicketLive() {
    try {
      if (!ticketId || !uid) return;

      const next = !ticket?.isLive;

      await updateDoc(doc(db, "tickets_public", ticketId), {
        isLive: next,
        updatedAt: serverTimestamp(),
      });

      setTicket((t) => (t ? { ...t, isLive: next } : t));
    } catch (err) {
      console.error("toggleTicketLive error:", err);
      alert("Failed to update ticket status.");
    }
  }

  const copyStudentLink = async () => {
    try {
      await navigator.clipboard.writeText(studentLink);
      setStatus((s) => ({ ...s, message: "Copied student link!" }));
      setTimeout(() => setStatus((s) => ({ ...s, message: "" })), 1200);
    } catch (e) {
      console.error(e);
      alert("Could not copy link.");
    }
  };

  // now safe to early return (all hooks already ran)
  if (status.state === "loading") return <p>{status.message}</p>;
  if (status.state === "error") return <p>{status.message}</p>;

  return (
    <div className="tl">
      <header className="tl-header">
        <h2 className="tl-title">Teacher Live</h2>

        <div className="tl-controls">
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={() => navigate("/teacher/new")}
          >
            Back
          </button>

          <button
            className={`btn btn-sm ${ticket?.isLive ? "btn-secondary" : "btn-primary"}`}
            type="button"
            onClick={toggleTicketLive}
          >
            {ticket?.isLive ? "Close Ticket" : "Open Ticket"}
          </button>

          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={copyStudentLink}
          >
            Copy Student Link
          </button>
        </div>

        {status.message && <div className="tl-toast">{status.message}</div>}
      </header>

      <hr className="tl-divider" />

      <div className="tl-question">
        <h3 className="tl-question-text">{ticket?.questionText}</h3>

        <div className="tl-summary">
          <div className="summary-card">
            <div className="summary-label">Status</div>
            <div className="summary-value">
              <span
                className={`status-dot ${ticket?.isLive ? "live" : "closed"}`}
              />
              {ticket?.isLive ? "Live" : "Closed"}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Submissions</div>
            <div className="summary-value">{submissionCount}</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Correct</div>
            <div className="summary-value">
              {correctSummary.correctCount} / {correctSummary.total} (
              {correctSummary.pct}%)
            </div>
          </div>
        </div>
      </div>

      <div className="tl-content">
        {ticket?.questionType === "shortResponse" && (
          <ShortStats
            ticket={ticket}
            submissions={submissions}
            answerKey={answerKey}
          />
        )}

        {ticket?.questionType === "multipleChoice" && (
          <MCQStats
            ticket={ticket}
            submissions={submissions}
            answerKey={answerKey}
          />
        )}

        {!["multipleChoice", "shortResponse"].includes(
          ticket?.questionType,
        ) && <p>Unsupported question type: {ticket?.questionType}</p>}
      </div>
    </div>
  );
}
