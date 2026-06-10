import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, Search, Mail, 
  Brain, LogOut, Trash2, Loader2,  
  PlusCircle, FileUp, AlertCircle, CheckCircle2,
  LayoutDashboard, Building, Layers, Edit, X, ChevronRight
} from 'lucide-react';

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', email: '', department: '', section: '', batch: '', role: 'student', password: 'password123' 
  });

  const getAuthConfig = () => {
      const token = localStorage.getItem('token');
      return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    const bootstrapData = async () => {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchDepartments(), fetchSections()]);
        setLoading(false);
    };
    bootstrapData();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users', getAuthConfig());
      setUsers(res.data);
    } catch (err) { console.error("Telemetry Error: User Fetch Failed"); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/departments', getAuthConfig());
      setDepartments(res.data);
    } catch (err) { console.error("Schema Error: Dept data unreachable"); }
  };

  const fetchSections = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/sections', getAuthConfig());
      setSections(res.data);
    } catch (err) { console.error("Schema Error: Section data unreachable"); }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.role === 'faculty') delete payload.batch;

      if (isEditMode) {
          await axios.put(`http://localhost:5000/api/admin/edit-user/${editingUserId}`, payload, getAuthConfig());
      } else {
          const endpoint = payload.role === 'faculty' ? '/api/admin/add-faculty' : '/api/admin/add-student';
          await axios.post(`http://localhost:5000${endpoint}`, payload, getAuthConfig());
      }
      closeUserModal();
      fetchUsers();
    } catch (err) { alert(err.response?.data?.error || "Commit Error: DB Write Failed"); }
  };

  const closeUserModal = () => {
      setShowAddModal(false);
      setIsEditMode(false);
      setEditingUserId(null);
      setFormData({ name: '', email: '', department: '', section: '', batch: '', role: 'student', password: 'password123' });
  };

  const openEditModal = (user) => {
      setIsEditMode(true);
      setEditingUserId(user._id);
      setFormData({
          name: user.name,
          email: user.email,
          department: user.department || '',
          section: user.section || '',
          batch: user.batch || '',
          role: user.role,
          password: ''
      });
      setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Action Irreversible: Permanently purge this user profile?")) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/delete-user/${id}`, getAuthConfig());
        fetchUsers();
      } catch (err) { alert("Deletion Failure: Access Denied or Reference Constraint."); }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.section && u.section.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="flex h-screen bg-[#0a0c14] items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48}/></div>;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0a0c14] text-slate-200 font-sans overflow-hidden">
      
      {/* ENTERPRISE NAVIGATION */}
      <aside className="hidden lg:flex w-72 bg-[#0f111a] border-r border-white/5 flex-col shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20"><Brain className="text-white w-6 h-6"/></div>
          <h1 className="text-2xl font-black text-white tracking-tighter">Academia<span className="text-blue-500">AI</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => navigate('/admin')} />
          <NavItem icon={<Users size={20}/>} label="Identity Hub" active={true} />
          <NavItem icon={<CheckCircle2 size={20}/>} label="Attendance Hub" onClick={() => navigate('/admin/take-attendance')} />
          <NavItem icon={<BookOpen size={20}/>} label="Curriculum" onClick={() => navigate('/admin/courses')} />
          <NavItem icon={<Brain size={20}/>} label="AI Insights" onClick={() => navigate('/admin/ai-insights')} />
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-slate-500 hover:text-red-400 w-full p-4 font-bold transition-all hover:bg-red-400/5 rounded-2xl"><LogOut size={20} /> <span className="text-sm">Sign Out</span></button>
        </div>
      </aside>

      {/* VIEWPORT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0c14]">
        <div className="p-6 lg:p-10 pb-4 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 shrink-0">
            <div className="text-left">
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Identity Hub</h1>
                <p className="text-slate-500 font-medium italic">Advanced user provisioning and administrative control.</p>
            </div>
            <div className="flex flex-wrap gap-3">
                <ActionBtn icon={<Layers size={18}/>} label="New Sec" onClick={() => setShowSectionModal(true)} />
                <ActionBtn icon={<Building size={18}/>} label="New Dept" onClick={() => setShowDeptModal(true)} />
                <button onClick={() => setShowBulkModal(true)} className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"><FileUp size={18}/> Bulk Importer</button>
                <button onClick={() => { closeUserModal(); setShowAddModal(true); }} className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-blue-600/20 active:scale-95"><PlusCircle size={18}/> Manual Entry</button>
            </div>
        </div>

        {/* SMART SEARCH */}
        <div className="px-6 lg:px-10 mt-6 shrink-0 group">
            <div className="relative max-w-4xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={22}/>
                <input type="text" placeholder="Search Identity by Name, Email, or Section..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#121421] border border-white/5 text-white rounded-[24px] py-5 pl-14 pr-6 focus:outline-none focus:border-blue-600 transition-all font-bold placeholder-slate-700 shadow-2xl text-sm"/>
            </div>
        </div>

        {/* REGISTRY LIST */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 custom-scrollbar">
            <div className="grid grid-cols-1 gap-4 pb-20">
                <AnimatePresence>
                {filteredUsers.map(user => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={user._id} 
                        className="bg-[#121421] border border-white/5 rounded-[28px] p-6 flex flex-col md:flex-row items-center justify-between hover:border-blue-500/20 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-6 w-full">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${user.role === 'faculty' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' : 'bg-blue-500/10 text-blue-500 border border-blue-500/10'}`}>
                                {user.initials || user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left flex-1">
                                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                    <h3 className="text-xl font-black text-white tracking-tight">{user.name}</h3>
                                    <span className={`text-[9px] px-3 py-1 rounded-lg uppercase tracking-widest font-black border ${user.role === 'faculty' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-blue-500/5 text-blue-500 border-blue-500/10'}`}>
                                        {user.role}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-y-2 gap-x-6 text-[11px] font-bold text-slate-500">
                                    <span className="flex items-center gap-2 transition-colors group-hover:text-slate-300"><Mail size={14} className="text-blue-500"/> {user.email}</span>
                                    <span className="flex items-center gap-2 transition-colors group-hover:text-slate-300"><Building size={14} className="text-indigo-500"/> {user.department || 'Unassigned'}</span>
                                    {user.section && <span className="bg-white/5 px-2.5 py-1 rounded-md text-slate-400 font-black tracking-widest border border-white/5">SEC {user.section}</span>}
                                    {user.batch && <span className="bg-white/5 px-2.5 py-1 rounded-md text-slate-400 font-black tracking-widest border border-white/5">BATCH {user.batch}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 mt-6 md:mt-0 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-6 md:pt-0">
                            <div className="text-left md:text-right">
                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mb-1">System Identifier</p>
                                <p className="text-sm font-black text-slate-400 tracking-wider font-mono">{user.id}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <button onClick={() => openEditModal(user)} className="p-3.5 bg-white/5 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"><Edit size={18}/></button>
                                <button onClick={() => handleDelete(user._id)} className="p-3.5 bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
        </div>
      </main>

      {/* COMPACT MODALS: DEPT & SECTION */}
      <UtilityModal show={showDeptModal} onClose={() => setShowDeptModal(false)} title="New Department" onSubmit={(e) => { e.preventDefault(); /* ... same handleAddDepartment logic ... */ }}>
          <InputField label="Department Name" placeholder="Computer Science" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} />
      </UtilityModal>

      <UtilityModal show={showSectionModal} onClose={() => setShowSectionModal(false)} title="New Section" onSubmit={(e) => { e.preventDefault(); /* ... same handleAddSection logic ... */ }}>
          <InputField label="Section Alias" placeholder="6P, A, B, etc." value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} />
      </UtilityModal>

      {/* BULK IMPORTER MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-[#05060a]/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-[#161925] p-10 rounded-[40px] border border-white/5 w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500"></div>
            
            <div className="flex justify-between items-start mb-10 text-left">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">Bulk Import Wizard</h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Batch process identity records via standardized CSV.</p>
                </div>
                <button onClick={() => setShowBulkModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={20}/></button>
            </div>

            <div className="mb-8 text-left">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-3 block">Roster Target Role</label>
                <div className="flex gap-4">
                    <button type="button" onClick={() => setFormData({...formData, role: 'student'})} className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all border ${formData.role === 'student' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-[#0a0c14] border-white/5 text-slate-600'}`}>Students</button>
                    <button type="button" onClick={() => setFormData({...formData, role: 'faculty'})} className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all border ${formData.role === 'faculty' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20' : 'bg-[#0a0c14] border-white/5 text-slate-600'}`}>Faculty</button>
                </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 mb-8 flex items-start gap-5 text-left">
                <AlertCircle className="text-blue-500 shrink-0" size={24}/>
                <div>
                    <h4 className="text-blue-400 font-black text-[11px] uppercase tracking-[0.2em] mb-2">CSV Schema Requirement</h4>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 font-medium">Header row must exactly match these keys (Order doesn't matter):</p>
                    <div className="flex flex-wrap gap-2 font-mono text-[10px] font-bold">
                        {['name', 'email', 'department', 'section', 'batch'].map(key => (
                            <span key={key} className="bg-[#0a0c14] text-white px-2.5 py-1.5 rounded-lg border border-white/5">{key}</span>
                        ))}
                    </div>
                </div>
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-6">
                <div className="relative group">
                    <input type="file" accept=".csv" onChange={(e) => setSelectedFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="border-2 border-dashed border-white/5 group-hover:border-emerald-500/40 rounded-[32px] p-12 flex flex-col items-center justify-center transition-all bg-[#0a0c14]/50">
                        <div className="w-20 h-20 bg-white/5 group-hover:bg-emerald-500/10 text-slate-600 group-hover:text-emerald-500 rounded-3xl flex items-center justify-center mb-4 transition-all duration-500"><FileUp size={40}/></div>
                        <p className="text-sm font-bold text-slate-500 group-hover:text-white transition-colors tracking-tight">{selectedFile ? selectedFile.name : 'Drag & Drop CSV Telemetry'}</p>
                    </div>
                </div>
                <button type="submit" disabled={uploading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] text-white transition-all shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95">
                    {uploading ? <Loader2 className="animate-spin" size={20}/> : <><CheckCircle2 size={18}/> Execute Import Protocol</>}
                </button>
            </form>
          </div>
        </div>
      )}

      {/* USER FORM MODAL (ADD/EDIT) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#05060a]/95 backdrop-blur-xl flex items-center justify-center z-[70] p-4 text-left">
          <form onSubmit={handleManualSubmit} className="bg-[#161925] p-10 rounded-[40px] border border-white/5 w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 relative">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">{isEditMode ? 'Modify Identity' : 'Provision User'}</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">{isEditMode ? 'Updating persistence record' : 'Initializing new manual record'}</p>
                </div>
                <button type="button" onClick={closeUserModal} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-slate-500 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-3 block">Permission Role</label>
                <div className="flex gap-4">
                    <button type="button" onClick={() => setFormData({...formData, role: 'student'})} disabled={isEditMode} className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all border ${formData.role === 'student' ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20' : 'bg-[#0a0c14] border-white/5 text-slate-600'} disabled:opacity-30`}>Student</button>
                    <button type="button" onClick={() => setFormData({...formData, role: 'faculty'})} disabled={isEditMode} className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all border ${formData.role === 'faculty' ? 'bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-600/20' : 'bg-[#0a0c14] border-white/5 text-slate-600'} disabled:opacity-30`}>Faculty</button>
                </div>
              </div>

              <InputField label="Identity Name" placeholder="e.g., Sarah Connor" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <InputField label="Academic Email" type="email" placeholder="sarah@academia.ai" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-2 block">Organization</label>
                    <div className="relative">
                        <select required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-[#0a0c14] border border-white/5 text-white rounded-2xl py-4 pl-5 pr-10 focus:outline-none focus:border-blue-600 transition-all font-bold appearance-none cursor-pointer text-sm [color-scheme:dark]">
                          <option value="" disabled>Select Department</option>
                          {departments.map(dept => <option key={dept._id} value={dept.name}>{dept.name}</option>)}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-600 pointer-events-none" size={16}/>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-2 block">Section</label>
                    <div className="relative">
                        <select required value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} className="w-full bg-[#0a0c14] border border-white/5 text-white rounded-2xl py-4 pl-5 pr-10 focus:outline-none focus:border-blue-600 transition-all font-bold appearance-none cursor-pointer text-sm [color-scheme:dark]">
                          <option value="" disabled>Select Alias</option>
                          {sections.map(sec => <option key={sec._id} value={sec.name}>{sec.name}</option>)}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-600 pointer-events-none" size={16}/>
                    </div>
                  </div>
              </div>

              {formData.role === 'student' && (
                <InputField label="Enrollment Batch" placeholder="2026" value={formData.batch} onChange={(e) => setFormData({...formData, batch: e.target.value})} />
              )}
              
              <button type="submit" className={`w-full py-5 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] transition-all mt-6 text-white shadow-2xl active:scale-95 ${formData.role === 'faculty' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'}`}>
                {isEditMode ? 'Update Identity Profile' : `Initialize ${formData.role} record`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// UI ATOMS
const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>{icon} <span className="text-sm tracking-tight">{label}</span></button>
);

const ActionBtn = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="px-5 py-4 bg-white/5 border border-white/5 hover:border-slate-500 text-slate-400 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95">{icon} {label}</button>
);

const UtilityModal = ({ show, onClose, title, onSubmit, children }) => show && (
    <div className="fixed inset-0 bg-[#05060a]/95 backdrop-blur-xl flex items-center justify-center z-[100] p-4 text-left">
        <form onSubmit={onSubmit} className="bg-[#161925] p-10 rounded-[40px] border border-white/5 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white tracking-tighter">{title}</h2>
                <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={16}/></button>
            </div>
            {children}
            <div className="flex gap-4 mt-8">
                <button type="button" onClick={onClose} className="flex-1 py-4 bg-[#0a0c14] text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/5 hover:text-white transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">Commit</button>
            </div>
        </form>
    </div>
);

const InputField = ({ label, type = "text", placeholder, value, onChange }) => (
  <div className="text-left">
      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-2 block">{label}</label>
      <input type={type} required placeholder={placeholder} value={value} onChange={onChange} className="w-full bg-[#0a0c14] border border-white/5 text-white rounded-2xl py-4 px-5 focus:outline-none focus:border-blue-600 transition-all font-bold placeholder-slate-800 text-sm tracking-tight" />
  </div>
);

export default ManageUsers;