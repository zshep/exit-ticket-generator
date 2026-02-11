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
    <div className="home-container">
      <h1 className="home-title">Exit Ticket Generator</h1>

      <p className="home-subtext">
        Create quick, focused exit tickets and see student understanding in real
        time.
      </p>

      <nav className="home-nav">
        <Link className="primary-link" to="/teacher/new">
          Dashboard
        </Link>
      </nav>
    </div>
  );
}
