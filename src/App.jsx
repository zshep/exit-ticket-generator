import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./app/routes/Home.jsx";
import TeacherNew from "./app/routes/TeacherNew.jsx";
import TeacherLive from "./app/routes/TeacherLive.jsx";
import StudentTicket from "./app/routes/StudentTicket.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teacher/new" element={<TeacherNew />} />
        <Route path="/teacher/live" element={<TeacherLive />} />
        <Route path="/student/:ticketId" element={<StudentTicket />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
