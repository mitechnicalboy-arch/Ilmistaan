import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader2, ShieldCheck, Copy, Check, AlertCircle } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import crestImage from '../../assets/images/university_portal_crest_1791113487512.jpg';

export const AuthScreen: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAcademic();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleQuickLogin = async (targetEmail: string, targetPass: string) => {
    setErrorMessage('');
    setIsSubmitting(true);
    const res = await loginWithEmail(targetEmail, targetPass);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to sign in.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isRegister) {
      if (!fullName.trim() || !email.trim() || !password) {
        setErrorMessage('All fields are required.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }

      setIsSubmitting(true);
      const res = await registerWithEmail(fullName.trim(), email.trim(), password);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed.');
      }
    } else {
      if (!email.trim() || !password) {
        setErrorMessage('Please enter both email and password.');
        return;
      }

      setIsSubmitting(true);
      const res = await loginWithEmail(email.trim(), password);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    const res = await loginWithGoogle();
    setIsSubmitting(false);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const isUnauthorizedDomain = errorMessage.includes('unauthorized-domain');

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
        {/* Brand header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-emerald-200 shadow-xs mx-auto mb-3 bg-emerald-50 flex items-center justify-center">
            <img
              src={crestImage}
              alt="University Crest"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 tracking-wide">
            ILMISTAAN
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Dawoodian's Academic Portal
          </p>
        </div>

        {/* 1-Click Fast Access Accounts (Bypasses unauthorized domain popup) */}
        <div className="mb-5 p-3.5 bg-gradient-to-br from-emerald-50/90 to-slate-50 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>1-Click Quick Access</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Instant Sign-In</span>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {/* Admin Login */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin('muhammadirteza2024@gmail.com', 'dawoodian4321')}
              className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100/90 text-purple-900 border border-purple-200 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
            >
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>Sign in as Admin (Muhammad Irteza)</span>
                  <span className="px-1.5 py-0.2 text-[9px] bg-purple-200/70 text-purple-800 rounded font-semibold uppercase">
                    Full Delete Rights
                  </span>
                </div>
                <div className="text-[10px] text-purple-600/80 font-mono truncate">
                  muhammadirteza2024@gmail.com
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Student Login */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleQuickLogin('irteza.student@university.edu', 'student123')}
              className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Sign in as Student (Muhammad Irteza)</span>
                  <span className="px-1.5 py-0.2 text-[9px] bg-emerald-100 text-emerald-800 rounded font-semibold">
                    Student
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  irteza.student@university.edu
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Unauthorized Domain Explanatory Banner */}
        {isUnauthorizedDomain && (
          <div className="mb-4 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-950">
                  Firebase Domain Authorization Note
                </strong>
                <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                  Ye error is liye aa raha hai kyunki Google OAuth Popup ke liye Firebase Console me current preview domain allowlist hona zaroori hota hai.
                </p>
              </div>
            </div>

            <div className="p-2 bg-white/80 rounded-lg border border-amber-200 text-[10px] space-y-1">
              <span className="text-slate-500 block">Current Preview Domain:</span>
              <div className="flex items-center justify-between gap-1 font-mono text-slate-800 break-all">
                <span>{currentHostname}</span>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-amber-800">
              💡 Aap upar diye gaye <strong>"1-Click Quick Access"</strong> buttons se direct login kar sakte hain bina kisi error ke!
            </p>
          </div>
        )}

        {errorMessage && !isUnauthorizedDomain && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Google Sign-in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 border border-slate-300 hover:bg-slate-50 disabled:opacity-60 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2.5 transition-colors shadow-2xs mb-4 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-[11px] text-slate-400 font-medium uppercase">Or email & password</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-3 text-xs">
          {isRegister && (
            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Student Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Student Name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">University Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block font-medium text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Register Account' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle sign in / register */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {isRegister ? (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMessage('');
                }}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New student?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMessage('');
                }}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Create Student Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


