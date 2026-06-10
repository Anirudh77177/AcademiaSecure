import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, CheckSquare, BookOpen, Users, 
  Brain, LogOut, Bell, Clock, 
  AlertTriangle, TrendingUp, ShieldCheck, Loader2, Coffee, Send, MessageSquare, X, QrCode, Download, ChevronRight
} from 'lucide-react';

const TeacherDashboard = () => {
  const navigate = useNavigate(); 
  
  // Dashboard Analytics States
  const [stats, setStats] = useState({ activeClasses: 0, totalStudents: 0, avgAttendance: 0, aiAlerts: 0 });
  const [todaysSchedule, setTodaysSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Communication Hub States
  const [showNotif, setShowNotif] = useState(false);
  const [doubts, setDoubts] = useState([]);
  const [replyText, setReplyText] = useState({});

  // Dynamic QR Security States
  const [qrModal, setQrModal] = useState({ isOpen: false, courseCode: '' });
  const [qrToken, setQrToken] = useState(null);
  const [countdown, setCountdown] = useState(5);

  // Live Roster & Telemetry States
  const [rosterModal, setRosterModal] = useState({ isOpen: false, courseCode: '' });
  const [rosterData, setRosterData] = useState([]);
  const [isRosterLoading, setIsRosterLoading] = useState(false);

  // Predictive AI Insight States
  const [aiInsightText, setAiInsightText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(true);

  const teacherName = localStorage.getItem('name') || 'Faculty Member';
  const teacherEmail = localStorage.getItem('email') || '';
  const facultyMongoId = localStorage.getItem('mongoId'); 

  /**
   * Helper: Parses course schedule string to extract timing for the current day.
   */
  const getTodayClassTiming = (classTimingStr) => {
    if (!classTimingStr || classTimingStr === 'Not Scheduled') return null;
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayStr = daysMap[new Date().getDay()]; 
    const scheduleParts = classTimingStr.split(',').map(s => s.trim());
    const match = scheduleParts.find(part => part.toLowerCase().startsWith(todayStr.toLowerCase()));
    if (match) {
        const timePart = match.replace(new RegExp(todayStr, 'i'), '').trim();
        return timePart || 'Timing N/A';
    }
    return null; 
  };

  const fetchDoubts = async (mId) => {
    const currentId = mId || facultyMongoId;
    if (!currentId || currentId === "null") return;
    try {
      const res = await axios.get(`/api/teacher/doubts-list/${currentId}`);
      setDoubts(res.data);
    } catch (err) { console.error("Communication Hub Error: Retrieval failed."); }
  };

  useEffect(() => {
    const bootstrapDashboard = async () => {
      if (!teacherEmail) return;
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // Fetch Aggregated Metrics
        const statsRes = await axios.get(`/api/courses/teacher-stats/${teacherEmail}`, { headers });
        setStats(statsRes.data);
        
        let currentId = facultyMongoId;
        if ((!facultyMongoId || facultyMongoId === "null") && statsRes.data.teacherMongoId) {
            localStorage.setItem('mongoId', statsRes.data.teacherMongoId);
            currentId = statsRes.data.teacherMongoId;
        }

        // Fetch Courses & Filter Today's Timeline
        const coursesRes = await axios.get(`/api/courses/teacher/${teacherEmail}`, { headers });
        const filtered = coursesRes.data.map(course => {
            const timing = getTodayClassTiming(course.classTiming);
            return timing ? { ...course, activeTime: timing } : null;
        }).filter(Boolean);
        setTodaysSchedule(filtered);
        
        if (currentId && currentId !== "null") fetchDoubts(currentId);

        // Predictive AI Logic: Fetch Real-time insights and Risk thresholds
        setIsAiLoading(true);
        axios.get(`/api/courses/generate-ai-insight/${teacherEmail}`, { headers })
             .then(res => {
                 setAiInsightText(res.data.insight);
                 if (res.data.alertCount !== undefined) {
                     setStats(prev => ({ ...prev, aiAlerts: res.data.alertCount }));
                 }
             })
             .catch(() => setAiInsightText("System analysis shows stable engagement. Environmental metrics synchronized."))
             .finally(() => setIsAiLoading(false));

      } catch (err) { console.error("Dashboard Sync Error: Connection interrupted."); }
      finally { setLoading(false); }
    };
    bootstrapDashboard();
  }, [teacherEmail, facultyMongoId]);

  const handleReply = async (doubtId) => {
    const answer = replyText[doubtId];
    if (!answer?.trim()) return;
    try {
      await axios.put(`/api/teacher/reply-doubt/${doubtId}`, { answer });
      setReplyText(prev => ({ ...prev, [doubtId]: "" }));
      fetchDoubts(); 
    } catch (err) { alert("State Mutation Error: Failed to transmit reply."); }
  };

  /**
   * Cryptographic QR Security: 
   * Re-generates secure tokens every 5 seconds to prevent proxy attendance.
   */
  useEffect(() => {
    let fetchInterval;
    let timerInterval;

    const fetchNewToken = async () => {
      try {
        const currentFacultyId = localStorage.getItem('mongoId');
        if (!currentFacultyId) return;
        const res = await axios.get(`/api/courses/generate-qr/${qrModal.courseCode}/${currentFacultyId}`);
        setQrToken(JSON.stringify({ courseCode: qrModal.courseCode, token: res.data.token }));
        setCountdown(5);
      } catch (err) { console.error("Security Engine Error: QR token generation failure."); }
    };

    if (qrModal.isOpen) {
      fetchNewToken(); 
      fetchInterval = setInterval(fetchNewToken, 5000); 
      timerInterval = setInterval(() => setCountdown(prev => (prev > 1 ? prev - 1 : 5)), 1000);
    }

    return () => { clearInterval(fetchInterval); clearInterval(timerInterval); };
  }, [qrModal.isOpen, qrModal.courseCode]);

  const fetchLiveRoster = async (courseCode) => {
    setRosterModal({ isOpen: true, courseCode });
    setIsRosterLoading(true);
    try {
      const res = await axios.get(`/api/courses/live-roster/${courseCode}`);
      setRosterData(res.data.records || []);
    } catch (err) { setRosterData([]); }
    finally { setIsRosterLoading(false); }
  };

  const downloadCSV = () => {
    if (rosterData.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,Student Name,Email,Status,Time Marked\n";
    rosterData.forEach(s => {
        const time = new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        csvContent += `"${s.name}","${s.email}","${s.status}","${time}"\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Attendance_${rosterModal.courseCode}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0b0e14] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* ENTERPRISE SIDEBAR */}
      <aside className="hidden lg:flex w-72 bg-[#0f111a] border-r border-white/5 flex-col shrink-0 relative z-10 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20"><Brain className="text-white w-6 h-6" /></div>
          <h1 className="text-2xl font-black text-white tracking-tighter">Academia<span className="text-blue-500">AI</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={20} />} label="Operational Hub" isActive={true} />
          <NavItem icon={<CheckSquare size={20} />} label="Manual Logging" onClick={() => navigate('/teacher/attendance')} />
          <NavItem icon={<BookOpen size={20} />} label="Course Catalog" onClick={() => navigate('/teacher/courses')} />
          <NavItem icon={<Users size={20} />} label="Student Profiles" onClick={() => navigate('/teacher/students')} />
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-slate-500 hover:text-red-400 w-full p-4 font-bold transition-all hover:bg-red-400/5 rounded-2xl">
            <LogOut size={18} /> <span className="text-xs uppercase tracking-widest font-black">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* VIEWPORT CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#0b0e14] relative z-10 max-w-[1600px] mx-auto w-full">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div className="text-left">
            <h2 className="text-4xl font-black text-white tracking-tighter">AUTHENTICATED: {teacherName.split(' ')[0]}</h2>
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>

          <div className="relative">
            <button onClick={() => setShowNotif(!showNotif)} className={`p-4 rounded-2xl transition-all border ${showNotif ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
              <Bell size={22} />
              {doubts.filter(d => d.status === 'Pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-[#0b0e14] animate-pulse">
                  {doubts.filter(d => d.status === 'Pending').length}
                </span>
              )}
            </button>

            <AnimatePresence>
            {showNotif && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute right-0 mt-4 w-[420px] bg-[#161a26] border border-white/5 rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] z-[100] p-8 origin-top-right text-left backdrop-blur-3xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tighter"><MessageSquare size={20} className="text-blue-500"/> Grievance Hub</h3>
                  <button onClick={() => setShowNotif(false)} className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all"><X size={20}/></button>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {doubts.length > 0 ? doubts.map(doubt => (
                    <div key={doubt._id} className={`p-5 rounded-[28px] border transition-all ${doubt.status === 'Pending' ? 'bg-[#0f111a] border-blue-500/20' : 'bg-white/5 border-white/5 opacity-60'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-[10px] uppercase">{doubt.studentId?.initials || 'S'}</div>
                           <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">{doubt.studentId?.name}</span>
                        </div>
                        <span className={`text-[8px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${doubt.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{doubt.status}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-5 italic leading-relaxed">"{doubt.question}"</p>
                      
                      {doubt.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <input type="text" placeholder="Draft assistance response..." value={replyText[doubt._id] || ""} onChange={(e) => setReplyText(prev => ({ ...prev, [doubt._id]: e.target.value }))} className="flex-1 bg-[#0b0e14] border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-700 font-medium" />
                          <button onClick={() => handleReply(doubt._id)} className="bg-blue-600 p-3 rounded-xl hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 active:scale-90 transition-all"><Send size={16}/></button>
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-white/5">
                           <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2"><CheckSquare size={10}/> Resolved Response:</p>
                           <p className="text-[11px] text-slate-500 leading-relaxed font-bold">{doubt.answer}</p>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="py-20 text-center opacity-20"><ShieldCheck size={64} className="mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-[0.3em]">Communication Zero</p></div>
                  )}
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </header>

        {loading ? (
          <div className="flex h-[60vh] items-center justify-center flex-col gap-6">
            <Loader2 className="animate-spin text-blue-500" size={56} />
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Synchronizing Faculty Matrix...</p>
          </div>
        ) : (
          <div className="space-y-10 pb-20">
            {/* STAT CARDS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard title="Active Timeline" value={stats.activeClasses} subtitle="Operative Courses" icon={<Clock className="text-blue-500" />} />
              <StatCard title="Total Registry" value={stats.totalStudents} subtitle="Managed Profiles" icon={<Users className="text-indigo-500" />} />
              <StatCard title="System Engagement" value={`${stats.avgAttendance}%`} subtitle="Institutional KPI" icon={<TrendingUp className="text-emerald-500" />} />
              <StatCard title="Predictive Risks" value={stats.aiAlerts} subtitle="Intervention Required" icon={stats.aiAlerts > 0 ? <AlertTriangle className="text-red-500 animate-pulse" /> : <ShieldCheck className="text-emerald-500" />} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6 text-left">
                <div className="bg-[#0f111a] border border-white/5 rounded-[48px] p-8 lg:p-12 shadow-2xl relative overflow-hidden group min-h-[500px]">
                  <div className="flex justify-between items-center mb-12">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Daily Chronology</h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic">Real-time Session Telemetry</p>
                    </div>
                    <div className="px-4 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-lg text-[9px] font-black text-blue-500 uppercase tracking-widest">Active State</div>
                  </div>
                  <div className="space-y-5">
                    {todaysSchedule.length > 0 ? todaysSchedule.map((c, i) => (
                      <ClassCard key={i} time={c.activeTime} course={c.courseName} room={c.courseCode} section={c.section} onGenerateQR={() => setQrModal({ isOpen: true, courseCode: c.courseCode })} onViewRoster={() => fetchLiveRoster(c.courseCode)} />
                    )) : (
                      <div className="py-24 flex flex-col items-center justify-center bg-white/5 rounded-[40px] border border-dashed border-white/5">
                          <Coffee className="text-slate-800 mb-6 group-hover:rotate-12 transition-transform" size={64} />
                          <h4 className="text-slate-500 font-black tracking-[0.2em] uppercase text-xs">Null Schedule Detected</h4>
                          <p className="text-slate-700 text-[10px] mt-2 uppercase font-black tracking-[0.4em]">Optimal productivity pause in progress.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI INSIGHTS SIDEBAR */}
              <div className="space-y-6 text-left">
                <div className="bg-gradient-to-br from-[#161a26] to-[#0b0e14] border border-white/5 rounded-[48px] p-10 shadow-2xl sticky top-8 group">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-[22px] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                       <Brain className="text-purple-500 w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tighter uppercase">Academia<span className="text-purple-500">AI</span></h3>
                  </div>
                  
                  <div className="bg-purple-500/5 border border-purple-500/10 p-8 rounded-[36px] mb-10 relative overflow-hidden min-h-[160px] flex items-center group/text">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/text:rotate-12 transition-transform"><Brain size={60} className="text-purple-400"/></div>
                     {isAiLoading ? (
                         <div className="flex items-center gap-4 w-full">
                            <Loader2 className="animate-spin text-purple-500" size={24}/>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] animate-pulse">Synthesizing telemetry data...</p>
                         </div>
                     ) : (
                         <p className="text-[13px] text-slate-300 leading-relaxed font-bold relative z-10 italic">"{aiInsightText}"</p>
                     )}
                  </div>
                  
                  <button onClick={() => navigate('/teacher/students')} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-3">
                    Analyze Performance <ChevronRight size={14}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DYNAMIC SECURITY QR DIALOG */}
      <AnimatePresence>
      {qrModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#05060a]/95 backdrop-blur-xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0f111a] border border-white/5 p-12 rounded-[56px] flex flex-col items-center shadow-[0_0_150px_rgba(16,185,129,0.1)] relative overflow-hidden max-w-md w-full">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Live Validator</h2>
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10 flex items-center gap-3 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10">
              <Clock size={14} className={countdown % 5 === 0 ? "animate-spin" : ""} /> 
              Token Rotation: 0{countdown}s
            </p>
            <div className="bg-white p-8 rounded-[40px] shadow-2xl transition-all duration-500 transform hover:scale-105">
              {qrToken ? <QRCodeSVG value={qrToken} size={280} level="H" includeMargin={true} /> : <div className="w-[280px] h-[280px] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-500" size={48}/></div>}
            </div>
            <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.4em] mt-10">Scan authorized endpoint only</p>
            <button onClick={() => setQrModal({ isOpen: false, courseCode: '' })} className="mt-8 px-10 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-red-500/10">Disconnect Sensor</button>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* LIVE ROSTER TELEMETRY DIALOG */}
      <AnimatePresence>
      {rosterModal.isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#05060a]/95 backdrop-blur-xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="bg-[#0f111a] border border-white/5 w-full max-w-2xl rounded-[48px] overflow-hidden flex flex-col shadow-2xl relative">
            <div className="p-8 lg:p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="text-left">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
                  <Users className="text-blue-500" size={28}/> Telemetry Feed
                </h2>
                <p className="text-slate-500 text-[9px] font-black uppercase mt-1 tracking-[0.2em] flex items-center gap-3">
                  Course: <span className="text-blue-500">{rosterModal.courseCode}</span> <div className="w-1 h-1 bg-slate-700 rounded-full"></div> Real-time
                </p>
              </div>
              <button onClick={() => setRosterModal({ isOpen: false, courseCode: '' })} className="p-4 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-500/10"><X size={22}/></button>
            </div>

            <div className="px-10 py-6 bg-blue-600/5 border-b border-blue-500/10 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="text-left w-full sm:w-auto">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Cumulative Present</p>
                  <span className="text-4xl font-black text-blue-500 tracking-tighter">{rosterData.length}</span>
              </div>
              <button onClick={downloadCSV} disabled={rosterData.length === 0} className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white hover:border-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-20 shadow-xl">
                <Download size={16}/> Export Archive
              </button>
            </div>

            <div className="p-8 lg:p-10 max-h-[500px] overflow-y-auto custom-scrollbar space-y-3">
              {isRosterLoading ? (
                <div className="py-20 flex flex-col items-center justify-center opacity-50"><Loader2 className="animate-spin text-blue-500 mb-4" size={48}/><p className="text-[10px] font-black uppercase tracking-[0.3em]">Querying Data Streams...</p></div>
              ) : rosterData.length > 0 ? rosterData.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-5 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-black text-base border border-blue-500/10 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">{s.initials}</div>
                    <div><h4 className="text-sm font-black text-white tracking-tight uppercase">{s.name}</h4><p className="text-[9px] text-slate-500 font-bold tracking-widest mt-0.5">{s.email}</p></div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest rounded-lg">Synchronized</span>
                    <span className="text-[10px] text-slate-600 font-bold font-mono uppercase">{new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center opacity-10"><ShieldCheck size={80} className="mx-auto mb-4"/><p className="text-xs font-black uppercase tracking-[0.4em]">Roster Stream Empty</p></div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
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

const StatCard = ({ title, value, subtitle, icon }) => (
  <div className="bg-[#0f111a] border border-white/5 p-8 rounded-[40px] flex flex-col hover:border-blue-500/20 transition-all shadow-2xl group hover:-translate-y-1 text-left relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">{icon}</div>
    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 w-fit mb-8 shadow-inner">{icon}</div>
    <h4 className="text-slate-600 text-[10px] font-black uppercase tracking-[0.25em]">{title}</h4>
    <h2 className="text-4xl font-black text-white my-3 tracking-tighter">{value}</h2>
    <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.3em] border-t border-white/5 pt-4 mt-2">{subtitle}</p>
  </div>
);

const ClassCard = ({ time, course, room, section, onGenerateQR, onViewRoster }) => (
  <div className="p-8 rounded-[40px] border border-white/5 bg-[#161a26] flex flex-col md:flex-row justify-between items-center gap-8 transition-all hover:border-blue-500/20 group shadow-xl">
    <div className="flex items-center gap-8 text-left w-full">
      <div className="w-16 h-16 rounded-[24px] bg-[#0b0e14] border border-white/5 flex items-center justify-center font-black text-xs text-blue-500 uppercase shadow-inner group-hover:border-blue-500/20 transition-all">{room.substring(0, 3)}</div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h4 className="text-xl font-black text-white tracking-tight leading-none uppercase">{course}</h4>
          <span className="text-[9px] bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg border border-purple-500/10 font-black uppercase tracking-widest">Section {section}</span>
        </div>
        <div className="flex items-center gap-6">
          <p className="text-sm text-slate-400 font-bold flex items-center gap-2.5 tracking-tight"><Clock size={18} className="text-blue-500"/> {time}</p>
          <div className="w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.25em]">{room}</p>
        </div>
      </div>
    </div>
    <div className="flex gap-3 w-full md:w-auto">
      <button onClick={onGenerateQR} className="flex-1 md:flex-none px-8 py-4 bg-emerald-600/10 text-emerald-500 border border-emerald-500/10 rounded-[20px] text-[10px] font-black uppercase tracking-[0.25em] hover:bg-emerald-600 hover:text-white transition-all active:scale-95 flex justify-center items-center gap-3 shadow-lg shadow-emerald-900/5"><QrCode size={16}/> Live QR</button>
      <button onClick={onViewRoster} className="flex-1 md:flex-none px-8 py-4 bg-[#0b0e14] border border-white/5 text-slate-400 rounded-[20px] text-[10px] font-black uppercase tracking-[0.25em] hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all active:scale-95 flex justify-center items-center gap-3 shadow-2xl"><Users size={16}/> Roster</button>
    </div>
  </div>
);

export default TeacherDashboard;