import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1>Exit Ticket Generator</h1>
      <nav style={{ display: "flex", gap: 12 }}>
        <Link to="/teacher/new">Teacher: Build Ticket</Link>
        <Link to="/teacher/live">Teacher: Live Dashboard</Link>
        <Link to="/student/demo-ticket">Student: Demo Ticket</Link>
      </nav>
    </div>
  );
}
