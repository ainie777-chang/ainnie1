import React from 'react';
import { ViewMode, Category, Task } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Settings, 
  ListTodo, 
  CalendarDays, 
  LayoutGrid, 
  Download, 
  Upload,
  Search,
  ShieldAlert,
  Database,
  FileSpreadsheet,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { formatKoreanMonthYear, formatDateString } from '../utils/dateUtils';

interface HeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenTaskModal: (task?: any, defaultDate?: string) => void;
  onOpenCategoryModal: () => void;
  categories: Category[];
  tasks: Task[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (id: string) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCsvModal: () => void;
  onExportCsv: () => void;
  onOpenSqlModal: () => void;
  user: { id: string; email: string } | null;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  setCurrentDate,
  viewMode,
  setViewMode,
  onOpenTaskModal,
  onOpenCategoryModal,
  categories,
  tasks,
  searchQuery,
  setSearchQuery,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  onExportData,
  onImportData,
  onOpenCsvModal,
  onExportCsv,
  onOpenSqlModal,
  user,
  onSignOut,
}) => {
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const avgProgress = totalCount > 0 
    ? Math.round(tasks.reduce((sum, t) => sum + (t.progress ?? (t.status === 'completed' ? 100 : 0)), 0) / totalCount) 
    : 0;
  const urgentCount = tasks.filter(t => t.urgency === '상' && t.status !== 'completed').length;

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      {/* Corporate Mute Executive Top Bar */}
      <div className="bg-slate-900 text-slate-100 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs font-dodum flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1.5 font-semibold tracking-wide bg-slate-800 px-2.5 py-1 rounded text-slate-200 border border-slate-700 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>EXECUTIVE DASHBOARD</span>
          </span>
          <span className="hidden lg:inline text-slate-300 font-handwriting text-sm">
            시급도 '상' 미결제: <strong className="text-white font-bold">{urgentCount}건</strong>
          </span>
          <button
            onClick={onOpenSqlModal}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60 transition-colors text-[11px] font-mono"
            title="Supabase DB 테이블 및 RLS 생성 SQL"
          >
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Supabase SQL</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-handwriting text-sm">종합 달성률: <strong className="text-white font-bold">{avgProgress}%</strong> ({completedCount}/{totalCount}건)</span>
            <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${avgProgress}%` }} />
            </div>
          </div>

          {/* CSV & Backup Controls */}
          <div className="flex items-center space-x-2 border-l border-slate-700 pl-3">
            <button
              onClick={onOpenCsvModal}
              className="px-2.5 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-emerald-50 rounded transition-colors flex items-center gap-1 font-handwriting text-xs shadow-2xs"
              title="CSV 파일 데이터를 Supabase에 누적 저장"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV 누적 저장</span>
            </button>
            <button
              onClick={onExportCsv}
              className="text-slate-300 hover:text-white transition-colors flex items-center gap-1 font-handwriting text-sm px-1.5 py-0.5"
              title="현재 일정 CSV로 내보내기"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">CSV 추출</span>
            </button>
          </div>

          {/* Authorized User Profile & Sign Out */}
          {user && (
            <div className="flex items-center space-x-2 border-l border-slate-700 pl-3">
              <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="max-w-[120px] truncate text-slate-200 font-mono text-[11px]" title={user.email}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={onSignOut}
                className="text-slate-400 hover:text-rose-300 transition-colors p-1 rounded hover:bg-slate-800"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation & Title Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo & Title */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs font-bold text-lg tracking-wider font-handwriting">
              OE
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-handwriting">
                사내 통합 일정 대시보드
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-dodum">
                  Corporate Edition
                </span>
              </h1>
              <p className="text-sm text-slate-500 font-handwriting">중요도(A-E) 및 시급도(상/중/하) 뮤트톤 오피스 캘린더</p>
            </div>
          </div>

          <div className="flex items-center md:hidden space-x-1">
            <button
              onClick={() => onOpenTaskModal()}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
              title="일정 등록"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Quick Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="일정 제목, 내용 검색..."
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-stone-50/80 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-stone-800 placeholder:text-stone-400"
            />
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            aria-label="카테고리 필터"
            className="text-xs py-1.5 px-2.5 bg-stone-50/80 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
          >
            <option value="all">모든 카테고리</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            onClick={onOpenCategoryModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors shadow-2xs"
            title="카테고리 관리"
          >
            <Settings className="w-3.5 h-3.5 text-stone-500" />
            <span>카테고리 관리</span>
          </button>

          <button
            onClick={() => onOpenTaskModal()}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>신규 일정 등록</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Navigation & Views */}
      <div className="bg-stone-50/80 border-t border-stone-200 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Date Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-100 transition-colors shadow-2xs"
          >
            오늘
          </button>
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrev}
              className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded transition-colors"
              title="이전 기간"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-stone-800 min-w-[110px] text-center font-dodum">
              {viewMode === 'week' 
                ? `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${Math.ceil(currentDate.getDate() / 7)}주차`
                : formatKoreanMonthYear(currentDate)
              }
            </span>
            <button
              onClick={handleNext}
              className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded transition-colors"
              title="다음 기간"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-stone-200/60 p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'month'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>월간 뷰</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'week'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>주간 뷰</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>할일 목록 뷰</span>
          </button>
        </div>

        {/* Mobile secondary actions */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={onOpenCategoryModal}
            className="p-1.5 text-stone-600 bg-white border border-stone-300 rounded-lg text-xs"
            title="카테고리 관리"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
