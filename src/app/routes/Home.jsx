import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function Home() {
  const { uid, loading, authError } = useAuth();

  useEffect(() => {
    console.log("we have a new anonymous user");
    console.log("user", uid);
  }, [uid]);

  if (loading) return <div>loading...</div>;
  if (authError) return <div> Auth Error: {authError.message}</div>;

  return (
    <div>
      <h1>Exit Ticket Generator</h1>

      
      <p> Welcome! To start building an Exit Ticket, click on the Exit Ticket Dashboard</p>

      <nav style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <Link to="/teacher/new"> Exit Ticket Dashboard</Link>
        
        
      </nav>
    </div>
  );
}
