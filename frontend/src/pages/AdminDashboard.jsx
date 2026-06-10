import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, Users, BookOpen, Brain, LogOut, 
  Bell, TrendingUp, AlertTriangle, CheckCircle, ArrowRight 
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

// Registration of Chart.js components for institutional trends
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // Session Recovery: Extracting user identity from persistence layer
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Administrator', role: 'admin' };
  
  // State Initialization with standardized schemas
  const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0, totalCourses: 0, avgAttendance: 0 });
  const [recentCourses, setRecentCourses] = useState([]);
  const [aiAlerts, setAiAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState({ labels: ['Loading...'], data: [0] });

  /**
   * Helper: Provides Bearer Token for authenticated API transactions
   */
  const getAuthConfig = () => {
      const token = localStorage.getItem('token');
      return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const config = getAuthConfig();

      try {
        // Parallel Data Fetching: Stats, Trends, and Analytics
        const statsRes = await axios.get('http://localhost:5000/api/admin/stats', config);
        setStats(prev => ({ ...prev, ...statsRes.data }));
        if (statsRes.data.trend) setTrend(statsRes.data.trend);

        const coursesRes = await axios.get('http://localhost:5000/api/admin/courses-all', config); 
        if (Array.isArray(coursesRes.data)) setRecentCourses(coursesRes.data.slice(0, 3));

        const insightsRes = await axios.get('http://localhost:5000/api/insights/dashboard', config); 
        if (insightsRes.data?.insights) {
            setStats(prev => ({ ...prev, avgAttendance: parseInt(insightsRes.data.insights.overallAttendancePercentage) || 0 }));
        }

        // Risk Radar Analytics: Processing Student Performance Data
        const riskRes = await axios.get('http://localhost:5000/api/insights/risk-radar', config);
        if (Array.isArray(riskRes.data)) {
            const highRiskProfiles = riskRes.data.filter(s => s.riskLevel === 'High Risk' && s.attendance !== '0%');
            setAiAlerts(highRiskProfiles); 
        }

      } catch (err) {
        if (err.response?.status === 401) {
            localStorage.clear();
            navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  // Charting Data Definition: Visualizing Attendance Trajectory
  const chartData = {
    labels: trend.labels,
    datasets: [{
      fill: true,
      label: 'Attendance Performance %',
      data: trend.data,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#3b82f6'
    }]
  };

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* PERSISTENT SIDEBAR - Enterprise Navigation */}
      <aside className="hidden lg:flex w-72 border-r border-white/5 p-8 flex-col justify-between bg-[#0b0e14] sticky top-0 h-screen shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-xl shadow-blue-600/20"><Brain size={26} className="text-white"/></div>
            <h1 className="text-2xl font-black tracking-tighter text-white">Academia<span className="text-blue-500">AI</span></h1>
          </div>
          
          <div className="bg-white/5 p-5 rounded-[24px] border border-white/5 mb-10 flex items-center gap-4 group transition-all hover:bg-white/10">
             <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                 {user.name?.charAt(0).toUpperCase()}
             </div>
             <div className="text-left overflow-hidden">
                 <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{user.role}</p>
             </div>
          </div>

          <nav className="space-y-1.5">
            <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active onClick={() => navigate('/admin')} />
            <NavItem icon={<Users size={20}/>} label="Manage Users" onClick={() => navigate('/admin/manage-users')} />
            <NavItem icon={<CheckCircle size={20}/>} label="Attendance Hub" onClick={() => navigate('/admin/take-attendance')} />
            <NavItem icon={<BookOpen size={20}/>} label="Course Catalog" onClick={() => navigate('/admin/courses')} />
            <NavItem icon={<Brain size={20}/>} label="AI Insights" onClick={() => navigate('/admin/ai-insights')} />
          </nav>
        </div>
        
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-3 text-slate-500 hover:text-red-400 p-4 rounded-2xl transition-all hover:bg-red-400/5 group">
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform"/> <span className="font-bold text-sm">Sign Out</span>
        </button>
      </aside>

      {/* VIEWPORT CONTENT */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-[1600px] mx-auto w-full">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">System Overview</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Operational data for Sharda University</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] text-emerald-500 font-black tracking-widest uppercase">Live System Active</span>
            </div>
            <button className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all hover:bg-white/10">
              <Bell size={20}/>
            </button>
          </div>
        </header>

        {/* METRICS GRID - Visual Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Students" value={stats.totalStudents} icon={<Users size={22}/>} color="text-emerald-500" />
          <StatCard label="Faculty Core" value={stats.totalFaculty} icon={<BookOpen size={22}/>} color="text-blue-500" />
          <StatCard label="Active Courses" value={stats.totalCourses} icon={<TrendingUp size={22}/>} color="text-indigo-500" />
          <StatCard label="Avg Attendance" value={`${stats.avgAttendance}%`} icon={<CheckCircle size={22}/>} color="text-purple-500" />
        </div>

        {/* ANALYTICS SECTION */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
          {/* Recent Curricular Updates */}
          <div className="bg-[#161925] p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-lg font-bold text-white tracking-tight">Recent Courses</h3>
              <button onClick={() => navigate('/admin/courses')} className="text-blue-500 hover:text-blue-400 text-[10px] flex items-center gap-1.5 font-black uppercase tracking-widest transition-all">View All Hub <ArrowRight size={14}/></button>
            </div>
            <div className="space-y-3 relative z-10">
              {recentCourses.length > 0 ? recentCourses.map((course, idx) => (
                <CourseRow key={idx} title={course.courseName} subtitle={`${course.courseCode} • Enrolled: ${course.students?.length || 0}`} tag={course.section || "A"} />
              )) : <p className="text-slate-600 text-sm font-medium py-6 text-center">No active course metadata found.</p>}
            </div>
          </div>

          {/* AI Risk Detection Radar */}
          <div className="bg-[#161925] p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-8 text-white tracking-tight">
              <Brain size={22} className="text-purple-500"/> Performance Risk Alerts
            </h3>
            <div className="space-y-3">
              {aiAlerts.length > 0 ? aiAlerts.slice(0, 3).map((alert, i) => (
                <InsightRow key={i} title={`${alert.student}`} subtitle={`${alert.attendance} Logged • Critical Warning`} status="critical" />
              )) : <InsightRow title="Metrics Stable" subtitle="No immediate academic interventions required." status="safe" />}
            </div>
          </div>
        </div>

        {/* PERFORMANCE TRENDS */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          <div className="bg-[#161925] p-8 rounded-[32px] border border-white/5">
            <div className="flex items-center gap-2 mb-10 text-yellow-500">
              <AlertTriangle size={20}/> <h3 className="font-black text-white uppercase text-[10px] tracking-[0.2em]">Compliance Health</h3>
            </div>
            <div className="space-y-4">
              <AlertRow label="Critical Risks" count={aiAlerts.length} color="text-red-500" bg="bg-red-500" />
              <AlertRow label="Safe Roster" count={Math.max(0, stats.totalStudents - aiAlerts.length)} color="text-emerald-500" bg="bg-emerald-500" />
            </div>
          </div>

          <div className="xl:col-span-2 bg-[#161925] p-8 rounded-[32px] border border-white/5 shadow-2xl">
            <h3 className="font-bold mb-6 text-white tracking-tight">Attendance Trajectory</h3>
            <div className="h-[280px] w-full">
              <Line 
                data={chartData} 
                options={{ 
                  maintainAspectRatio: false, 
                  plugins: { legend: { display: false } }, 
                  scales: { 
                    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', font: { weight: 'bold', size: 10 } } }, 
                    x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 'bold', size: 10 } } } 
                  } 
                }} 
              />
            </div>
          </div>
        </div>

        {/* QUICK COMMAND CENTER */}
        <h3 className="text-slate-600 font-black text-[10px] tracking-[0.3em] uppercase mb-8 ml-2">Administrative Commands</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 pb-20">
          <QuickActionCard onClick={() => navigate('/admin/manage-users')} icon={<Users className="text-emerald-500"/>} title="Identity Hub" sub="Access & Directory" />
          <QuickActionCard onClick={() => navigate('/admin/take-attendance')} icon={<CheckCircle className="text-blue-500"/>} title="Log Overrides" sub="Attendance Management" />
          <QuickActionCard onClick={() => navigate('/admin/courses')} icon={<BookOpen className="text-indigo-500"/>} title="Curriculum" sub="Department Control" />
          <QuickActionCard onClick={() => navigate('/admin/ai-insights')} icon={<Brain className="text-purple-500"/>} title="Predictive AI" sub="Engagement Analytics" />
        </div>
      </main>
    </div>
  );
};

