import React, { useState } from 'react';
import { X, Copy, Check, Database, Terminal, Shield, Sparkles, ExternalLink } from 'lucide-react';
import { SUPABASE_SETUP_SQL } from '../lib/supabaseSql';

interface SupabaseSqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSqlModal: React.FC<SupabaseSqlModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2 font-dodum">
                Supabase DB 테이블 및 RLS 보안 정책 SQL
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  v2 Ready
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-handwriting text-sm">
                사내 인가 사용자 전용 Row Level Security 및 CSV 누적 테이블 스키마
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 font-dodum flex-1">
          {/* Guide steps */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600" />
              Supabase 적용 방법 가이드
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 text-xs leading-relaxed">
              <li>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  Supabase 대시보드 <ExternalLink className="w-3 h-3" />
                </a>
                로 이동하여 프로젝트를 선택합니다.
              </li>
              <li>좌측 메뉴에서 <strong>SQL Editor</strong>를 클릭하고 <strong>New Query</strong>를 생성합니다.</li>
              <li>아래의 SQL 쿼리를 전체 복사하여 붙여넣은 뒤 <strong>Run</strong> 버튼을 실행합니다.</li>
              <li>실행 완료 후 <code>tasks</code> 및 <code>categories</code> 테이블과 인가 사용자 전용 RLS 정책이 자동 활성화됩니다.</li>
            </ol>
          </div>

          {/* Code block with copy button */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                schema_and_rls.sql
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans transition-colors font-medium text-xs shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사 완료!' : 'SQL 복사하기'}</span>
              </button>
            </div>
            <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-[340px] text-emerald-300/90 select-all">
              {SUPABASE_SETUP_SQL}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-handwriting">
            * 인가된 사용자(authenticated users)만 본인의 일정 및 CSV 누적 데이터에 접근할 수 있습니다.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
