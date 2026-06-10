import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, CheckSquare, BookOpen, Users, 
  Brain, LogOut, Search, Mail, AlertTriangle, ShieldCheck, Loader2, Download, ChevronRight 
} from 'lucide-react';

const TeacherStudents = () => {
  const navigate = useNavigate();
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const teacherEmail = localStorage.getItem('email');
  const token = localStorage.getItem('token');

  /**
   * Data Ingestion:
   * Fetches aggregated student metrics mapped to the authenticated faculty's curriculum.
   */
  useEffect(() => {
    const fetchStudents = async () => {
      if (!teacherEmail) return;
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/teacher-students-stats/${teacherEmail}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setStudentsData(res.data);
      } catch (err) {
        console.error("Telemetry Error: Failed to retrieve student performance matrix.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [teacherEmail, token]);

  const downloadReport = () => {
    if (studentsData.length === 0) return;
    const headers = ["Student Name", "System ID", "Course", "Attendance %", "Total Classes", "Present Classes", "Risk Status"];
    const rows = filteredStudents.map(s => [s.name, s.id, s.course, `${s.attendance}%`, s.totalClasses, s.presentClasses, s.risk]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Faculty_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = studentsData.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'high') return matchesSearch && s.attendance < 75 && s.totalClasses > 0;
    if (filterType === 'low') return matchesSearch && (s.attendance >= 75 || s.totalClasses === 0);
    return matchesSearch;
  });

  const lowAttendanceCount = studentsData.filter(s => s.attendance < 75 && s.totalClasses > 0).length;
  const goodAttendanceCount = studentsData.length - lowAttendanceCount;

  if (loading) return (
    <div className="flex flex-col h-screen bg-[#0b0e14] items-center justify-center">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Processing Risk Matrix...</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0b0e14] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* PERSISTENT SIDEBAR */}
      <aside className="hidden lg:flex w-72 bg-[#0f111a] border-r border-white/5 flex-col shrink-0 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20"><Brain className="text-white w-6 h-6" /></div>
          <h1 className="text-2xl font-black text-white tracking-tighter">Academia<span className="text-blue-500">AI</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-8">
          <NavItem icon={<LayoutDashboard size={20} />} label="Operational Hub" onClick={() => navigate('/teacher')} />
          <NavItem icon={<CheckSquare size={20} />} label="Manual Logging" onClick={() => navigate('/teacher/attendance')} />
          <NavItem icon={<BookOpen size={20} />} label="Course Catalog" onClick={() => navigate('/teacher/courses')} />
          <NavItem icon={<Users size={20} />} label="Student Registry" isActive={true} />
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-slate-500 hover:text-red-400 w-full p-4 font-bold transition-all hover:bg-red-400/5 rounded-2xl group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> <span className="text-xs uppercase tracking-widest font-black">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* VIEWPORT CONTENT */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-[#0b0e14] custom-scrollbar">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 mb-12">
          <div className="text-left">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">Risk Radar Analytics</h1>
            <p className="text-slate-500 font-medium text-lg italic">Granular performance tracking and student vulnerability assessment.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center w-full xl:w-auto">
            <button onClick={downloadReport} className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white text-black hover:bg-slate-200 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95">
              <Download size={16} /> Export Archive
            </button>

            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                <button onClick={() => setFilterType('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}>Cumulative</button>
                <button onClick={() => setFilterType('high')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'high' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-slate-300'}`}>Vulnerable</button>
            </div>

            <div className="relative flex-1 sm:w-80 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input type="text" placeholder="Filter Identity or Unit..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#161925] border border-white/5 rounded-[22px] py-4 pl-14 pr-6 focus:outline-none focus:border-blue-600 text-sm text-white font-bold transition-all placeholder-slate-700" />
            </div>
          </div>
        </header>

        {/* ANALYTICS SUMMARY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-10 rounded-[48px] flex justify-between items-center group hover:bg-emerald-500/10 transition-all shadow-2xl">
                <div className="text-left">
                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Stable Profiles</p>
                    <h3 className="text-5xl font-black text-white tracking-tighter">{goodAttendanceCount} <span className="text-lg text-emerald-500/50 uppercase ml-1">Students</span></h3>
                </div>
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500"><ShieldCheck className="text-emerald-500" size={40}/></div>
            </div>
            <div className="bg-red-500/5 border border-red-500/10 p-10 rounded-[48px] flex justify-between items-center group hover:bg-red-500/10 transition-all shadow-2xl">
                <div className="text-left">
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Critical Alerts</p>
                    <h3 className="text-5xl font-black text-white tracking-tighter">{lowAttendanceCount} <span className="text-lg text-red-500/50 uppercase ml-1">Students</span></h3>
                </div>
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 animate-pulse"><AlertTriangle className="text-red-500" size={40}/></div>
            </div>
        </div>

        {/* DATA MATRIX */}
        <div className="bg-[#121421] border border-white/5 rounded-[48px] overflow-hidden shadow-2xl mb-20 relative">
          <div className="p-8 border-b border-white/5 bg-white/5 text-left">
              <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                  <Users className="text-blue-500" size={24}/> Registry Data Streams
              </h3>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0b0e14] text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
                <tr>
                  <th className="px-10 py-7">Identity Identifier</th>
                  <th className="px-10 py-7">Academic Unit</th>
                  <th className="px-10 py-7">Engagement Metric</th>
                  <th className="px-10 py-7">Risk Vector</th>
                  <th className="px-10 py-7 text-center">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
                  const isHighRisk = student.attendance < 75 && student.totalClasses > 0;
                  return (
                    <motion.tr 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={idx} 
                        className="hover:bg-white/5 transition-all group"
                    >
                      <td className="px-10 py-7 text-left">
                        <div className="font-black text-white tracking-tight text-base group-hover:text-blue-400 transition-colors">{student.name}</div>
                        <div className="text-[10px] text-slate-500 font-black mt-1.5 uppercase tracking-widest flex items-center gap-3">
                            {student.id} <div className="w-1 h-1 bg-slate-700 rounded-full"></div> Sec {student.section || 'N/A'}
                        </div>
                      </td>
                      <td className="px-10 py-7">
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/10 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">
                            {student.course}
                          </span>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-1.5 bg-[#0b0e14] rounded-full overflow-hidden shadow-inner">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${isHighRisk ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`} style={{ width: `${student.attendance}%` }}></div>
                                </div>
                                <span className={`text-sm font-black tracking-tighter ${isHighRisk ? 'text-red-400' : 'text-emerald-400'}`}>{student.attendance}%</span>
                            </div>
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{student.presentClasses} / {student.totalClasses} Logged Sessions</p>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border w-fit shadow-sm ${isHighRisk ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isHighRisk ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                          {isHighRisk ? 'High Risk' : 'Healthy Standing'}
                        </div>
                      </td>
                      <td className="px-10 py-7 text-center">
                        <button className={`p-4 rounded-2xl transition-all shadow-xl active:scale-90 ${isHighRisk ? 'bg-red-600 text-white shadow-red-600/20 hover:bg-red-500' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}>
                            <Mail size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                }) : (
                    <tr>
                        <td colSpan="5" className="px-10 py-40 text-center">
                            <AlertTriangle size={60} className="mx-auto text-slate-800 mb-6" />
                            <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-xs">Null Data Sequence: Zero matches found in registry</p>
                        </td>
                    </tr>
                )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

// UI Atoms
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[24px] transition-all duration-300 font-bold mb-1.5 group ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    <div className="transition-transform group-hover:scale-110">{icon}</div>
    <span className="text-xs uppercase tracking-[0.2em] font-black">{label}</span>
  </button>
);

export default TeacherStudents;