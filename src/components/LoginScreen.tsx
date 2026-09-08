import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, Database, CheckCircle2, AlertCircle, Settings, Sparkles, Key } from 'lucide-react';
import { getSupabase, isSupabaseConfigured, getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (user: { id: string; email: string }) => void;
  onOpenSqlGuide: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onOpenSqlGuide }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Supabase Custom Config Modal / Section
  const [showConfig, setShowConfig] = useState(false);
  const currentConfig = getSupabaseConfig();
  const [customUrl, setCustomUrl] = useState(currentConfig.url);
  const [customKey, setCustomKey] = useState(currentConfig.anonKey);
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  const configured = isSupabaseConfigured();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email || !password) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (!configured) {
      // If Supabase is not configured yet with valid URL/Key
      setErrorMessage(
        'Supabase 프로젝트 URL과 Anon Key가 아직 연결되지 않았습니다. 하단 [Supabase 설정]에서 입력하시거나, [사내 인가 사용자 데모 로그인]을 이용해 주세요.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabase();

      if (mode === 'signin') {
        // Modern Supabase v2 signInWithPassword
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          onLoginSuccess({
            id: data.user.id,
            email: data.user.email || email,
          });
        }
      } else {
        // Modern Supabase v2 signUp
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          if (data.session) {
            onLoginSuccess({
              id: data.user.id,
              email: data.user.email || email,
            });
          } else {
            setInfoMessage('회원가입이 완료되었습니다. 이메일 인증 후 로그인하거나 로그인 창에서 바로 시도해 보세요.');
            setMode('signin');
          }
        }
      }
    } catch (err: any) {
      console.error('Supabase auth error:', err);
      setErrorMessage(err?.message || '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    onLoginSuccess({
      id: 'internal-corporate-user-101',
      email: 'authorized_manager@corporate.internal',
    });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(customUrl, customKey);
    setConfigSavedNotice(true);
    setTimeout(() => {
      setConfigSavedNotice(false);
      setShowConfig(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-dodum">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-lg mb-2">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2 font-handwriting">
            사내 인가 사용자 인증
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-handwriting">
            Supabase Auth & Database 기반 보안 일정 관리 시스템
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              로그인 (Sign In)
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              신규 계정 등록 (Sign Up)
            </button>
          </div>

          {/* Alert Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 text-rose-300 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 rounded-xl text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{infoMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>사내 업무 이메일</span>
                <span className="text-[11px] text-slate-500 font-mono">auth.users</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-slate-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>비밀번호</span>
                <span className="text-[11px] text-slate-500 font-mono">6자 이상</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-slate-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span>처리 중...</span>
              ) : (
                <>
                  <span>{mode === 'signin' ? '사내 시스템 로그인' : '인가 계정 등록하기'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Actions Divider */}
          <div className="relative flex items-center justify-center pt-2">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-mono absolute">
              또는
            </span>
          </div>

          {/* Demo Login Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>사내 인가 사용자 데모 계정으로 즉시 시작</span>
          </button>

          {/* Bottom links: SQL Guide & Supabase config */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={onOpenSqlGuide}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-mono"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>Supabase DB SQL 확인</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="hover:text-slate-200 transition-colors flex items-center gap-1 font-mono"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Supabase API 설정</span>
            </button>
          </div>
        </div>

        {/* Collapsible Supabase Config Drawer */}
        {showConfig && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs text-slate-300 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                Supabase 연결 설정
              </span>
              <span className="text-[11px] text-slate-400">
                {configured ? '연결됨 (Configured)' : '미설정 (Not configured)'}
              </span>
            </div>
            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Project URL (VITE_SUPABASE_URL)</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Anon Public Key (VITE_SUPABASE_ANON_KEY)</label>
                <input
                  type="text"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-hidden font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  {configSavedNotice ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                  <span>{configSavedNotice ? '저장되었습니다!' : '설정 저장'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500">
          사내 오피스 일정 관리 시스템 &bull; 인가된 임직원 전용
        </p>
      </div>
    </div>
  );
};
