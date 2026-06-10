import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, LayoutDashboard, CheckSquare, BookOpen, Users, 
  LogOut, Save, Loader2, Layers, ChevronDown, CheckCircle2, XCircle
} from 'lucide-react';

const TeacherAttendance = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // Section Orchestration States
  const [availableSections, setAvailableSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]); 
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);

  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);

  const email = localStorage.getItem('email');
  const token = localStorage.getItem('token');

  const getAuthConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    const fetchCourses = async () => {
      if (!email) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/teacher/${email}`, getAuthConfig());
        setCourses(res.data);
        if (res.data.length > 0) setSelectedCourse(res.data[0].courseCode);
      } catch (e) { console.error("Telemetry Error: Course sync failed"); }
    };
    fetchCourses();
  }, [email]);

  /**
   * Section Extraction Logic:
   * Dynamically parses course metadata to identify available section clusters.
   */
  useEffect(() => {
      if (!selectedCourse) return;
      const currentCourseData = courses.find(c => c.courseCode === selectedCourse);
      
      if (currentCourseData && currentCourseData.students) {
          const sections = new Set();
          currentCourseData.students.forEach(student => {
              if (student.section) sections.add(student.section);
          });
          const sortedSections = Array.from(sections).sort();
          setAvailableSections(sortedSections);
          setSelectedSections(sortedSections); // Default state: Global selection
      } else {
          setAvailableSections([]);
          setSelectedSections([]);
      }
  }, [selectedCourse, courses]);

  /**
   * Roster Hydration:
   * Fetches student telemetry filtered by selected section parameters.
   */
  useEffect(() => {
    const fetchRoster = async () => {
      if (!selectedCourse) return;
      if (selectedSections.length === 0 && availableSections.length > 0) {
          setStudents([]);
          return;
      }

      setLoadingRoster(true);
      try {
        let sectionQuery = 'ALL';
        if (selectedSections.length !== availableSections.length) {
            sectionQuery = selectedSections.join(',');
        }
        const res = await axios.get(`http://localhost:5000/api/attendance/students/${selectedCourse}?section=${sectionQuery}`, getAuthConfig());
        setStudents(res.data);
      } catch (e) { setStudents([]); } finally { setLoadingRoster(false); }
    };
    fetchRoster();
  }, [selectedCourse, selectedSections, availableSections.length]);

  const toggleStatus = (id, status) => setStudents(prev => prev.map(s => s._id === id ? { ...s, status } : s));
  const markAll = (status) => setStudents(prev => prev.map(s => ({ ...s, status })));

  const submitAttendance = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({ studentId: s._id, name: s.name, status: s.status }));
      const sectionString = selectedSections.length === availableSections.length ? 'ALL' : selectedSections.join(',');

      await axios.post('http://localhost:5000/api/admin/mark-attendance-secure', {
        courseId: selectedCourse, 
        section: sectionString === 'ALL' ? '' : sectionString,
        date, 
        records, 
        userRole: 'faculty'
      }, getAuthConfig());
      
      navigate('/teacher');
    } catch (e) { alert(e.response?.data?.message || "Transmission Error: DB write failed"); } finally { setSaving(false); }
  };

  const presentCount = students.filter(s => s.status === 'Present').length;
  const absentCount = students.length - presentCount;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0b0e14] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* FACULTY SIDEBAR */}
      <aside className="hidden lg:flex w-72 bg-[#0f111a] border-r border-white/5 flex-col shrink-0 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Brain className="text-white w-6 h-6"/>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter">Academia<span className="text-blue-500">AI</span></h1>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => navigate('/teacher')} />
          <NavItem icon={<CheckSquare size={20}/>} label="Take Attendance" isActive={true} />
          <NavItem icon={<BookOpen size={20}/>} label="Course Catalog" onClick={() => navigate('/teacher/courses')} />
          <NavItem icon={<Users size={20}/>} label="Student Registry" onClick={() => navigate('/teacher/students')} />

          <div className="pt-8 pb-3 px-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Assigned Clusters</p>
          </div>
          <div className="px-2 space-y-1">
            {courses.map((course, index) => (
                <button 
                  key={`${course.courseCode}-${index}`} 
                  onClick={() => setSelectedCourse(course.courseCode)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold ${selectedCourse === course.courseCode ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10 shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedCourse === course.courseCode ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></div>
                  <span className="truncate">{course.courseCode}</span>
                </button>
            ))}
          </div>
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-slate-500 hover:text-red-400 w-full p-4 font-bold transition-all hover:bg-red-400/5 rounded-2xl">
            <LogOut size={20} /> <span className="text-sm">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* VIEWPORT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0b0e14]">
        <header className="p-6 lg:p-10 pb-6 shrink-0 text-left">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Attendance Terminal</h1>
          <p className="text-slate-500 font-medium text-sm tracking-widest uppercase">Operating Unit: <span className="text-blue-500 font-bold">{selectedCourse}</span></p>

          <div className="mt-8 flex flex-col xl:flex-row gap-4 items-end bg-[#161925] p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="flex-1 w-full text-left">
              <label className="text-[10px] font-black text-slate-600 uppercase block mb-3 ml-1 tracking-widest">Active Curriculum</label>
              <select value={selectedCourse} onChange={(e)=>setSelectedCourse(e.target.value)} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-blue-600 cursor-pointer appearance-none [color-scheme:dark]">
                {courses.map(c => <option key={c.courseCode} value={c.courseCode}>{c.courseCode} — {c.courseName}</option>)}
              </select>
            </div>
            
            <div className="w-full xl:w-64 relative text-left">
              <label className="text-[10px] font-black text-purple-500 uppercase block mb-3 ml-1 flex items-center gap-2 tracking-widest"><Layers size={14}/> Section Filter</label>
              <div 
                  onClick={() => setShowSectionDropdown(!showSectionDropdown)}
                  className="w-full bg-[#0b0e14] border border-purple-500/20 rounded-2xl py-4 px-5 text-purple-400 font-bold cursor-pointer flex justify-between items-center transition-all hover:border-purple-500/40 shadow-inner"
              >
                  <span className="truncate text-sm uppercase tracking-tighter">
                      {selectedSections.length === availableSections.length 
                          ? 'Global Cluster' 
                          : selectedSections.length === 0 
                              ? 'Null selection' 
                              : selectedSections.map(s => `Sec ${s}`).join(', ')}
                  </span>
                  <ChevronDown size={18} className={`transition-transform duration-300 ${showSectionDropdown ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
              {showSectionDropdown && (
                  <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSectionDropdown(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full mt-3 left-0 w-full bg-[#161925] border border-white/5 rounded-2xl shadow-2xl z-50 flex flex-col max-h-60 overflow-hidden"
                      >
                          <label className="px-5 py-4 hover:bg-white/5 cursor-pointer border-b border-white/5 flex items-center gap-3 transition-all">
                              <input 
                                  type="checkbox" 
                                  className="w-5 h-5 rounded-lg border-slate-700 bg-slate-900 text-purple-500 accent-purple-600"
                                  checked={selectedSections.length === availableSections.length && availableSections.length > 0}
                                  onChange={(e) => {
                                      if (e.target.checked) setSelectedSections([...availableSections]);
                                      else setSelectedSections([]);
                                  }}
                              />
                              <span className="text-xs font-black uppercase tracking-widest text-slate-200">Toggle All</span>
                          </label>
                          <div className="overflow-y-auto custom-scrollbar">
                              {availableSections.map(sec => (
                                  <label key={sec} className="px-5 py-4 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors">
                                      <input 
                                          type="checkbox" 
                                          className="w-5 h-5 rounded-lg border-slate-700 bg-slate-900 text-purple-500 accent-purple-600"
                                          checked={selectedSections.includes(sec)}
                                          onChange={(e) => {
                                              if (e.target.checked) setSelectedSections([...selectedSections, sec]);
                                              else setSelectedSections(selectedSections.filter(s => s !== sec));
                                          }}
                                      />
                                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Section {sec}</span>
                                  </label>
                              ))}
                          </div>
                      </motion.div>
                  </>
              )}
              </AnimatePresence>
            </div>

            <div className="w-full xl:w-56 text-left">
              <label className="text-[10px] font-black text-slate-600 uppercase block mb-3 ml-1 tracking-widest">Chronology</label>
              <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl py-4 px-5 outline-none [color-scheme:dark] font-bold text-sm transition-all focus:border-blue-600" />
            </div>

            <div className="flex gap-2 w-full xl:w-auto">
                <button onClick={()=>markAll('Present')} className="flex-1 xl:flex-none px-6 py-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">Bulk Present</button>
                <button onClick={()=>markAll('Absent')} className="flex-1 xl:flex-none px-6 py-4 bg-red-500/10 text-red-500 border border-red-500/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Bulk Absent</button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-40 custom-scrollbar">
          {loadingRoster ? (
              <div className="py-40 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-blue-500 mb-6" size={48}/>
                  <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-[10px]">Hydrating Roster Matrix...</p>
              </div>
          ) : (
            <div className="bg-[#121421] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-[#0b0e14] border-b border-white/5 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] sticky top-0 z-20">
                  <tr>
                    <th className="px-8 py-6">Student Profile</th>
                    <th className="px-8 py-6 text-center">Telemetry Status</th>
                    <th className="px-8 py-6 text-right pr-12">Binary Input</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.length > 0 ? students.map(s => (
                    <tr key={s._id} className="hover:bg-white/5 transition-all group">
                      <td className="px-8 py-6">
                          <div className="font-bold text-white tracking-tight flex items-center gap-3">
                              <span className="group-hover:text-blue-400 transition-colors">{s.name}</span>
                              {selectedSections.length > 1 && s.section !== 'NA' && (
                                <span className="bg-purple-500/10 text-purple-400 text-[8px] px-2 py-0.5 rounded-md font-black border border-purple-500/20 uppercase tracking-widest">Sec {s.section}</span>
                              )}
                          </div>
                          <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1.5">{s.studentID}</div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black border uppercase tracking-widest transition-all ${s.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{s.status}</span>
                      </td>
                      <td className="px-8 py-6 text-right pr-12">
                        <div className="flex justify-end gap-3">
                          <StatusToggle active={s.status === 'Present'} type="Present" onClick={() => toggleStatus(s._id, 'Present')} />
                          <StatusToggle active={s.status === 'Absent'} type="Absent" onClick={() => toggleStatus(s._id, 'Absent')} />
                        </div>
                      </td>
                    </tr>
                  )) : (
                      <tr><td colSpan="3" className="px-8 py-32 text-center text-slate-600 font-black uppercase tracking-widest text-xs italic">Registry empty for selected parameters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PERSISTENT ACTION FOOTER */}
        <div className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-288px)] p-6 bg-[#161a26]/80 backdrop-blur-xl border-t border-white/10 flex flex-col sm:flex-row justify-between items-center z-30 gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex gap-12 font-black text-[10px] uppercase tracking-[0.25em]">
            <p className="text-slate-500">Telemetry Total: <span className="text-white ml-2 text-sm">{students.length}</span></p>
            <p className="text-emerald-500">Positive: <span className="ml-2 text-sm">{presentCount}</span></p>
            <p className="text-red-500">Negative: <span className="ml-2 text-sm">{absentCount}</span></p>
          </div>
          <button 
            onClick={submitAttendance} 
            disabled={saving || students.length === 0} 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-14 py-5 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-600/30 disabled:opacity-30 active:scale-95"
          >
            {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Commit Data Streams
          </button>
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

const StatusToggle = ({ active, type, onClick }) => {
    const isP = type === 'Present';
    return (
        <button 
            onClick={onClick} 
            className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center border ${active ? (isP ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20') : 'bg-[#0b0e14] text-slate-700 border-white/5 hover:border-slate-500'}`}
        >
            {isP ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}
        </button>
    );
};

export default TeacherAttendance;