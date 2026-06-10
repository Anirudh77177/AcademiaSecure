import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, LogOut, Brain, 
  CheckCircle2, AlertTriangle, TrendingUp, Sparkles, Loader2, Clock, ChevronRight
} from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Performance Synchronizer:
   * Requests personalized student telemetry and AI-driven behavioral insights.
   */
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const email = localStorage.getItem('email');
        const token = localStorage.getItem('token');
        if (!email) { navigate('/'); return; }

        const res = await axios.get(`http://localhost:5000/api/student/dashboard/${email}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        setError("Synchronization Error: Failed to load student matrix.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [navigate]);

  if (loading) return (
    <div className="flex flex-col h-screen bg-[#0b0e14] items-center justify-center gap-6">
        <Loader2 className="animate-spin text-blue-500" size={56} />
        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Processing Academic Records...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex h-screen bg-[#0b0e14] items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#161a26] p-12 rounded-[40px] border border-red-500/20 text-center shadow-2xl max-w-md">
            <AlertTriangle className="text-red-500 mx-auto mb-6" size={64}/>
            <h2 className="text-white text-2xl font-black tracking-tight mb-2 uppercase">Access Restricted</h2>
            <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">System failed to verify student identity or data stream is unreachable.</p>
            <button onClick={() => {localStorage.clear(); navigate('/');}} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">Return to Entry Point</button>
        </motion.div>
    </div>
  );

  const { student, stats, aiInsights } = data;
  
  // Dynamic UI Theming based on Attendance Thresholds
  const getHealthMetics = () => {
    if (stats.totalSessions === 0) return { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", label: "STANDBY", ring: "#3b82f6" };
    if (stats.overallPercentage < 65) return { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", label: "CRITICAL RISK", ring: "#ef4444" };
    if (stats.overallPercentage < 75) return { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: "WARNING ZONE", ring: "#f59e0b" };
    return { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", label: "OPTIMAL HEALTH", ring: "#10b981" };
  };

  const health = getHealthMetics();

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0b0e14] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* STUDENT SIDEBAR */}
      <aside className="hidden lg:flex w-72 bg-[#0f111a] border-r border-white/5 flex-col shrink-0 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20"><Brain className="text-white w-6 h-6"/></div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Academia<span className="text-blue-500">AI</span></h1>
        </div>

        <div className="px-6 mb-8">
          <div className="bg-white/5 p-4 rounded-[28px] flex items-center gap-4 border border-white/5 transition-all hover:bg-white/10 group">
            <div className="w-11 h-11 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-black text-base border border-blue-500/10 shadow-inner">{student.initials}</div>
            <div className="overflow-hidden text-left">
                <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{student.name}</h3>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Learner Node</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          <NavItem icon={<LayoutDashboard size={20} />} label="Operational Hub" isActive={true} />
          <NavItem icon={<BookOpen size={20} />} label="Curriculum Map" onClick={() => navigate('/student/courses')} />
        </nav>

        <div className="p-6 border-t border-white/5">
            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-slate-500 hover:text-red-400 w-full p-4 font-bold transition-all hover:bg-red-400/5 rounded-2xl group">
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/> <span className="text-[10px] uppercase font-black tracking-widest">Terminate Session</span>
            </button>
        </div>
      </aside>

      {/* VIEWPORT CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto p-6 lg:p-10 relative bg-[#0b0e14] max-w-[1600px] mx-auto w-full custom-scrollbar">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="text-left">
                <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Hello, <span className="text-blue-500 uppercase">{student.name.split(' ')[0]}</span></h1>
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="bg-[#161925] text-slate-400 border border-white/5 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">{student.department}</span>
                    <span className="bg-blue-600/10 text-blue-400 border border-blue-500/10 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Node ID: {student.id}</span>
                    <span className="bg-purple-600/10 text-purple-400 border border-purple-500/10 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Batch {student.batch || '2026'}</span>
                </div>
            </div>
            <div className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl ${health.bg} ${health.color}`}>
                <div className={`w-2 h-2 rounded-full ${health.color.replace('text', 'bg')} animate-pulse`}></div>
                Status: {health.label}
            </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-20">
            {/* Visual Attendance Matrix */}
            <div className="xl:col-span-1 bg-[#121421] rounded-[48px] p-10 border border-white/5 shadow-2xl flex flex-col items-center justify-between relative overflow-hidden group">
                <div className="w-full flex justify-between items-center mb-10 text-left">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.25em]">Engagement Metric</h3>
                    <TrendingUp size={18} className="text-slate-700"/>
                </div>
                
                <div className="relative w-56 h-56 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                    <svg className="w-full h-full -rotate-90 filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" className="stroke-[#0b0e14]" strokeWidth="8" fill="none" />
                        <motion.circle 
                            initial={{ strokeDashoffset: 264 }}
                            animate={{ strokeDashoffset: 264 - (264 * stats.overallPercentage) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="50" cy="50" r="42" 
                            stroke={health.ring} strokeWidth="8" fill="none" strokeLinecap="round" 
                            style={{ strokeDasharray: 264 }}
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-white tracking-tighter">{stats.overallPercentage}%</span>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Average</span>
                    </div>
                </div>

                <div className="flex w-full gap-4 mt-12">
                    <StatBox label="Sessions Logged" count={stats.presentCount} color="text-emerald-500" icon={<CheckCircle2 size={14}/>} />
                    <StatBox label="Sessions Skipped" count={stats.absentCount} color="text-red-500" icon={<AlertTriangle size={14}/>} />
                </div>
                
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] mt-8 flex items-center gap-2">
                    <Clock size={12}/> {stats.totalSessions} Total Records Found
                </p>
            </div>

            {/* AI COMPANION COMPONENT */}
            <div className="xl:col-span-2 bg-gradient-to-br from-[#1c152e] to-[#121421] rounded-[48px] p-10 lg:p-12 border border-purple-500/10 shadow-2xl flex flex-col relative overflow-hidden text-left group">
                <div className="absolute -right-20 -top-20 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Brain size={400} className="text-purple-400"/></div>
                
                <div className="flex items-center gap-5 mb-10 relative z-10">
                    <div className="p-4 bg-purple-600 rounded-3xl shadow-[0_15px_40px_rgba(147,51,234,0.3)] text-white group-hover:rotate-12 transition-transform"><Sparkles size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Study Companion v3.0</h2>
                        <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Neural Academic Analysis</p>
                    </div>
                </div>

                <p className="text-slate-300 mb-12 relative z-10 text-xl leading-relaxed font-medium">
                    {stats.totalSessions === 0 
                        ? "Curriculum sessions are yet to initialize. Prepare your academic roadmap using the generative insights below." 
                        : <>Your trajectory is currently tracking at <span className="font-black text-white underline decoration-purple-500 decoration-4 underline-offset-4">{stats.overallPercentage}%</span>. Here is your AI-optimized operational plan.</>
                    }
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10 mb-12">
                    <div>
                        <h4 className="flex items-center gap-3 text-emerald-400 text-[11px] font-black uppercase mb-6 tracking-[0.2em] border-l-2 border-emerald-500/30 pl-4">Verified Strengths</h4>
                        <ul className="space-y-4">
                            {aiInsights.strengths.map((str, i) => (
                                <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="flex items-start gap-3 text-sm text-slate-400 font-bold leading-snug">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"></div> {str}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="flex items-center gap-3 text-blue-400 text-[11px] font-black uppercase mb-6 tracking-[0.2em] border-l-2 border-blue-500/30 pl-4">Strategic Focus</h4>
                        <ul className="space-y-4">
                            {aiInsights.focusAreas.map((area, i) => (
                                <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="flex items-start gap-3 text-sm text-slate-400 font-bold leading-snug">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0"></div> {area}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-auto p-6 bg-white/5 border border-purple-500/20 rounded-3xl relative z-10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 opacity-50"><Sparkles size={12} className="text-purple-400"/> <span className="text-[9px] font-black uppercase tracking-widest">Motivational Core</span></div>
                    <p className="text-purple-300 text-sm italic text-center font-bold tracking-tight">"{aiInsights.quote}"</p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

// UI ATOMS
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[24px] transition-all duration-300 font-bold mb-1.5 group ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    <div className="transition-transform group-hover:scale-110">{icon}</div>
    <span className="text-xs uppercase tracking-[0.2em] font-black">{label}</span>
  </button>
);

const StatBox = ({ label, count, color, icon }) => (
  <div className="flex-1 bg-[#0b0e14] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center transition-all hover:border-slate-700 shadow-inner group/box">
    <div className={`mb-3 p-2 rounded-lg bg-white/5 ${color} transition-transform group-hover/box:scale-110`}>{icon}</div>
    <span className={`text-4xl font-black mb-1 tracking-tighter ${color}`}>{count}</span>
    <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] text-center leading-none">{label}</span>
  </div>
);

export default StudentDashboard;