import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Brain, LayoutDashboard, Users, CheckCircle, BookOpen, LogOut, 
  Search, BellRing, AlertTriangle, Lightbulb, ArrowUpRight, Loader2, Filter
} from 'lucide-react';

const AIInsights = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [insightsData, setInsightsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState('ALL');

  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Administrator', role: 'admin' };

  const getAuthConfig = () => {
      const token = localStorage.getItem('token');
      return { headers: { Authorization: `Bearer ${token}` } };
  };

  /**
   * Predictive Analysis Fetching:
   * Requests real-time risk telemetry based on administrative section filters.
   */
  useEffect(() => {
      const fetchAIInsights = async () => {
          setLoading(true);
          try {
              const query = selectedSection !== 'ALL' ? `?section=${selectedSection}` : '';
              const res = await axios.get(`http://localhost:5000/api/insights/risk-radar${query}`, getAuthConfig());
              setInsightsData(res.data);
          } catch (err) {
              if (err.response?.status === 401) {
                  navigate('/');
              }
          } finally {
              setLoading(false);
          }
      };
      fetchAIInsights();
  }, [selectedSection, navigate]);

  const filteredInsights = insightsData.filter(item => 
    item.student?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.course?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0b0e14] text-slate-200 font-sans text-left selection:bg-purple-500/30">
      
      {/* ENTERPRISE SIDEBAR */}
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
            <NavItem icon={<BookOpen size={20}/>} label="Courses" onClick={() => navigate('/admin/courses')} />
            <NavItem icon={<Brain size={20}/>} label="AI Insights" active />
          </nav>
        </div>
        
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-slate-500 hover:text-red-400 p-4 rounded-2xl transition-all hover:bg-red-400/5 group">
          <LogOut size={20}/> <span className="font-bold text-sm">Sign Out</span>
        </button>
      </aside>

      {/* VIEWPORT CONTENT */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-[1400px] mx-auto w-full">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="text-purple-500" size={32} />
              <h1 className="text-3xl font-black tracking-tight text-white">Risk Intelligence</h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">Identifying academic vulnerabilities through predictive telemetry.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select 
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="appearance-none bg-white/5 border border-white/5 rounded-xl py-3 pl-11 pr-10 focus:outline-none focus:border-purple-500 transition-all text-xs font-bold text-slate-300 cursor-pointer [color-scheme:dark]"
              >
                <option value="ALL">All Sections</option>
                <option value="6P">Section 6P</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>
            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search Identity..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:border-purple-500 transition-all text-xs font-bold text-slate-300 placeholder-slate-600"
              />
            </div>
          </div>
        </header>

        {loading ? (
           <div className="flex flex-col items-center justify-center py-40 bg-white/5 rounded-[40px] border border-dashed border-white/10">
              <Loader2 className="animate-spin text-purple-500 mb-6" size={48} />
              <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Processing Risk Matrix...</p>
           </div>
        ) : (
          <div className="space-y-6 pb-20">
            {filteredInsights.length > 0 ? (
              filteredInsights.map((insight, idx) => (
                <RiskCard key={insight.id || idx} data={insight} navigate={navigate} />
              ))
            ) : (
              <div className="text-center py-32 bg-white/5 border border-white/5 rounded-[40px]">
                <Brain size={64} className="mx-auto text-slate-800 mb-6"/>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                  Zero critical interventions detected for the selected parameters.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// UI Atoms
const NavItem = ({ icon, label, active = false, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold ${active ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    {icon} <span className="text-sm tracking-tight">{label}</span>
  </button>
);

const RiskCard = ({ data, navigate }) => {
  const isHighRisk = data.riskLevel === 'High Risk';
  
  return (
    <div className={`group bg-[#121421] rounded-[32px] border border-white/5 p-8 flex flex-col lg:flex-row gap-10 hover:border-purple-500/30 transition-all shadow-2xl relative overflow-hidden`}>
      {/* Risk Indicator Bar */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${isHighRisk ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`} />

      <div className="flex-1 text-left min-w-[300px]">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${isHighRisk ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
            {data.riskLevel}
          </span>
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-lg">Score: {data.score}</span>
          {data.section && (
            <span className="bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-purple-500/10 tracking-widest">
              Sec {data.section}
            </span>
          )}
        </div>
        <h3 className="text-3xl font-black text-white tracking-tighter mb-1 group-hover:text-purple-400 transition-colors">{data.student}</h3>
        <p className="text-slate-500 text-sm font-medium mb-8 italic">{data.course}</p>
        
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div className="bg-[#0b0e14] border border-white/5 rounded-2xl p-4 flex flex-col items-start justify-center">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Attendance</span>
            <span className={`text-xl font-black ${isHighRisk ? 'text-red-400' : 'text-slate-200'}`}>{data.attendance}</span>
          </div>
          <div className="bg-[#0b0e14] border border-white/5 rounded-2xl p-4 flex flex-col items-start justify-center">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Grade Path</span>
            <span className="text-xl font-black text-slate-200">{data.grade}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 text-left">
        <h4 className="flex items-center gap-2 text-slate-300 text-xs font-black uppercase tracking-widest mb-6">
          <AlertTriangle size={16} className={isHighRisk ? "text-red-500" : "text-slate-500"}/> 
          Telemetry Analysis
        </h4>
        <ul className="space-y-4">
          {data.factors?.map((factor, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-slate-400 font-medium leading-snug">
              <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isHighRisk ? 'bg-red-500' : 'bg-slate-700'}`}></div>
              {factor}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col justify-between text-left">
        <div>
          <h4 className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-widest mb-6">
            <Lightbulb size={16} className="animate-pulse" /> AI Recommended Action
          </h4>
          <ul className="space-y-4 mb-8">
            {data.interventions?.map((intervention, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-400 font-medium leading-snug">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                {intervention}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={() => navigate(`/admin/manage-users`)}
            className="flex items-center gap-2 px-6 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/5 transition-all active:scale-95 shadow-xl"
          >
            Access Identity Hub <ArrowUpRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;