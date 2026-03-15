import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { loading, authError } = useAuth();

  if (loading) return <div className="home-container">Loading...</div>;
  if (authError)
    return <div className="home-container">Auth Error: {authError.message}</div>;

  return (
    <div className="home-container">
      <section className="hero-section">
        <h1 className="home-title">Exit Ticket Generator</h1>

        <p className="home-subtext">
          A teacher-focused tool for creating quick exit tickets and reviewing
          student understanding in real time.
        </p>

        <p className="home-subtext secondary-text">
          This version includes a demo dashboard to showcase the core teacher
          workflow. User profiles and saved classrooms are planned for a future
          iteration.
        </p>

        <div className="home-actions">
          <Link className="primary-link" to="/teacher/new">
            Open Demo Dashboard
          </Link>
        </div>
      </section>

      <section className="home-feature-section">
        <h2 className="section-title">What ETG does</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Create exit tickets</h3>
            <p>
              Build quick checks for understanding that are simple to prepare
              and easy to use during class.
            </p>
          </div>

          <div className="feature-card">
            <h3>Share with students</h3>
            <p>
              Provide a simple response flow so students can focus on answering,
              not navigating a complicated tool.
            </p>
          </div>

          <div className="feature-card">
            <h3>Review responses fast</h3>
            <p>
              See results in one place so teachers can quickly decide what to
              reteach, revisit, or move forward on.
            </p>
          </div>
        </div>
      </section>

      <section className="home-note-section">
        <h2 className="section-title">Current demo status</h2>
        <p className="home-subtext">
          The current dashboard is a demonstration environment designed to show
          the main teacher experience. Future versions will include persistent
          user accounts, profile management, and saved classroom data.
        </p>
      </section>
    </div>
  );
}