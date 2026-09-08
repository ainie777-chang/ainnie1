import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  ArrowRight, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Key, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Server, 
  ExternalLink,
  HelpCircle,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  getSupabase, 
  isSupabaseConfigured, 
  getSupabaseConfig, 
  saveSupabaseConfig,
  testSupabaseConnection 
} from '../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (user: { id: string; email: string }) => void;
  onOpenSqlGuide: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onOpenSqlGuide }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'config'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Supabase Custom Config State
  const currentConfig = getSupabaseConfig();
  const [customUrl, setCustomUrl] = useState(currentConfig.url);
  const [customKey, setCustomKey] = useState(currentConfig.anonKey);
  const [showKeyText, setShowKeyText] = useState(false);
  const [isConfigured, setIsConfigured] = useState(() => isSupabaseConfigured());

  // Connection Test State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [configSuccessNotice, setConfigSuccessNotice] = useState<string | null>(null);

  // Sync isConfigured on load and config change
  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email || !password) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage(
        'Supabase 프로젝트 URL과 Anon Key가 아직 연결되지 않았습니다. 상단 [Supabase 설정] 탭에서 입력하시거나, [사내 인가 사용자 데모 로그인]을 이용해 주세요.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabase();

      if (activeTab === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.user) {
          onLoginSuccess({
            id: data.user.id,
            email: data.user.email || email,
          });
        }
      } else if (activeTab === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.user) {
          if (data.session) {
            onLoginSuccess({
              id: data.user.id,
              email: data.user.email || email,
            });
          } else {
            setInfoMessage('인가 계정 등록이 완료되었습니다. 확인 메일 인증 후 로그인하거나 로그인 탭에서 시도해 주세요.');
            setActiveTab('signin');
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

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(customUrl, customKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || '연결 테스트 중 오류가 발생했습니다.',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    setConfigSuccessNotice(null);

    if (!customUrl.trim() || !customKey.trim()) {
      setTestResult({
        success: false,
        message: 'Supabase URL과 Anon Key를 모두 입력해 주세요.',
      });
      return;
    }

    setIsTestingConnection(true);
    // Test connection first
    const verifyRes = await testSupabaseConnection(customUrl, customKey);
    setIsTestingConnection(false);

    if (!verifyRes.success) {
      setTestResult(verifyRes);
      return;
    }

    // Save configuration
    saveSupabaseConfig(customUrl, customKey);
    const configuredStatus = isSupabaseConfigured();
    setIsConfigured(configuredStatus);

    setConfigSuccessNotice('Supabase 프로젝트 연결 설정이 성공적으로 저장 및 연동되었습니다!');
    setTestResult({
      success: true,
      message: 'Supabase 서버와 정상 통신이 확인되었습니다.',
    });

    // Auto switch to sign in after 1.5s
    setTimeout(() => {
      setConfigSuccessNotice(null);
      setActiveTab('signin');
    }, 1600);
  };

  const handleResetConfig = () => {
    saveSupabaseConfig('', '');
    setCustomUrl('');
    setCustomKey('');
    setIsConfigured(false);
    setTestResult(null);
    setConfigSuccessNotice('Supabase 설정이 초기화되었습니다.');
    setTimeout(() => setConfigSuccessNotice(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-dodum">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="w-full max-w-lg relative z-10 space-y-5">
        {/* Branding Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-lg mb-1">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2 font-handwriting">
            사내 인가 사용자 인증 시스템
          </h1>
          <p className="text-xs text-slate-400 font-handwriting">
            Supabase Cloud Auth & Database 연동 일정 관리 대시보드
          </p>
        </div>

        {/* Supabase Connection Status Bar */}
        <div className={`p-3 rounded-xl border transition-all flex items-center justify-between text-xs ${
          isConfigured 
            ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-300'
            : 'bg-amber-950/40 border-amber-800/70 text-amber-300'
        }`}>
          <div className="flex items-center space-x-2.5 truncate mr-2">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
            <div className="truncate">
              <span className="font-bold">
                {isConfigured ? 'Supabase 연동 완료' : 'Supabase 미연동'}
              </span>
              <span className="text-slate-400 text-[11px] ml-1.5 font-mono truncate hidden sm:inline">
                {customUrl ? customUrl.replace('https://', '') : '(설정 필요)'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0 ${
              activeTab === 'config'
                ? 'bg-white text-slate-900'
                : isConfigured
                  ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700'
                  : 'bg-amber-800 hover:bg-amber-700 text-white'
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>{isConfigured ? '설정 확인/수정' : 'Supabase 설정'}</span>
          </button>
        </div>

        {/* Main Interactive Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5">
          {/* Navigation Tabs (로그인 / 회원가입 / Supabase 설정) */}
          <div className="flex bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMessage(null); setInfoMessage(null); }}
              className={`flex-1 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'signin'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              로그인 (Sign In)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMessage(null); setInfoMessage(null); }}
              className={`flex-1 py-2 font-semibold rounded-lg transition-all ${
                activeTab === 'signup'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              신규 등록 (Sign Up)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('config'); setErrorMessage(null); setInfoMessage(null); }}
              className={`flex-1 py-2 font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'config'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Supabase 설정</span>
              {!isConfigured && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{infoMessage}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1 & 2: LOGIN / SIGN UP                                    */}
          {/* ============================================================== */}
          {(activeTab === 'signin' || activeTab === 'signup') && (
            <div className="space-y-4">
              {!isConfigured && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-800/80 rounded-xl text-xs text-amber-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Supabase 클라우드 설정이 필요합니다.</span>
                      <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed font-handwriting">
                        실제 사내 계정으로 로그인하려면 [Supabase 설정] 탭에 Project URL과 Anon Key를 입력해 주세요.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveTab('config')}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      <span>지금 Supabase 설정하기</span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-3.5">
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
                      placeholder="employee@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-slate-600 transition-colors"
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-slate-600 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>인증 요청 중...</span>
                    </div>
                  ) : (
                    <>
                      <span>{activeTab === 'signin' ? '사내 시스템 로그인' : '신규 인가 계정 등록'}</span>
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
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: SUPABASE CONFIGURATION (직접 연동 패널)                */}
          {/* ============================================================== */}
          {activeTab === 'config' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>Supabase API 접속 정보 연동</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenSqlGuide}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 transition-colors"
                >
                  <Database className="w-3 h-3" />
                  <span>DB SQL 스크립트</span>
                </button>
              </div>

              {/* Notice & Results */}
              {configSuccessNotice && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{configSuccessNotice}</span>
                </div>
              )}

              {testResult && (
                <div className={`p-3 border rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success 
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-800 text-rose-300'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{testResult.message}</span>
                </div>
              )}

              <form onSubmit={handleSaveConfig} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                    <span>Project URL</span>
                    <span className="text-[10px] text-slate-500 font-mono">VITE_SUPABASE_URL</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://your-project-ref.supabase.co"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-600 transition-colors font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Supabase 대시보드 → Project Settings → API 의 Project URL을 입력합니다.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                    <span>Anon Public Key</span>
                    <span className="text-[10px] text-slate-500 font-mono">VITE_SUPABASE_ANON_KEY</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showKeyText ? 'text' : 'password'}
                      required
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-600 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyText(!showKeyText)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                    >
                      {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Project API keys 중 'anon' 'public' 키를 입력합니다. (service_role 키는 입력하지 마세요)
                  </span>
                </div>

                {/* Buttons Group */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={isTestingConnection || !customUrl || !customKey}
                    onClick={handleTestConnection}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    {isTestingConnection ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    ) : (
                      <Server className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{isTestingConnection ? '연결 확인 중...' : '연결 테스트'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isTestingConnection || !customUrl || !customKey}
                    className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>설정 저장 및 연동</span>
                  </button>
                </div>

                {/* Reset & Guide Row */}
                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                  <button
                    type="button"
                    onClick={handleResetConfig}
                    className="hover:text-rose-400 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>설정값 초기화</span>
                  </button>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-mono"
                  >
                    <span>Supabase 대시보드 열기</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </form>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
            <button
              type="button"
              onClick={onOpenSqlGuide}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>Supabase DB & RLS SQL 보기</span>
            </button>
            <span className="text-slate-500 text-[10px]">
              {isConfigured ? '상태: 연결 활성화' : '상태: 미연동'}
            </span>
          </div>
        </div>

        {/* Corporate Notice */}
        <p className="text-center text-[11px] text-slate-500 font-handwriting">
          사내 오피스 및 개인 일정 관리 시스템 &bull; 인가된 임직원 전용
        </p>
      </div>
    </div>
  );
};
