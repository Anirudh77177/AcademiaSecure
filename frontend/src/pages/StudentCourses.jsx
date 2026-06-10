import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, LogOut, Brain, 
  Clock, Search, AlertTriangle, CheckCircle2, 
  User, GraduationCap, ChevronRight, Loader2, X, Calendar, 
  Calculator, MessageSquareText, TrendingUp, Send, QrCode, ArrowLeft
} from 'lucide-react';

const StudentCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Modal & Insight States
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [bunkCount, setBunkCount] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [doubtMsg, setDoubtMsg] = useState("");
  const [myGrievances, setMyGrievances] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Security Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProcessMsg, setScanProcessMsg] = useState('');

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const email = localStorage.getItem('email');
        if (!email) { navigate('/'); return; }
        const res = await axios.get(`http://localhost:5000/api/student/dashboard/${email}`, getAuthConfig());
        setCourses(res.data.enrolledCourses);
        setStudent(res.data.student);
      } catch (err) { setError("Data Stream Interrupted."); } 
      finally { setLoading(false); }
    };
    fetchCourses();
  }, [navigate]);

  const fetchMyGrievances = async (studentMongoId, cCode) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/student/grievance/status/${studentMongoId}`, getAuthConfig());
      setMyGrievances(res.data.filter(d => d.courseCode === cCode));
    } catch (err) { console.error("Identity Hub Error: Doubt retrieval failed."); }
  };

  const openDetails = async (course) => {
    setSelectedCourse(course);
    setShowModal(true);
    setLoadingHistory(true);
    setBunkCount(0);
    setDoubtMsg("");
    try {
      const attRes = await axios.get(`http://localhost:5000/api/student/attendance-history/${course.courseCode}/${student.mongoId}`, getAuthConfig());
      setHistory(attRes.data);
      await fetchMyGrievances(student.mongoId, course.courseCode);
    } catch (err) { console.error("Telemetry Error: Fetching history failed."); }
    finally { setLoadingHistory(false); }
  };

  const handleGrievanceSubmit = async () => {
    if (!doubtMsg.trim()) return;
    setIsSubmitting(true);
    try {
        await axios.post('http://localhost:5000/api/student/grievance/submit', {
            studentId: student.mongoId,
            facultyId: selectedCourse.facultyMongoId,
            courseCode: selectedCourse.courseCode,
            question: doubtMsg
        }, getAuthConfig());
        setDoubtMsg("");
        await fetchMyGrievances(student.mongoId, selectedCourse.courseCode);
    } catch (err) { alert("Transmission Error: Failed to log grievance."); } 
    finally { setIsSubmitting(false); }
  };

  const calculateBunkImpact = () => {
    if (!selectedCourse) return 0;
    const total = selectedCourse.totalClasses + parseInt(bunkCount || 0);
    return total === 0 ? 0 : Math.round((selectedCourse.presentClasses / total) * 100);
  };

  const getProjectedGrade = (pct) => {
    if (pct >= 90) return { grade: 'A+', color: 'text-emerald-500', glow: 'shadow-emerald-500/20' };
    if (pct >= 80) return { grade: 'A', color: 'text-blue-500', glow: 'shadow-blue-500/20' };
    if (pct >= 75) return { grade: 'B+', color: 'text-purple-500', glow: 'shadow-purple-500/20' };
    if (pct >= 65) return { grade: 'B', color: 'text-amber-500', glow: 'shadow-amber-500/20' };
    return { grade: 'C / NP', color: 'text-red-500', glow: 'shadow-red-500/20' };
  };

  /**
   * QR SENSOR ENGINE:
   * Handles camera stream and secure token validation for proximity attendance.
   */
  useEffect(() => {
    let scanner;
    if (isScanning) {
      scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 }, false);
      scanner.render(async (text) => {
          scanner.clear();
          setIsScanning(false);
          setScanProcessMsg('Authenticating Session...');
          try {
            const qrData = JSON.parse(text);
            const res = await axios.post('http://localhost:5000/api/student/mark-attendance-qr', {
              token: qrData.token,
              studentId: student.mongoId,
              email: student.email
            }, getAuthConfig());
            alert(`Verified: ${res.data.message}`);
            window.location.reload(); 
          } catch (err) {
            alert(`Validation Failed: ${err.response?.data?.message || "Invalid Token"}`);
          } finally { setScanProcessMsg(''); }
        }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, [isScanning, student]);

  const filteredCourses = courses.filter(c => 
    c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col h-screen bg-[#0b0e14] items-center justify-center gap-6">
        <Loader2 className="animate-spin text-blue-500" size={56} />
        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Loading Neural Curriculum...</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0b0e14] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* PERSISTENT SIDEBAR */}
      <aside className="hidden lg:flex w-72 bg-[#0f111a] border-r border-white/5 flex-col shrink-0 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20"><Brain className="text-white w-6 h-6"/></div>
          <h1 className="text-2xl font-black text-white tracking-tighter">Academia<span className="text-blue-500">AI</span></h1>
        </div>
        {student && (
          <div className="px-6 mb-8 text-left">
            <div className="bg-white/5 p-4 rounded-[28px] flex items-center gap-4 border border-white/5 transition-all hover:bg-white/10 group">
              <div className="w-11 h-11 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-black text-base border border-blue-500/10 shadow-inner">{student.initials}</div>
              <div className="overflow-hidden"><h3 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{student.name}</h3><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Learner Node</p></div>
            </div>
          </div>
        )}
        <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={20} />} label="Operational Hub" onClick={() => navigate('/student')} />
          <NavItem icon={<BookOpen size={20} />} label="Curriculum Map" isActive={true} />
        </nav>
        <div className="p-6 border-t border-white/5">
            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-slate-500 hover:text-red-400 w-full p-4 font-bold transition-all hover:bg-red-400/5 rounded-2xl group">
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/> <span className="text-[10px] uppercase font-black tracking-widest">Terminate Session</span>
            </button>
        </div>
      </aside>

      {/* VIEWPORT CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0b0e14]">
        <div className="p-6 lg:p-10 pb-6 shrink-0">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div className="text-left">
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-4 uppercase">My Curriculum</h1>
                    <p className="text-slate-500 font-medium text-lg italic">Monitor academic standing and utilize AI-driven grade projection.</p>
                </div>
                <div className="bg-white/5 border border-white/5 px-6 py-4 rounded-3xl flex items-center gap-4 shadow-xl">
                    <GraduationCap className="text-blue-500" size={24}/>
                    <div className="text-left">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Active Units</p>
                        <span className="text-xl font-black text-white">{courses.length} Assigned</span>
                    </div>
                </div>
            </header>
            
            <div className="relative group max-w-4xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={22}/>
                <input type="text" placeholder="Search Academic Units by Name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#121421] border border-white/5 text-white rounded-[24px] py-5 pl-14 pr-6 focus:outline-none focus:border-blue-600 transition-all font-bold placeholder-slate-700 shadow-2xl text-sm"/>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 custom-scrollbar pb-32">
            <div className="grid grid-cols-1 gap-6">
                {filteredCourses.map((course) => {
                    const isPending = course.totalClasses === 0;
                    const isCritical = !isPending && course.attendancePercentage < 75;
                    return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={course.courseId} className="bg-[#161a26] border border-white/5 rounded-[40px] p-8 hover:border-blue-500/20 transition-all shadow-2xl group flex flex-col xl:flex-row gap-8 items-center relative overflow-hidden">
                        <div className="flex-1 text-left w-full">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className="bg-[#0b0e14] border border-white/5 text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">{course.courseCode}</span>
                                <span className="bg-blue-600/10 border border-blue-500/10 text-blue-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">{course.semester}</span>
                            </div>
                            <h2 className="text-3xl font-black text-white mb-6 group-hover:text-blue-400 transition-colors uppercase tracking-tight leading-none">{course.courseName}</h2>
                            <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <div className="flex items-center gap-3 bg-[#0b0e14] px-4 py-2.5 rounded-2xl border border-white/5"><User size={14} className="text-blue-500"/> Prof. {course.facultyName}</div>
                                <div className="flex items-center gap-3 bg-[#0b0e14] px-4 py-2.5 rounded-2xl border border-white/5"><Clock size={14} className="text-purple-500"/> {course.classTiming}</div>
                            </div>
                        </div>

                        <div className="w-full xl:w-[400px] bg-[#0b0e14]/50 p-8 rounded-[32px] border border-white/5 text-left flex flex-col md:flex-row xl:flex-col justify-between gap-6">
                            <div className="flex justify-between items-center w-full">
                                <div>
                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Telemetry Status</p>
                                    <div className={`flex items-center gap-2 text-[10px] font-black tracking-widest uppercase ${isPending ? 'text-slate-500' : (isCritical ? 'text-red-500' : 'text-emerald-500')}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-slate-700' : (isCritical ? 'bg-red-500 animate-pulse' : 'bg-emerald-500')}`}></div>
                                        {isPending ? 'Offline' : (isCritical ? 'Critical Threshold' : 'Nominal')}
                                    </div>
                                </div>
                                <span className={`text-4xl font-black tracking-tighter ${isPending ? 'text-slate-700' : (isCritical ? 'text-red-500' : 'text-white')}`}>{course.attendancePercentage}%</span>
                            </div>
                            
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setIsScanning(true)} className="flex-1 flex justify-center items-center gap-3 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95"><QrCode size={16}/> Mark Present</button>
                                <button onClick={() => openDetails(course)} className="px-6 flex justify-center items-center gap-2 py-4 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-white/5 transition-all">Details</button>
                            </div>
                        </div>
                    </motion.div>
                )})}
            </div>
        </div>

        {/* SECURE QR SCANNER MODAL */}
        <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center p-4 bg-[#05060a]/95 backdrop-blur-xl">
            <style>{`
              #qr-reader { border: none !important; border-radius: 32px; overflow: hidden; background: #0a0c14; }
              #qr-reader__scan_region { background: #0f111a; display: flex; justify-content: center; padding: 20px; }
              #qr-reader__dashboard_section_csr button { background-color: #2563eb !important; color: white !important; border: none !important; padding: 12px 30px !important; border-radius: 16px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.2em !important; font-size: 11px !important; box-shadow: 0 15px 30px -5px rgba(37,99,235,0.4) !important; transition: all 0.3s !important; margin: 15px 0 !important; }
              #qr-reader a { display: none !important; }
              #qr-reader__camera_selection { background: #161a26; color: white; border: 1px solid #1f2937; padding: 12px; border-radius: 14px; width: 100%; font-size: 11px; font-weight: bold; margin-bottom: 15px; }
            `}</style>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f111a] border border-white/5 p-10 rounded-[56px] w-full max-w-md shadow-[0_0_100px_rgba(37,99,235,0.1)] relative">
              <div className="flex justify-between items-center mb-8 text-left">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Proximity Scan</h2>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Initializing Optical Sensor...</p>
                </div>
                <button onClick={() => setIsScanning(false)} className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
              </div>

              <div className="bg-[#0a0c14] rounded-[32px] overflow-hidden mb-8 border border-white/5 shadow-inner">
                 <div id="qr-reader" className="w-full"></div>
              </div>

              <div className="flex items-center justify-center gap-3 bg-blue-500/5 py-3 rounded-2xl border border-blue-500/10">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">Detecting Faculty QR Stream</p>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        {/* ANALYTICS INSIGHT MODAL */}
        <AnimatePresence>
        {showModal && selectedCourse && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#05060a]/95 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0f111a] border border-white/5 w-full max-w-7xl max-h-[90vh] rounded-[56px] overflow-hidden flex flex-col shadow-2xl relative">
              <div className="p-8 lg:p-12 border-b border-white/5 flex justify-between items-center bg-white/5 text-left shrink-0">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/10">{selectedCourse.courseCode}</span>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{selectedCourse.courseName}</h2>
                  </div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                    Assigned Lead: Prof. {selectedCourse.facultyName} <div className="w-1 h-1 bg-slate-700 rounded-full"></div> Unit Diagnostics
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-all text-slate-500 shadow-inner"><X size={24}/></button>
              </div>

              <div className="flex-1 p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 overflow-y-auto custom-scrollbar">
                {/* Column 1: Timeline */}
                <div className="lg:col-span-3 space-y-8 text-left">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-3"><Calendar size={14} className="text-blue-500"/> Activity Log</h4>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                    {loadingHistory ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div> : 
                    history.length > 0 ? history.map((entry, i) => (
                      <div key={i} className="flex justify-between items-center p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group">
                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{new Date(entry.date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', weekday:'short'})}</span>
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${entry.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>{entry.status}</span>
                      </div>
                    )) : <p className="text-slate-600 italic font-bold text-xs uppercase tracking-widest text-center py-12">No Telemetry Found</p>}
                  </div>
                </div>

                {/* Column 2: Communication Hub */}
                <div className="lg:col-span-5 space-y-8 flex flex-col">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-3 text-left"><MessageSquareText size={16} className="text-purple-500"/> Grievance Hub</h4>
                  <div className="bg-[#0b0e14] p-6 rounded-[40px] border border-white/5 flex-1 min-h-[400px] flex flex-col justify-between overflow-hidden shadow-inner">
                    <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 mb-6">
                        {myGrievances.length > 0 ? myGrievances.map((g, i) => (
                        <div key={i} className="space-y-3">
                            <div className="bg-[#161a26] p-4 rounded-3xl rounded-tr-none ml-12 border border-white/5 text-left shadow-lg">
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">{g.question}</p>
                                <p className="text-[8px] text-slate-600 mt-2 font-black uppercase tracking-widest">{new Date(g.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                            {g.answer && (
                            <div className="bg-blue-600/10 p-4 rounded-3xl rounded-tl-none mr-12 border border-blue-500/20 text-left shadow-xl">
                                <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2"><Brain size={10}/> Neural Response</p>
                                <p className="text-xs text-slate-200 font-bold leading-relaxed">{g.answer}</p>
                            </div>
                            )}
                        </div>
                        )) : <div className="h-full flex flex-col items-center justify-center opacity-10"><MessageSquareText size={64}/><p className="mt-4 font-black uppercase text-xs tracking-widest">Null Communication</p></div>}
                    </div>
                    <div className="relative group">
                        <textarea value={doubtMsg} onChange={(e) => setDoubtMsg(e.target.value)} placeholder="Transmit academic query..." className="w-full bg-[#161a26] border border-white/5 rounded-[28px] p-5 pr-16 text-xs text-white h-24 outline-none focus:border-blue-600 resize-none transition-all placeholder-slate-700 font-bold shadow-2xl" />
                        <button onClick={handleGrievanceSubmit} disabled={isSubmitting || !doubtMsg.trim()} className="absolute right-4 bottom-4 p-4 bg-blue-600 text-white rounded-[20px] hover:bg-blue-500 disabled:opacity-20 transition-all active:scale-90 shadow-2xl shadow-blue-600/20" >
                            {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
                        </button>
                    </div>
                  </div>
                </div>

                {/* Column 3: AI Projections */}
                <div className="lg:col-span-4 space-y-8 text-left">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-3"><TrendingUp size={16} className="text-emerald-500"/> Predictive Analytics</h4>
                  
                  <div className="bg-gradient-to-br from-blue-600/5 to-transparent border border-blue-500/20 p-8 rounded-[48px] shadow-xl group hover:bg-blue-600/10 transition-all duration-500">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-500"><Calculator size={22}/></div>
                        <h4 className="text-blue-400 text-[11px] font-black uppercase tracking-[0.25em]">Impact Simulator</h4>
                     </div>
                     <div className="flex items-center gap-8">
                        <div className="flex flex-col gap-2">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Planned Absences</span>
                             <input type="number" value={bunkCount} onChange={(e) => setBunkCount(e.target.value)} className="w-24 bg-[#0a0c14] border border-white/10 rounded-2xl py-4 text-center text-xl font-black text-white outline-none focus:border-blue-600 shadow-inner" min="0" />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Simulated Engagement</p>
                          <h3 className={`text-5xl font-black tracking-tighter ${calculateBunkImpact() < 75 ? 'text-red-500' : 'text-emerald-500'}`}>{calculateBunkImpact()}%</h3>
                        </div>
                     </div>
                  </div>

                  <div className={`bg-gradient-to-br from-purple-600/5 to-transparent border border-purple-500/20 p-8 rounded-[48px] shadow-xl group hover:bg-purple-600/10 transition-all duration-500 relative overflow-hidden`}>
                     <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><GraduationCap size={100}/></div>
                     <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-purple-600/20 rounded-2xl text-purple-400"><TrendingUp size={22}/></div>
                        <h4 className="text-purple-400 text-[11px] font-black uppercase tracking-[0.25em]">AI Grade Projection</h4>
                     </div>
                     <div className="flex justify-between items-end relative z-10">
                        <div>
                          <h2 className={`text-7xl font-black tracking-tighter transition-all duration-1000 ${getProjectedGrade(calculateBunkImpact()).color} drop-shadow-2xl`}>
                            {getProjectedGrade(calculateBunkImpact()).grade}
                          </h2>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Algorithmic Estimation</p>
                        </div>
                        <div className={`w-16 h-16 rounded-3xl border border-white/5 flex items-center justify-center bg-white/5 backdrop-blur-xl ${getProjectedGrade(calculateBunkImpact()).color}`}>
                            <Sparkles size={32} className="animate-pulse" />
                        </div>
                     </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        {/* Global Process Overlay */}
        <AnimatePresence>
        {scanProcessMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[400] flex items-center justify-center bg-[#05060a]/90 backdrop-blur-md">
              <div className="bg-[#0f111a] p-12 rounded-[48px] flex flex-col items-center border border-blue-500/20 shadow-[0_0_100px_rgba(37,99,235,0.2)]">
                  <Loader2 className="animate-spin text-blue-500 mb-6" size={56} />
                  <p className="text-white text-[11px] font-black tracking-[0.4em] uppercase">{scanProcessMsg}</p>
              </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// COMPONENT ATOMS
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[24px] transition-all duration-300 font-bold mb-1.5 group ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
    <div className="transition-transform group-hover:scale-110">{icon}</div>
    <span className="text-xs uppercase tracking-[0.2em] font-black">{label}</span>
  </button>
);

export default StudentCourses;