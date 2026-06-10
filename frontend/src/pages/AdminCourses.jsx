import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Users, LayoutDashboard, Brain, 
  LogOut, Trash2, Loader2, PlusCircle, CheckCircle2,
  Calendar, ChevronRight, UserPlus, Search, X, Edit
} from 'lucide-react';

const AdminCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [sections, setSections] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // Modal visibility states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // State for Course Persistence (Edit/Create mode toggle)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);

  const [selectedDays, setSelectedDays] = useState([]);
  const [dayTimings, setDayTimings] = useState({}); 
  
  const [allStudents, setAllStudents] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  const [formData, setFormData] = useState({
    courseCode: '', courseName: '', facultyId: '', section: '', semester: 'Spring 2026'
  });

  const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /**
   * Helper: Retrieve JWT Bearer Token for Secure API Transactions
   * Used to authenticate admin privileges on the backend.
   */
  const getAuthConfig = () => {
      const token = localStorage.getItem('token');
      return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Lifecycle Hook: Bootstrap initial data from multiple API endpoints
  useEffect(() => {
    const bootstrapData = async () => {
      setLoading(true);
      // Fetching dependencies in parallel for performance optimization
      await Promise.all([fetchCourses(), fetchFaculty(), fetchAllStudents(), fetchSections()]);
      setLoading(false);
    };
    bootstrapData();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/courses-all', getAuthConfig());
      setCourses(res.data);
    } catch (err) { console.error("API Error: Course retrieval failed."); }
  };

  const fetchFaculty = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/faculty-list', getAuthConfig());
      setFacultyList(res.data);
    } catch (err) { console.error("API Error: Faculty registry unreachable."); }
  };

  const fetchSections = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/sections', getAuthConfig());
      setSections(res.data);
    } catch (err) { console.error("API Error: Section metadata missing."); }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users', getAuthConfig());
      setAllStudents(res.data.filter(u => u.role === 'student'));
    } catch (err) { console.error("API Error: Student data sync failed."); }
  };

  /**
   * Selection Logic: Multi-day Scheduling
   * Manages the state of active days and initializes default time slots for new courses.
   */
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      const newTimings = { ...dayTimings };
      delete newTimings[day];
      setDayTimings(newTimings);
    } else {
      setSelectedDays([...selectedDays, day]);
      setDayTimings({ ...dayTimings, [day]: { start: '09:00', end: '10:00' } });
    }
  };

  const handleTimeChange = (day, type, time) => {
    setDayTimings(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: time }
    }));
  };

  // Reset all local form states when closing modal
  const closeModal = () => {
      setShowAddModal(false);
      setIsEditMode(false);
      setEditingCourseId(null);
      setFormData({ courseCode: '', courseName: '', facultyId: '', section: '', semester: 'Spring 2026' });
      setSelectedDays([]);
      setDayTimings({});
  };

  /**
   * Edit Controller: Hydrate form with existing course data
   * Parses classTiming strings back into usable UI objects.
   */
  const openEditModal = (course) => {
      setIsEditMode(true);
      setEditingCourseId(course._id);
      setFormData({
          courseCode: course.courseCode,
          courseName: course.courseName,
          facultyId: course.faculty ? course.faculty._id : '',
          section: course.section || '',
          semester: course.semester || 'Spring 2026'
      });

      if (course.classTiming && course.classTiming !== 'Not Scheduled') {
          const days = [];
          const timings = {};
          course.classTiming.split(', ').forEach(part => {
              const [day, timeRange] = part.split(' ');
              if (day && timeRange) {
                  days.push(day);
                  const [start, end] = timeRange.split('-');
                  timings[day] = { start: start || '09:00', end: end || '10:00' };
              }
          });
          setSelectedDays(days);
          setDayTimings(timings);
      }
      setShowAddModal(true);
  };

  /**
   * Action Handler: Form Submission (Create or Update)
   * Aggregates dynamic schedule timings into a serialized string for database storage.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalTimingString = Object.entries(dayTimings)
        .map(([day, times]) => `${day} ${times.start}-${times.end}`).join(', ');

    try {
      const payload = { ...formData, classTiming: finalTimingString || 'Not Scheduled' };
      if (isEditMode) {
          await axios.put(`http://localhost:5000/api/admin/edit-course/${editingCourseId}`, payload, getAuthConfig());
      } else {
          await axios.post('http://localhost:5000/api/admin/create-course', payload, getAuthConfig());
      }
      closeModal();
      fetchCourses();
    } catch (err) { alert(err.response?.data?.error || "Commit Error: Data rejected by backend."); }
  };

  const handleDelete = async (courseCode) => {
    if (window.confirm("Action Irreversible: Delete this curriculum entry?")) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/delete-course/${courseCode}`, getAuthConfig());
        fetchCourses();
      } catch (err) { alert("Deletion Error: Reference constraint violation."); }
    }
  };

  // Opens modal to assign/enroll students to a specific course
  const openAssignModal = (course) => {
    setCurrentCourse(course);
    setSelectedStudentIds(course.students || []);
    setStudentSearch('');
    setShowAssignModal(true);
  };

  /**
   * Action Handler: Batch Enrollment (Roster Management)
   * Syncs the selected student IDs with the course roster on the database.
   */
  const handleAssignSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/admin/assign-students', {
        courseCode: currentCourse.courseCode,
        studentIds: selectedStudentIds
      }, getAuthConfig());
      setShowAssignModal(false);
      fetchCourses();
    } catch (err) { alert("Sync Error: Batch roster update failed."); }
  };

  // Local Search Logic: Filter students based on Name, ID, or Section cluster
  const searchLower = studentSearch.toLowerCase().trim();
  const searchedStudents = allStudents.filter(s => {
    const matchName = s.name.toLowerCase().includes(searchLower);
    const matchId = s.id.toLowerCase().includes(searchLower);
    const secVal = s.section ? s.section.toLowerCase() : '';
    return matchName || matchId || secVal.includes(searchLower);
  });

  if (loading) return <div className="flex h-screen bg-[#0a0c14] items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48}/></div>;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0a0c14] text-gray-200 font-sans overflow-hidden">
      
      {/* SIDEBAR: Navigation Module */}
      <aside className="hidden lg:flex w-72 bg-[#0f111a] border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"><Brain className="text-white w-6 h-6"/></div>
          <h1 className="text-2xl font-black text-white tracking-tighter">Academia<span className="text-blue-500">AI</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => navigate('/admin')} />
          <NavItem icon={<Users size={20}/>} label="Manage Users" onClick={() => navigate('/admin/manage-users')} />
          <NavItem icon={<CheckCircle2 size={20}/>} label="Take Attendance" onClick={() => navigate('/admin/take-attendance')} />
          <NavItem icon={<BookOpen size={20}/>} label="Curriculum" active={true} />
          <NavItem icon={<Brain size={20}/>} label="AI Insights" onClick={() => navigate('/admin/ai-insights')} />
        </nav>
        <div className="p-6 border-t border-gray-800">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-gray-500 hover:text-red-400 w-full p-4 font-bold transition-all"><LogOut size={20} /> <span>Sign Out</span></button>
        </div>
      </aside>

      {/* VIEWPORT: Content Module */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0c14]">
        <div className="p-6 lg:p-10 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div className="text-left">
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">Curriculum Control</h1>
                <p className="text-gray-500 font-medium italic">Define subject clusters, assign leads, and monitor registries.</p>
            </div>
            <button onClick={() => { closeModal(); setShowAddModal(true); }} className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"><PlusCircle size={18}/> Create Entry</button>
        </div>

        {/* GRID DISPLAY: Courses Metadata Cards */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {courses.map(course => (
                    <div key={course._id} className="bg-[#121421] border border-gray-800 rounded-[32px] p-8 flex flex-col hover:border-blue-500/30 transition-all shadow-lg group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-2">
                                <span className="bg-[#161a26] text-gray-400 border border-gray-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">{course.courseCode}</span>
                                <span className="bg-purple-900/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest uppercase">Sec {course.section || 'N/A'}</span>
                            </div>
                            {/* Management Actions */}
                            <div className="flex items-center gap-3">
                                <button onClick={() => openEditModal(course)} className="text-gray-600 hover:text-blue-500 transition-colors" title="Modify Metadata"><Edit size={16}/></button>
                                <button onClick={() => handleDelete(course.courseCode)} className="text-gray-600 hover:text-red-500 transition-colors" title="Purge Record"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-6 tracking-tight leading-tight group-hover:text-blue-400 transition-colors text-left uppercase">{course.courseName}</h3>

                        <div className="flex items-center gap-3 mb-8 bg-[#0a0c14]/50 p-3 rounded-2xl border border-gray-800/50 w-fit pr-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                {course.faculty?.name ? course.faculty.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter leading-none mb-1">Assigned Lead</span>
                                <span className="text-sm font-bold text-gray-300 tracking-tight">{course.faculty?.name || 'Unassigned'}</span>
                            </div>
                        </div>

                        {/* Telemetry Snapshot */}
                        <div className="mt-auto space-y-4 text-left">
                            <div className="flex items-center gap-3 text-sm text-gray-500 font-bold">
                                <Users size={16} className="text-blue-500"/>
                                <span><strong className="text-white">{course.students ? course.students.length : 0}</strong> Registered Students</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm text-gray-500 font-bold">
                                <Calendar size={16} className="text-emerald-500 shrink-0 mt-0.5"/>
                                <span className="leading-snug">{course.classTiming || 'Schedule Unavailable'}</span>
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between items-center">
                            <button onClick={() => openAssignModal(course)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white bg-[#161a26] hover:bg-gray-800 px-4 py-2.5 rounded-xl transition-all shadow-inner"><UserPlus size={14} /> Assign Roster</button>
                            <button onClick={() => navigate(`/admin/ai-insights?course=${course.courseCode}`)} className="text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-blue-400 transition-colors">Analytics <ChevronRight size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </main>

      {/* MODAL: PERSISTENCE (Course Add/Edit Form) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#05060a]/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-[#161925] p-10 rounded-[40px] border border-gray-800 w-full max-w-lg shadow-2xl relative text-left">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-white tracking-tighter">{isEditMode ? 'Modify Record' : 'New Curriculum'}</h2>
                <button type="button" onClick={closeModal} className="text-gray-500 hover:text-white"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <InputField label="Course ID" placeholder="e.g. CS-401" value={formData.courseCode} onChange={(e) => setFormData({...formData, courseCode: e.target.value.toUpperCase()})} />
                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 mb-2 block">Cluster/Sec</label>
                  <select required value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} className="w-full bg-[#0a0c14] border border-gray-800 text-white rounded-xl py-4 px-4 outline-none focus:border-blue-600 appearance-none text-sm font-bold [color-scheme:dark]">
                      <option value="" disabled>Select...</option>
                      {sections.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <InputField label="Curriculum Name" placeholder="e.g. Machine Learning" value={formData.courseName} onChange={(e) => setFormData({...formData, courseName: e.target.value})} />
              
              <div>
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 mb-3 block">Schedule Availability</label>
                <div className="grid grid-cols-6 gap-2">
                    {DAYS_OF_WEEK.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)} className={`py-3 rounded-xl text-[10px] font-black transition-all border ${selectedDays.includes(day) ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-[#0a0c14] border-gray-800 text-gray-600'}`}>{day.toUpperCase()}</button>
                    ))}
                </div>
              </div>

              {/* Dynamic Time Input rendering for selected days */}
              {selectedDays.length > 0 && (
                <div className="space-y-3 max-h-44 overflow-y-auto p-1 custom-scrollbar">
                    {selectedDays.map(day => (
                        <div key={day} className="bg-[#0a0c14] border border-gray-800 p-4 rounded-2xl flex items-center gap-4">
                            <span className="text-[11px] font-black text-blue-500 uppercase w-10">{day}</span>
                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <input type="time" value={dayTimings[day]?.start || "09:00"} onChange={(e) => handleTimeChange(day, 'start', e.target.value)} className="bg-transparent border border-gray-700 rounded-lg px-2 py-2 text-white text-xs font-bold outline-none [color-scheme:dark]" />
                                <input type="time" value={dayTimings[day]?.end || "10:00"} onChange={(e) => handleTimeChange(day, 'end', e.target.value)} className="bg-transparent border border-gray-700 rounded-lg px-2 py-2 text-white text-xs font-bold outline-none [color-scheme:dark]" />
                            </div>
                        </div>
                    ))}
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 mb-2 block">Faculty Allocation</label>
                <select required value={formData.facultyId} onChange={(e) => setFormData({...formData, facultyId: e.target.value})} className="w-full bg-[#0a0c14] border border-gray-800 text-white rounded-xl py-4 px-4 outline-none focus:border-blue-600 appearance-none text-sm font-bold [color-scheme:dark]">
                    <option value="" disabled>Search Faculty Registry...</option>
                    {facultyList.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] text-white shadow-2xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95">
                  {isEditMode ? 'Commit Database Update' : 'Initialize New Module'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ROSTER SYNC (Assign Students) */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-[#05060a]/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-[#161925] p-10 rounded-[40px] border border-gray-800 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] text-left">
            <div className="flex justify-between items-start mb-8 shrink-0">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">Profile Aggregation</h2>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mt-1">Target Curriculum: {currentCourse?.courseCode}</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-white transition-all hover:rotate-90"><X size={24}/></button>
            </div>
            
            <div className="relative mb-6 shrink-0 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={20}/>
                <input type="text" placeholder="Filter by Name, System ID, or Section Cluster..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="w-full bg-[#0a0c14] border border-gray-800 text-white rounded-[20px] py-4 pl-14 pr-6 outline-none focus:border-blue-600 text-sm font-bold placeholder-gray-800 shadow-inner" />
            </div>

            <div className="flex items-center justify-between px-6 py-4 mb-4 bg-[#0a0c14] rounded-2xl border border-gray-800 shrink-0 shadow-inner">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg border-gray-700 bg-gray-900 text-blue-600 cursor-pointer accent-blue-600"
                        checked={searchedStudents.length > 0 && searchedStudents.every(s => selectedStudentIds.includes(s._id))}
                        onChange={(e) => {
                            if (e.target.checked) {
                                const allIds = new Set([...selectedStudentIds, ...searchedStudents.map(s => s._id)]);
                                setSelectedStudentIds([...allIds]);
                            } else {
                                const searchedIds = searchedStudents.map(s => s._id);
                                setSelectedStudentIds(selectedStudentIds.filter(id => !searchedIds.includes(id)));
                            }
                        }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">Select All Filtered</span>
                </label>
                <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/10 uppercase tracking-widest">{searchedStudents.length} Nodes Found</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {searchedStudents.map(student => (
                    <label key={student._id} className={`flex items-center gap-5 p-5 rounded-[24px] cursor-pointer border transition-all ${selectedStudentIds.includes(student._id) ? 'bg-blue-600/10 border-blue-500/30 shadow-lg' : 'bg-[#0a0c14] border-gray-800/50 hover:border-gray-700'}`}>
                        <input type="checkbox" checked={selectedStudentIds.includes(student._id)} onChange={() => setSelectedStudentIds(prev => prev.includes(student._id) ? prev.filter(id => id !== student._id) : [...prev, student._id])} className="w-5 h-5 rounded-lg border-gray-700 bg-gray-900 text-blue-600 accent-blue-600" />
                        <div className="flex-1 flex justify-between items-center">
                            <div>
                                <div className="text-base font-bold text-white tracking-tight leading-none mb-1">{student.name}</div>
                                <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{student.id}</div>
                            </div>
                            <span className="text-[9px] bg-white/5 text-gray-500 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border border-white/5 shadow-inner">Sec {student.section || 'N/A'}</span>
                        </div>
                    </label>
                ))}
            </div>
            
            <div className="mt-8 flex justify-between items-center shrink-0 border-t border-gray-800 pt-8">
                <div className="text-xs font-black text-gray-600 uppercase tracking-widest"><strong className="text-blue-500 text-4xl tracking-tighter mr-2">{selectedStudentIds.length}</strong> Identities Selected</div>
                <button onClick={handleAssignSubmit} className="bg-blue-600 hover:bg-blue-500 py-4 px-10 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center gap-3"><CheckCircle2 size={20}/> Synchronize Roster</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// UI ATOMS: Reusable Components
const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4.5 rounded-[22px] transition-all duration-300 font-bold mb-1.5 ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-gray-500 hover:text-white hover:bg-[#161a26]'}`}>{icon} <span className="text-sm tracking-tight">{label}</span></button>
);

const InputField = ({ label, placeholder, value, onChange }) => (
  <div className="w-full text-left">
      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 mb-2 block">{label}</label>
      <input type="text" required placeholder={placeholder} value={value} onChange={onChange} className="w-full bg-[#0a0c14] border border-gray-800 text-white rounded-xl py-4 px-5 focus:outline-none focus:border-blue-600 font-bold placeholder-slate-800 text-sm tracking-tight" />
  </div>
);

export default AdminCourses;