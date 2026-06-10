import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, LayoutDashboard, Users, CheckCircle, BookOpen, LogOut,
  Calendar, Save, CheckCircle2, XCircle, Loader2, Search, AlertCircle, Lock, ChevronRight
} from 'lucide-react';

// Utility: ISO Date transformation for localized scheduling
const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TakeAttendance = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  
  const todayStr = getLocalDateString(0);
  const yesterdayStr = getLocalDateString(-1);

  const [date, setDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const userRole = localStorage.getItem('role') || 'admin';

  /**
   * Action Validation Logic:
   * Enforces business rules: Admin has global write access, 
   * while Faculty is restricted to a 48-hour operational window.
   */
  const isActionAllowed = () => {
    if (userRole === 'admin') return true;
    return date === todayStr || date === yesterdayStr; 
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/courses-all');
        setCourses(res.data);
        if (res.data.length > 0) setSelectedCourse(res.data[0].courseCode);
      } catch (err) {
        console.error("Telemetry Error: Course registry unreachable.");
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse) return;
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/attendance/students/${selectedCourse}`);
        setStudents(res.data);
      } catch (err) {
        setStudents([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedCourse]);

  const toggleStatus = (id, newStatus) => {
    if (!isActionAllowed()) return; 
    setStudents(prev => prev.map(s => s._id === id ? { ...s, status: newStatus } : s));
  };

  const markAll = (status) => {
    if (!isActionAllowed()) return;
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const submitAttendance = async () => {
    if (!isActionAllowed()) return;

    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s._id,
        name: s.name,
        status: s.status
      }));

      await axios.post('http://localhost:5000/api/attendance/mark', {
        courseId: selectedCourse,
        date,
        records,
        userRole 
      });

      navigate(userRole === 'faculty' ? '/teacher' : '/admin');
    } catch (err) {
      alert(err.response?.data?.message || "Transmission Error: DB handshake failed.");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0b0e14] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* ENTERPRISE NAVIGATION */}
      <aside className="hidden lg:flex w-72 bg-[#0f111a] border-r border-white/5 flex-col shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20"><Brain className="text-white w-6 h-6"/></div>
          <h1 className="text-2xl font-black text-white tracking-tighter">Academia<span className="text-blue-500">AI</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {userRole === 'admin' ? (
              <>
                  <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => navigate('/admin')} />
                  <NavItem icon={<Users size={20} />} label="Manage Users" onClick={() => navigate('/admin/manage-users')} />
                  <NavItem icon={<CheckCircle size={20} />} label="Attendance Hub" isActive={true} />
                  <NavItem icon={<BookOpen size={20} />} label="Curriculum" onClick={() => navigate('/admin/courses')} />
                  <NavItem icon={<Brain size={20}/>} label="AI Insights" onClick={() => navigate('/admin/ai-insights')} />
              </>
          ) : (
              <>
                  <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => navigate('/teacher')} />
                  <NavItem icon={<CheckCircle size={20} />} label="Take Attendance" isActive={true} />
              </>
          )}
        </nav>
        <div className="p-6 border-t border-white/5">
            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-slate-500 hover:text-red-400 w-full p-4 font-bold transition-all hover:bg-red-400/5 rounded-2xl"><LogOut size={20} /> <span className="text-sm">Sign Out</span></button>
        </div>
      </aside>

      {/* VIEWPORT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0b0e14]">
        <div className="p-6 lg:p-10 pb-6 shrink-0">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="text-left">
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Attendance Console</h1>
                <p className="text-slate-500 font-medium italic">
                    {userRole === 'admin' ? 'Administrative override enabled (Global Access)' : 'Standard session logging (48h Window)'}
                </p>
            </div>
            
            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                 <button onClick={() => markAll('Present')} disabled={!isActionAllowed()} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors disabled:opacity-20">All Present</button>
                 <div className="w-px h-4 bg-white/10"></div>
                 <button onClick={() => markAll('Absent')} disabled={!isActionAllowed()} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors disabled:opacity-20">All Absent</button>
            </div>
          </header>

          {/* CONTROL PANEL */}
          <div className="bg-[#161925] p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
            {!isActionAllowed() && <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>}

            <div className="flex flex-col xl:flex-row gap-8 items-end relative z-10 text-left">
                <div className="flex-1 w-full group">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 block ml-1">Curriculum Unit</label>
                    <div className="relative">
                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18}/>
                        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-blue-600 font-bold cursor-pointer appearance-none [color-scheme:dark]">
                            {courses.map(c => <option key={c.courseCode} value={c.courseCode}>{c.courseCode} • {c.courseName}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="w-full xl:w-64">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 block ml-1 text-left">Log Date</label>
                    <div className="relative">
                        <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 ${!isActionAllowed() ? 'text-red-500' : 'text-slate-600'} pointer-events-none`} size={18}/>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)} 
                            min={userRole === 'faculty' ? yesterdayStr : undefined} 
                            max={userRole === 'faculty' ? todayStr : undefined} 
                            className={`w-full bg-[#0b0e14] border ${!isActionAllowed() ? 'border-red-500/30 text-red-400' : 'border-white/5 text-white'} rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-600 font-bold [color-scheme:dark] transition-all`} 
                        />
                    </div>
                </div>
                
                <button 
                    onClick={submitAttendance} 
                    disabled={saving || students.length === 0 || !isActionAllowed()} 
                    className={`w-full xl:w-auto px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 ${
                        saving || students.length === 0 ? 'opacity-30 bg-slate-800' : 
                        (!isActionAllowed() ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20')
                    }`}
                >
                    {saving ? <Loader2 className="animate-spin" size={18}/> : (!isActionAllowed() ? <Lock size={18}/> : <Save size={18}/>)} 
                    {!isActionAllowed() ? 'Access Restricted' : 'Synchronize Logs'}
                </button>
            </div>
          </div>
        </div>

        {/* ROSTER LISTING */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 custom-scrollbar">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                    <Users size={22} className="text-blue-500"/> Active Roster <span className="text-slate-600 font-bold">({students.length})</span>
                </h2>
                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18}/>
                    <input type="text" placeholder="Filter profiles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#161925] border border-white/5 rounded-2xl py-3.5 pl-12 pr-5 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all placeholder-slate-700"/>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                {loading ? (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center bg-white/5 rounded-[40px] border border-dashed border-white/10">
                        <Loader2 className="animate-spin text-blue-500 mb-6" size={48} />
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Hydrating Roster...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="col-span-full bg-white/5 border border-dashed border-white/10 rounded-[40px] py-32 text-center flex flex-col items-center">
                        <AlertCircle size={64} className="text-slate-800 mb-6"/>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Zero students found for course: {selectedCourse}</p>
                    </div>
                ) : (
                    filteredStudents.map((student) => {
                        const isPresent = student.status === 'Present';
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={student._id} 
                                className={`bg-[#121421] border p-6 rounded-[28px] flex items-center justify-between transition-all ${!isActionAllowed() ? 'border-white/5 opacity-50' : 'border-white/5 hover:border-blue-500/20 shadow-xl'}`}
                            >
                                <div className="flex items-center gap-5 text-left">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${isPresent ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {student.name.charAt(0)}{student.name.split(' ')[1]?.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base tracking-tight">{student.name}</h4>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">{student.studentID || 'ID: NOT-SET'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <StatusBtn 
                                        active={isPresent} 
                                        type="Present" 
                                        onClick={() => toggleStatus(student._id, 'Present')} 
                                        disabled={!isActionAllowed()} 
                                    />
                                    <StatusBtn 
                                        active={!isPresent} 
                                        type="Absent" 
                                        onClick={() => toggleStatus(student._id, 'Absent')} 
                                        disabled={!isActionAllowed()} 
                                    />
                                </div>
                            </motion.div>
                        );
                    })
                )}
                </AnimatePresence>
            </div>
        </div>
      </main>
    </div>
  );
};

// UI Atoms
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
    {icon} <span className="text-sm tracking-tight">{label}</span>
  </button>
);

const StatusBtn = ({ active, type, onClick, disabled }) => {
    const isPresent = type === 'Present';
    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`w-12 h-12 rounded-xl text-xs font-black transition-all flex items-center justify-center border ${
                active ? (isPresent ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20') : 
                'bg-[#0b0e14] text-slate-600 border-white/5 hover:border-slate-500'
            } disabled:cursor-not-allowed`}
        >
            {isPresent ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
        </button>
    );
};

export default TakeAttendance;