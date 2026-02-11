import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function Home() {
  const { uid, loading, authError, user } = useAuth();

  useEffect(() => {
    console.log("we have a new anonymous user");
    //console.log("user", user);
  }, [user]);

  if (loading) return <div>loading...</div>;
  if (authError) return <div> Auth Error: {authError.message}</div>;

  return (
    <div>
      <h1>Exit Ticket Generator</h1>

      <p>UID: {uid} </p>
      <p> Anonymous? {String(user?.isAnonymous)}</p>

      <nav style={{ display: "flex", gap: 12 }}>
        <Link to="/teacher/new">Teacher: Build Ticket</Link>
        <Link to="/teacher/live/:ticketId">Teacher: Live Dashboard</Link>
        <Link to="/student/demo-ticket">Student: Demo Ticket</Link>
        
      </nav>
    </div>
  );
}
