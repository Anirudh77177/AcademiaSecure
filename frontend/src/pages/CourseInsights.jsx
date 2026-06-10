import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronLeft, Brain, CheckCircle2, LayoutDashboard, Users, 
  CheckCircle, BookOpen, LogOut, Loader2, UserPlus, Trash2, 
  X, Search, TrendingUp, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CourseInsights = () => {
  const { courseId } = useParams(); 
  const navigate = useNavigate();
  
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enrollment Orchestration States
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [enrolling, setEnrolling] = useState(false);

  // Helper: Secure API Configuration
  const getAuthConfig = () => {
      const token = localStorage.getItem('token');
      return { headers: { Authorization: `Bearer ${token}` } };
  };

  /**
   * Analytics Retrieval:
   * Fetches section-wise telemetry and identifies student risk profiles.
   */
  const fetchInsights = async () => {
      try {
          const res = await axios.get(`http://localhost:5000/api/insights/course/${courseId}`, getAuthConfig());
          setCourseData({
              courseCode: courseId,
              courseName: `${courseId} Analytics`,
              totalStudents: res.data.students.length,
              avgAttendance: res.data.avgAttendance,
              students: res.data.students 
          });
      } catch (err) {
          if (err.response?.status === 401) {
              navigate('/');
          }
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => { fetchInsights(); }, [courseId]);

  // Modal Logic: Student Registry Hydration
  const openEnrollModal = async () => {
      setShowEnrollModal(true);
      try {
          const res = await axios.get('http://localhost:5000/api/users/all', getAuthConfig());
          const enrolledIds = courseData.students.map(s => s._id);
          const available = res.data.filter(u => u.role === 'student' && !enrolledIds.includes(u._id));
          setAllStudents(available);
      } catch (err) {
          console.error("Telemetry Error: Failed to hydrate student registry.");
      }
  };

  const toggleSelection = (id) => {
      setSelectedStudents(prev => 
          prev.includes(id) ? prev.filter(studentId => studentId !== id) : [...prev, id]
      );
  };

  const handleEnrollment = async () => {
      if (selectedStudents.length === 0) return;
      setEnrolling(true);
      try {
          await axios.post('http://localhost:5000/api/courses/enroll', {
              courseCode: courseId,
              studentIds: selectedStudents
          }, getAuthConfig());
          setShowEnrollModal(false);
          setSelectedStudents([]);
          fetchInsights(); 
      } catch (err) {
          alert("State Error: Enrollment synchronization failed.");
      } finally {
          setEnrolling(false);
      }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
      if (window.confirm(`Unenroll ${studentName} from this curriculum?`)) {
          try {
              await axios.post('http://localhost:5000/api/courses/unenroll', {
                  courseCode: courseId,
                  studentId: studentId
              }, getAuthConfig());
              fetchInsights();
          } catch (err) {
              alert("State Error: Unenrollment failed.");
          }
      }
  };

  const filteredAvailableStudents = allStudents.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.id && s.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.section && s.section.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading || !courseData) return (
    <div className="flex flex-col h-screen bg-[#0b0e14] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing AI Analytics...</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0b0e14] text-slate-200 font-sans text-left selection:bg-blue-500/30">
      
      {/* ENTERPRISE NAVIGATION */}
      <aside className="hidden lg:flex w-72 border-r border-white/5 p-8 flex-col justify-between bg-[#0b0e14] sticky top-0 h-screen shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-xl shadow-blue-600/20"><Brain size={26} className="text-white"/></div>
            <h1 className="text-2xl font-black tracking-tighter text-white">Academia<span className="text-blue-500">AI</span></h1>
          </div>
          <nav className="space-y-1.5">
            <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => navigate('/admin')} />
            <NavItem icon={<Users size={20}/>} label="Manage Users" onClick={() => navigate('/admin/manage-users')} />
            <NavItem icon={<CheckCircle size={20}/>} label="Attendance Hub" onClick={() => navigate('/admin/take-attendance')} />
            <NavItem icon={<BookOpen size={20}/>} label="Courses" active />
            <NavItem icon={<Brain size={20}/>} label="AI Insights" onClick={() => navigate('/admin/ai-insights')} />
          </nav>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-slate-500 hover:text-red-400 p-4 transition-all group">
          <LogOut size={20}/> <span className="font-bold text-sm">Sign Out</span>
        </button>
      </aside>

      {/* VIEWPORT CONTENT */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto relative max-w-[1600px] mx-auto w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white transition-all mb-8 text-[11px] font-black uppercase tracking-widest">
          <ChevronLeft size={16}/> Return to Curriculum
        </button>

        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-12">
            <div className="text-left">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-blue-600/10 text-blue-500 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/10">{courseData.courseCode}</span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Real-time Telemetry</span>
                    </div>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter mb-3">{courseData.courseName}</h1>
                <p className="text-slate-500 font-medium text-lg italic">Predictive academic modelling and engagement metrics.</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
                <button onClick={openEnrollModal} className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white/5 border border-white/5 hover:border-blue-500/30 text-slate-300 font-bold px-6 py-4 rounded-2xl transition-all shadow-xl active:scale-95">
                    <UserPlus size={18} className="text-blue-500"/> Assign Students
                </button>
                <button onClick={() => navigate('/admin/take-attendance')} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95">
                    Initialize Attendance
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-20">
            {/* Left: AI Performance Analytics Card */}
            <div className="xl:col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-[#1c152e] to-[#0b0e14] p-8 rounded-[40px] border border-purple-500/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Brain size={120} className="text-purple-500"/></div>
                    <div className="relative z-10 text-left">
                        <div className="flex items-center gap-3 mb-8 text-purple-400">
                            <Brain size={24}/> <h3 className="font-black uppercase tracking-[0.2em] text-xs">AI Analytical Insight</h3>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">
                            Synthesizing engagement data for <span className="text-white font-bold">{courseData.totalStudents} profiles</span>. Institutional average currently tracks at <span className="text-purple-400 font-black text-lg">{courseData.avgAttendance}%</span>.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Engagement</p>
                                <p className={`text-3xl font-black ${courseData.avgAttendance < 75 ? 'text-red-500' : 'text-blue-500'}`}>{courseData.avgAttendance}%</p>
                            </div>
                            <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Health Vector</p>
                                <p className={`text-sm font-black uppercase tracking-widest mt-1 ${courseData.avgAttendance < 75 ? 'text-red-500' : 'text-emerald-500'}`}>{courseData.avgAttendance < 75 ? 'Critical' : 'Stable'}</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <h4 className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase mb-5 tracking-[0.2em]"><TrendingUp size={14} className="text-purple-500"/> Recommended Action</h4>
                            <div className="space-y-3">
                                {courseData.avgAttendance < 75 ? (
                                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-3">
                                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-red-200/70 font-medium leading-relaxed uppercase tracking-wider">Execute mass notification protocol: High-risk attendance threshold reached.</p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
                                        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-emerald-200/70 font-medium leading-relaxed uppercase tracking-wider">KPIs tracking optimally. Maintain current curriculum pacing.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Detailed Roster Table */}
            <div className="xl:col-span-2 bg-[#121421] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-xl font-black text-white tracking-tight">Student Roster <span className="text-slate-600 ml-2">({courseData.students.length})</span></h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#0b0e14] rounded-lg border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Live Data Feed
                    </div>
                </div>
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-[#0b0e14] text-[9px] font-black text-slate-600 uppercase tracking-[0.25em]">
                            <tr>
                                <th className="px-8 py-6">Identity</th>
                                <th className="px-8 py-6">Section</th>
                                <th className="px-8 py-6">Engagement %</th>
                                <th className="px-8 py-6">Est. Grade</th>
                                <th className="px-8 py-6 text-right pr-12">Registry Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {courseData.students.length > 0 ? courseData.students.map((student) => (
                                <tr key={student._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-white tracking-tight text-sm">{student.name}</div>
                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1.5">{student.id}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase">
                                            Sec {student.section || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 h-1.5 bg-[#0b0e14] rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${student.att < 75 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} style={{ width: `${student.att}%` }}></div>
                                            </div>
                                            <span className={`text-xs font-black ${student.att < 75 ? 'text-red-500' : 'text-slate-300'}`}>{student.att}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-black text-slate-300 uppercase tracking-widest">{student.grade}</td>
                                    <td className="px-8 py-6 text-right pr-12">
                                        <button 
                                            onClick={() => handleRemoveStudent(student._id, student.name)}
                                            className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                                            title="Unenroll Profile"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="text-center py-32 text-slate-600 font-bold italic text-sm tracking-tight">Registry is currently empty. Initialize enrollment via "Assign Students".</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </main>

      {/* ENROLLMENT DIALOG (WIZARD LOOK) */}
      <AnimatePresence>
      {showEnrollModal && (
        <div className="fixed inset-0 bg-[#05060a]/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#161a26] border border-white/5 rounded-[40px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-white tracking-tighter">Profile Assignment</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Enrollment for {courseData?.courseCode}</p>
                </div>
                <button onClick={() => {setShowEnrollModal(false); setSelectedStudents([]);}} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={20} /></button>
            </div>

            <div className="p-6 border-b border-white/5 bg-[#0b0e14]/50 shrink-0 group">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search Identity by Name, ID, or Section cluster..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#161a26] border border-white/5 text-white rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-blue-500 transition-all font-bold text-sm placeholder-slate-700"
                    />
                </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                {allStudents.length === 0 ? (
                    <p className="text-center text-slate-600 py-20 font-bold italic">Roster contains no unassigned students.</p>
                ) : filteredAvailableStudents.length === 0 ? (
                    <p className="text-center text-slate-600 py-20 font-bold italic text-sm tracking-tight">Zero matches found for query: "{searchQuery}"</p>
                ) : (
                    filteredAvailableStudents.map(student => (
                        <div 
                            key={student._id} 
                            onClick={() => toggleSelection(student._id)}
                            className={`flex items-center gap-5 p-5 rounded-[24px] border cursor-pointer transition-all ${
                                selectedStudents.includes(student._id) ? 'bg-blue-600/10 border-blue-500/30' : 'bg-[#0b0e14] border-white/5 hover:border-white/10'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedStudents.includes(student._id) ? 'border-blue-500 bg-blue-500 shadow-lg shadow-blue-500/30' : 'border-slate-700'}`}>
                                {selectedStudents.includes(student._id) && <CheckCircle2 size={14} className="text-white"/>}
                            </div>
                            <div className="flex-1 flex justify-between items-center text-left">
                                <div>
                                    <h4 className="font-bold text-white text-base tracking-tight">{student.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{student.department || 'General'} • {student.id}</p>
                                </div>
                                <span className="bg-white/5 text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest border border-white/5">SEC {student.section || 'N/A'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-8 border-t border-white/5 shrink-0 bg-white/5 flex justify-between items-center">
                <div className="text-left">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Selection Queue</p>
                    <p className="text-xl font-black text-blue-500 tracking-tighter">{selectedStudents.length} Profiles</p>
                </div>
                <button 
                    onClick={handleEnrollment}
                    disabled={selectedStudents.length === 0 || enrolling}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-600/30 transition-all disabled:opacity-30 flex items-center gap-3 active:scale-95"
                >
                    {enrolling ? <Loader2 className="animate-spin" size={18}/> : <UserPlus size={18}/>}
                    {enrolling ? 'Synchronizing...' : 'Initialize Enrollment'}
                </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};

// Reusable Atoms
const NavItem = ({ icon, label, active = false, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-bold ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    {icon} <span className="text-sm tracking-tight">{label}</span>
  </button>
);

export default CourseInsights;