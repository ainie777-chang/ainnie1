import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download, Database, Loader2 } from 'lucide-react';
import { Task, Category } from '../types';
import { parseTasksFromCsv, downloadSampleCsv } from '../utils/csvUtils';
import { bulkAccumulateTasksToSupabase, isSupabaseConfigured } from '../lib/supabase';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  userId?: string;
  onImportSuccess: (importedTasks: Task[], message: string) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  categories,
  userId,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedTasks, setParsedTasks] = useState<Task[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setStatusMessage(null);
    setParseErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const result = parseTasksFromCsv(content, categories);
      setParsedTasks(result.tasks);
      setParseErrors(result.errors);
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSaveToSupabase = async () => {
    if (parsedTasks.length === 0) return;
    setIsProcessing(true);
    setStatusMessage(null);

    const configured = isSupabaseConfigured();

    if (configured && userId) {
      // Save directly into Supabase database (누적 저장)
      const { count, error } = await bulkAccumulateTasksToSupabase(parsedTasks, userId);
      setIsProcessing(false);

      if (error) {
        setStatusMessage(`Supabase 누적 저장 중 경고: ${error}. 로컬에 함께 누적되었습니다.`);
        onImportSuccess(parsedTasks, `로컬에 ${parsedTasks.length}건이 누적되었습니다. (Supabase 오류: ${error})`);
      } else {
        onImportSuccess(parsedTasks, `Supabase DB에 ${count}건의 일정이 성공적으로 누적 저장되었습니다!`);
        onClose();
      }
    } else {
      // Offline / Local accumulation fallback
      setIsProcessing(false);
      onImportSuccess(
        parsedTasks,
        `Supabase 연결 전이므로 ${parsedTasks.length}건이 대시보드 로컬 저장소에 누적되었습니다.`
      );
      onClose();
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedTasks([]);
    setParseErrors([]);
    setStatusMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2 font-dodum">
                CSV 데이터 Supabase 누적 저장
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  Bulk Accumulate
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-handwriting text-sm">
                사내 엑셀/CSV 일정을 Supabase 데이터베이스에 안전하게 누적합니다
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 font-dodum flex-1">
          {/* Action Row */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-600 font-handwriting text-sm">
              * 양식에 맞춘 CSV 파일을 업로드하면 기존 일정에 추가로 누적됩니다.
            </span>
            <button
              onClick={downloadSampleCsv}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors text-xs shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>표준 CSV 양식 다운로드</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all gap-2 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-1">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                CSV 파일을 드래그하여 놓거나 클릭하여 선택하세요
              </p>
              <p className="text-xs text-slate-500 font-handwriting text-sm">
                (UTF-8 인코딩의 .csv 파일을 지원합니다)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Selected file card */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-emerald-700" />
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{file.name}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">
                      총 {parsedTasks.length}건의 일정이 추출되었습니다.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1"
                >
                  다른 파일 선택
                </button>
              </div>

              {/* Preview table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-slate-100 text-slate-800 font-semibold border-b border-slate-200 flex items-center justify-between">
                  <span>미리보기 (최대 5건 표시)</span>
                  <span className="text-xs text-slate-500">전체 {parsedTasks.length}건 준비됨</span>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-2 px-3">날짜</th>
                        <th className="py-2 px-3">일정제목</th>
                        <th className="py-2 px-3">중요/시급</th>
                        <th className="py-2 px-3">상태</th>
                        <th className="py-2 px-3">달성률</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedTasks.slice(0, 5).map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">{t.date}</td>
                          <td className="py-2 px-3 font-medium text-slate-900 line-clamp-1">{t.title}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono mr-1">{t.importance}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{t.urgency}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                            {t.status === 'completed' ? '완료' : t.status === 'in_progress' ? '진행중' : '대기'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">{t.progress}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Status message */}
          {statusMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-handwriting">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>* 중복 방지 및 누적 등록(Upsert) 방식으로 저장됩니다.</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              disabled={parsedTasks.length === 0 || isProcessing}
              onClick={handleSaveToSupabase}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Supabase 저장 중...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Supabase에 누적 저장 ({parsedTasks.length}건)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
