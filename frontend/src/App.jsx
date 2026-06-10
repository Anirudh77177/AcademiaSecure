import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Admin Module Imports
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCourses from "./pages/AdminCourses";
import AIInsights from "./pages/AIInsights";
import ManageUsers from "./pages/ManageUsers";
import TakeAttendance from "./pages/TakeAttendance";
import CourseInsights from "./pages/CourseInsights";

// Teacher Module Imports
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherCourses from "./pages/TeacherCourses";
import TeacherAttendance from "./pages/TeacherAttendance";
import TeacherStudents from "./pages/TeacherStudents";

// Student Module Imports
import StudentDashboard from "./pages/StudentDashboard";
import StudentCourses from "./pages/StudentCourses";

/**
 * Higher-Order Component: ProtectedRoute
 * Authenticates users and wraps components in smooth fade transitions.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // If unauthorized, redirect to Login
    return <Navigate to="/" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

function App() {
  return (
    <Router>
      <div className="App bg-[#0f111a] min-h-screen font-sans antialiased text-slate-200">
        <AnimatePresence mode="wait">
          <Routes>
            {/* PUBLIC ACCESS */}
            <Route path="/" element={<Login />} />

            {/* 🔐 ADMIN ACCESS GROUP */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute><AdminCourses /></ProtectedRoute>} />
            <Route path="/admin/courses/:courseId" element={<ProtectedRoute><CourseInsights /></ProtectedRoute>} />
            <Route path="/admin/ai-insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
            <Route path="/admin/manage-users" element={<ProtectedRoute><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/take-attendance" element={<ProtectedRoute><TakeAttendance /></ProtectedRoute>} />

            {/* 👨‍🏫 TEACHER ACCESS GROUP */}
            <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/courses" element={<ProtectedRoute><TeacherCourses /></ProtectedRoute>} />
            <Route path="/teacher/attendance" element={<ProtectedRoute><TeacherAttendance /></ProtectedRoute>} />
            <Route path="/teacher/students" element={<ProtectedRoute><TeacherStudents /></ProtectedRoute>} />

            {/* 🎓 STUDENT ACCESS GROUP */}
            <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/courses" element={<ProtectedRoute><StudentCourses /></ProtectedRoute>} />

            {/* FALLBACK: Redirect any junk URLs back to login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;