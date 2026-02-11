import QuestionEditor from "../components/TicketBuilder/QuestionEditor";
import QuestionList from "../components/TicketBuilder/QuestionList";

export default function TeacherNew() {
  return (
    <div className="teacher-page">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Build an exit ticket, then make it live to share with students.
        </p>
      </header>

      <div className="teacher-grid">
        <section className="panel">
          <h2 className="panel-title">Question Editor</h2>
          <QuestionEditor />
        </section>

        <section className="panel">
          <h2 className="panel-title">Your Tickets</h2>
          <QuestionList />
        </section>
      </div>
    </div>
  );
}
