import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, CheckSquare, BookOpen, Users, 
  Brain, LogOut, Loader2, ChevronRight, GraduationCap
} from 'lucide-react';

const TeacherCourses = () => {
  const navigate = useNavigate();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Identity Context Retrieval
  const teacherName = localStorage.getItem('name') || 'Faculty Member';
  const teacherEmail = localStorage.getItem('email');
  const teacherInitials = teacherName.split(' ').map(n => n[0]).join('').toUpperCase();

  /**
   * Helper: Generates Bearer Token configuration for secure API handshake.
   */
  const getAuthConfig = () => {
      const token = localStorage.getItem('token');
      return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    const fetchCourses = async () => {
      if (!teacherEmail) return navigate('/');
      setLoading(true);
      try {
        // Telemetry Stream: Requesting curriculum mapping for the authenticated faculty
        const res = await axios.get(`http://localhost:5000/api/courses/teacher/${teacherEmail}`, getAuthConfig());
        setMyCourses(res.data);
      } catch (err) {
        console.error("Telemetry Error: Course registry sync failed.");
        setMyCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [teacherEmail, navigate]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0b0e14] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* ENTERPRISE SIDEBAR */}
      <aside className="hidden lg:flex w-72 bg-[#0f111a] border-r border-white/5 flex-col shrink-0 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20 font-black text-white">AI</div>
          <h1 className="text-2xl font-black text-white tracking-tighter">Academia<span className="text-blue-500">AI</span></h1>
        </div>

        <div className="px-6 mb-8">
          <div className="bg-white/5 p-4 rounded-[24px] flex items-center gap-4 border border-white/5 group transition-all hover:bg-white/10">
            <div className="w-11 h-11 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-black text-base border border-blue-500/10">{teacherInitials}</div>
            <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-white truncate">{teacherName}</h3>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Faculty Core</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={20} />} label="Operational Hub" onClick={() => navigate('/teacher')} />
          <NavItem icon={<CheckSquare size={20} />} label="Manual Logging" onClick={() => navigate('/teacher/attendance')} />
          <NavItem icon={<BookOpen size={20} />} label="Course Catalog" isActive={true} />
          <NavItem icon={<Users size={20} />} label="Student Registry" onClick={() => navigate('/teacher/students')} />
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-slate-500 hover:text-red-400 w-full p-4 font-bold transition-all hover:bg-red-400/5 rounded-2xl group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/> <span className="text-xs uppercase tracking-widest font-black">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* VIEWPORT CONTENT */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-[#0b0e14] text-left max-w-[1600px] mx-auto w-full custom-scrollbar">
        <header className="mb-12">
          <h1 className="text-5xl font-black mb-3 tracking-tighter text-white uppercase">Curriculum Inventory</h1>
          <p className="text-slate-500 font-medium text-lg italic">Synchronizing academic clusters for: <span className="text-blue-500 font-bold">{teacherEmail}</span></p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-48 text-slate-500">
            <Loader2 className="animate-spin text-blue-500 mb-6" size={56} />
            <p className="font-black uppercase tracking-[0.4em] text-[10px]">Interrogating MongoDB Cluster...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
            {myCourses.length > 0 ? myCourses.map((course, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={idx} 
                className="bg-[#121421] border border-white/5 rounded-[40px] p-8 hover:border-blue-500/30 transition-all group shadow-2xl flex flex-col relative overflow-hidden"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><GraduationCap size={100} /></div>

                <div className="flex justify-between items-start mb-8 relative z-10">
                    <span className="bg-blue-600/10 text-blue-500 px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase border border-blue-500/10 shadow-sm">
                      {course.courseCode}
                    </span>
                    {course.section && (
                      <span className="bg-purple-500/10 text-purple-400 px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase border border-purple-500/10 shadow-sm">
                        SEC {course.section}
                      </span>
                    )}
                </div>

                <h3 className="text-2xl font-black text-white mb-10 group-hover:text-blue-400 transition-colors leading-tight min-h-[70px] uppercase tracking-tight relative z-10">
                  {course.courseName}
                </h3>
                
                <div className="space-y-4 mb-10 mt-auto relative z-10">
                  <div className="flex justify-between items-center bg-[#0b0e14]/50 p-5 rounded-2xl border border-white/5 shadow-inner transition-all group-hover:border-white/10">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3"><Users size={16} className="text-blue-500"/> Enrolled Roster</span>
                    <span className="text-lg font-black text-white tracking-tighter">{course.students?.length || 0}</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-auto relative z-10">
                  <button 
                    onClick={() => navigate('/teacher/attendance')} 
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4.5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    Mark Attendance <ChevronRight size={16}/>
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-32 bg-white/5 rounded-[56px] border border-dashed border-white/10 text-center flex flex-col items-center justify-center">
                 <div className="p-6 bg-slate-800/30 rounded-3xl mb-6"><BookOpen className="text-slate-600" size={56}/></div>
                 <h3 className="text-2xl font-black text-slate-400 tracking-tight uppercase">Null Curriculum Mapping</h3>
                 <p className="text-sm text-slate-600 mt-3 font-medium max-w-sm leading-relaxed">No course telemetry found for this identity. Please initiate a synchronization request with Administration.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// UI Atoms
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[24px] transition-all duration-300 font-bold mb-1.5 ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    <div className="transition-transform group-hover:scale-110">{icon}</div>
    <span className="text-xs uppercase tracking-[0.2em] font-black">{label}</span>
  </button>
);

export default TeacherCourses;