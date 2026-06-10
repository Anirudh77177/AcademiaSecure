import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, ArrowRight, AlertCircle, Loader2, Fingerprint, LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Professional UI Constants
const API_BASE_URL = 'http://localhost:5000/api/auth';

const Login = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Session Persistence Check:
   * Redirects authenticated users away from login if token exists.
   */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      const routes = { faculty: '/teacher', admin: '/admin', student: '/student' };
      if (routes[role]) navigate(routes[role]);
    }
  }, [navigate]);

  /**
   * Step 1: Request Secure OTP
   */
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/request-otp`, {
        identifier: identifier.trim().toLowerCase()
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Identity verification failed.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Verify OTP & Initialize Session
   */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/verify-otp`, {
        identifier: identifier.trim().toLowerCase(),
        otp: otp.trim()
      });

      const { token, role, name, email, id, _id } = res.data;

      // Persisting session metadata
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('name', name);
      localStorage.setItem('email', email);
      localStorage.setItem('sysId', id);
      localStorage.setItem('mongoId', _id);

      const routes = { faculty: '/teacher', admin: '/admin', student: '/student' };
      if (routes[role]) {
        navigate(routes[role]);
      } else {
        setError('Unauthorized access role.');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoData = (id) => {
    setIdentifier(id);
    setStep(1);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#05060A] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden selection:bg-blue-500/30">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Brand Identity */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col items-center relative z-10">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[24px] flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.2)] mb-6 transform hover:scale-110 transition-all duration-500">
          <Fingerprint className="text-white w-10 h-10" strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter">
          Academia<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Secure</span>
        </h1>
        <p className="text-gray-500 mt-3 font-bold flex items-center gap-2 text-xs uppercase tracking-[0.3em]">
          <LockKeyhole size={14} className="text-blue-500" /> Passwordless Gateway
        </p>
      </motion.div>

      {/* Interaction Card */}
      <motion.div layout className="w-full max-w-md bg-[#0f111a]/80 backdrop-blur-3xl rounded-[40px] p-10 border border-white/5 shadow-2xl relative z-10">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold mb-8">
              <AlertCircle size={18} />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 1 ? (
          <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleRequestOtp} className="space-y-6 text-left">
            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Access Identity</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5 z-10 group-focus-within:text-blue-500" />
                <input 
                  type="text" required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email or System ID"
                  className="w-full bg-[#161a26]/50 border border-white/5 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder-gray-700"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Generate Secure OTP <ArrowRight size={18} /></>}
            </button>
          </motion.form>
        ) : (
          <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                 <ShieldCheck className="text-emerald-500 w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Code sent to</p>
                <p className="text-blue-400 text-sm font-mono font-bold">{identifier.toLowerCase()}</p>
              </div>
            </div>

            <input 
              type="text" required maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="••••••"
              className="w-full bg-[#161a26]/50 border border-white/5 text-white rounded-2xl py-5 text-center focus:outline-none focus:border-emerald-500/50 transition-all font-black text-3xl tracking-[0.4em] placeholder-gray-800"
            />

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify & Access Portal"}
            </button>

            <button type="button" onClick={() => setStep(1)} className="w-full text-center text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors py-2">
              ← Change Identity
            </button>
          </motion.form>
        )}

        {/* Demo Data Utility */}
        <div className="mt-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[1px] bg-gray-800 flex-1"></div>
            <span className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">Quick Access</span>
            <div className="h-[1px] bg-gray-800 flex-1"></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['Admin', 'Teacher', 'Student'].map((label) => (
              <button key={label} type="button" onClick={() => fillDemoData(label === 'Student' ? 'S10021' : `${label.toLowerCase()}@academia.ai`)} className="py-2.5 bg-[#161a26] border border-white/5 text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-blue-400 transition-all">
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;