// UI ATOMS - Reusable Components for Design Consistency
const NavItem = ({ icon, label, active = false, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 ${active ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    {icon} <span className="text-sm tracking-tight">{label}</span>
  </div>
);

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-[#161925] p-8 rounded-[32px] border border-white/5 flex flex-col justify-between hover:border-blue-500/30 transition-all hover:-translate-y-1 shadow-xl">
    <div className={`p-3.5 rounded-2xl bg-white/5 w-fit mb-6 ${color} border border-white/5`}>{icon}</div>
    <div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</p>
      <h4 className="text-4xl font-black text-white tracking-tighter leading-none">{value}</h4>
    </div>
  </div>
);

const CourseRow = ({ title, subtitle, tag }) => (
  <div className="flex items-center justify-between p-5 bg-[#0b0e14]/50 hover:bg-[#0b0e14] rounded-2xl transition-all border border-white/5 group">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform"><BookOpen size={18}/></div>
      <div className="text-left">
        <h4 className="text-sm font-bold text-white tracking-tight leading-tight">{title}</h4>
        <p className="text-[11px] text-slate-500 mt-1 font-medium">{subtitle}</p>
      </div>
    </div>
    <span className="text-[10px] bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border border-blue-500/10 shrink-0">Sec {tag}</span>
  </div>
);

const InsightRow = ({ title, subtitle, status }) => (
  <div className="p-5 bg-[#0b0e14]/50 hover:bg-[#0b0e14] rounded-2xl transition-all border border-white/5">
    <div className="flex gap-4 items-center">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${status === 'critical' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
      <div className="text-left">
        <h4 className="text-[13px] font-bold text-white tracking-tight">{title}</h4>
        <p className="text-[10px] text-slate-500 mt-1 font-black uppercase tracking-widest leading-none">{subtitle}</p>
      </div>
    </div>
  </div>
);

const AlertRow = ({ label, count, color, bg }) => (
  <div className="flex items-center justify-between p-5 rounded-2xl bg-[#0b0e14]/50 border border-white/5">
    <div className="flex items-center gap-4">
      <div className={`w-2.5 h-2.5 rounded-full ${bg} shadow-lg shadow-current`}></div>
      <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{label}</span>
    </div>
    <span className={`text-2xl font-black ${color}`}>{count}</span>
  </div>
);

const QuickActionCard = ({ icon, title, sub, onClick }) => (
  <div onClick={onClick} className="bg-[#161925] p-8 rounded-[32px] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group text-left shadow-xl hover:bg-[#1c2030]">
    <div className="p-4 bg-[#0b0e14] w-fit rounded-2xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 border border-white/5">{icon}</div>
    <h4 className="font-bold text-lg mb-1 text-white tracking-tight">{title}</h4>
    <p className="text-xs text-slate-500 font-medium leading-relaxed">{sub}</p>
  </div>
);

export default AdminDashboard;