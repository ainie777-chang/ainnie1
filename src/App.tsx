/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Task, Category, ViewMode } from './types';
import { INITIAL_TASKS, INITIAL_CATEGORIES, CATEGORY_PRESET_COLORS } from './constants';
import { Header } from './components/Header';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { ListView } from './components/ListView';
import { TaskModal } from './components/TaskModal';
import { CategoryModal } from './components/CategoryModal';
import { CsvImportModal } from './components/CsvImportModal';
import { SupabaseSqlModal } from './components/SupabaseSqlModal';
import { LoginScreen } from './components/LoginScreen';
import { exportTasksToCsv } from './utils/csvUtils';
import { 
  getSupabase, 
  isSupabaseConfigured, 
  fetchUserTasks, 
  saveTaskToSupabase, 
  deleteTaskFromSupabase 
} from './lib/supabase';
import { CheckCircle2 } from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
}

export default function App() {
  // Supabase Auth State (인가된 사용자만 진입 허용)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem('office_auth_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Tasks & Categories State
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('office_tasks_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TASKS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('office_categories_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CATEGORIES;
  });

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultTaskDate, setDefaultTaskDate] = useState<string | undefined>(undefined);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // -------------------------------------------------------------
  // Supabase Auth Initialization & State Listener
  // -------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabase();
          const { data } = await supabase.auth.getSession();
          if (mounted && data.session?.user) {
            const userObj: AuthUser = {
              id: data.session.user.id,
              email: data.session.user.email || 'authorized_user@company.internal',
            };
            setCurrentUser(userObj);
            localStorage.setItem('office_auth_user', JSON.stringify(userObj));
          }
        } catch (err) {
          console.error('Session check error:', err);
        }
      }
      if (mounted) {
        setIsAuthLoading(false);
      }
    }

    checkSession();

    // Supabase v2 onAuthStateChange listener
    let authSubscription: any = null;
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const userObj: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
            };
            setCurrentUser(userObj);
            localStorage.setItem('office_auth_user', JSON.stringify(userObj));
          } else if (_event === 'SIGNED_OUT') {
            setCurrentUser(null);
            localStorage.removeItem('office_auth_user');
          }
        });
        authSubscription = data.subscription;
      } catch (err) {
        console.error('Auth state change listener error:', err);
      }
    }

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // -------------------------------------------------------------
  // Load tasks from Supabase when user logs in
  // -------------------------------------------------------------
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured()) return;

    async function loadRemoteTasks() {
      if (!currentUser) return;
      const { tasks: remoteTasks, error } = await fetchUserTasks(currentUser.id);
      if (!error && remoteTasks.length > 0) {
        setTasks(prev => {
          // Merge remote tasks with local tasks, preferring remote
          const remoteIds = new Set(remoteTasks.map(t => t.id));
          const filteredPrev = prev.filter(t => !remoteIds.has(t.id));
          return [...remoteTasks, ...filteredPrev];
        });
        showToast(`Supabase에서 ${remoteTasks.length}건의 일정을 불러왔습니다.`);
      }
    }

    loadRemoteTasks();
  }, [currentUser]);

  // Sync tasks & categories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('office_tasks_v1', JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('office_categories_v1', JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  }, [categories]);

  // -------------------------------------------------------------
  // Auth Handlers
  // -------------------------------------------------------------
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('office_auth_user', JSON.stringify(user));
    showToast(`${user.email} 계정으로 사내 인가 로그인이 완료되었습니다.`);
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('office_auth_user');
    showToast('로그아웃되었습니다.');
  };

  // -------------------------------------------------------------
  // Task CRUD Handlers with Supabase Sync
  // -------------------------------------------------------------
  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt'>, taskId?: string) => {
    if (taskId) {
      let updatedTask: Task | null = null;
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          updatedTask = { ...t, ...taskData };
          return updatedTask;
        }
        return t;
      }));

      if (updatedTask && currentUser) {
        await saveTaskToSupabase(updatedTask, currentUser.id);
      }
    } else {
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setTasks(prev => [newTask, ...prev]);

      if (currentUser) {
        await saveTaskToSupabase(newTask, currentUser.id);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (currentUser) {
      await deleteTaskFromSupabase(taskId, currentUser.id);
    }
  };

  const handleToggleStatus = async (taskId: string) => {
    let changedTask: Task | null = null;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'completed' ? 'todo' : 'completed';
        changedTask = { 
          ...t, 
          status: nextStatus,
          progress: nextStatus === 'completed' ? 100 : t.progress
        };
        return changedTask;
      }
      return t;
    }));

    if (changedTask && currentUser) {
      await saveTaskToSupabase(changedTask, currentUser.id);
    }
  };

  // -------------------------------------------------------------
  // Category CRUD Handlers
  // -------------------------------------------------------------
  const handleAddCategory = (name: string, preset: typeof CATEGORY_PRESET_COLORS[0]) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      color: preset.color,
      dotColor: preset.dotColor,
      badgeBg: preset.badgeBg,
      badgeText: preset.badgeText,
    };
    setCategories(prev => [...prev, newCat]);
  };

  const handleUpdateCategory = (id: string, name: string, preset: typeof CATEGORY_PRESET_COLORS[0]) => {
    setCategories(prev => prev.map(c => c.id === id ? {
      ...c,
      name,
      color: preset.color,
      dotColor: preset.dotColor,
      badgeBg: preset.badgeBg,
      badgeText: preset.badgeText,
    } : c));
  };

  const handleDeleteCategory = (id: string): boolean => {
    const hasTasks = tasks.some(t => t.categoryId === id);
    if (hasTasks) return false;

    setCategories(prev => prev.filter(c => c.id !== id));
    return true;
  };

  // -------------------------------------------------------------
  // CSV Import & Accumulation Handler
  // -------------------------------------------------------------
  const handleCsvImportSuccess = (importedTasks: Task[], message: string) => {
    setTasks(prev => {
      const existingMap = new Map(prev.map(t => [t.id, t]));
      importedTasks.forEach(t => existingMap.set(t.id, t));
      return Array.from(existingMap.values());
    });
    showToast(message);
  };

  const handleExportCsv = () => {
    const csvContent = exportTasksToCsv(tasks, categories);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `office-tasks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('현재 일정이 CSV 파일로 다운로드되었습니다.');
  };

  // Legacy JSON Export / Import
  const handleExportData = () => {
    const data = {
      tasks,
      categories,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `office-schedule-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.tasks && Array.isArray(json.tasks)) {
          setTasks(json.tasks);
        }
        if (json.categories && Array.isArray(json.categories)) {
          setCategories(json.categories);
        }
        showToast('일정 데이터를 성공적으로 복원했습니다.');
      } catch (err) {
        showToast('올바른 백업 파일 형식이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  const handleOpenTaskModal = (task?: Task, defaultDate?: string) => {
    setTaskToEdit(task || null);
    setDefaultTaskDate(defaultDate);
    setIsTaskModalOpen(true);
  };

  // -------------------------------------------------------------
  // Auth Guard: 인가된 사용자만 캘린더 대시보드 접근 허용
  // -------------------------------------------------------------
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
          <span>사내 인가 자격 검증 중...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onOpenSqlGuide={() => setIsSqlModalOpen(true)}
        />
        <SupabaseSqlModal
          isOpen={isSqlModalOpen}
          onClose={() => setIsSqlModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="leading-tight font-dodum">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenTaskModal={handleOpenTaskModal}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        categories={categories}
        tasks={tasks}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategoryFilter={selectedCategoryFilter}
        setSelectedCategoryFilter={setSelectedCategoryFilter}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onExportCsv={handleExportCsv}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        user={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              tasks={tasks}
              categories={categories}
              searchQuery={searchQuery}
              selectedCategoryFilter={selectedCategoryFilter}
              onOpenTaskModal={handleOpenTaskModal}
              onToggleStatus={handleToggleStatus}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              tasks={tasks}
              categories={categories}
              searchQuery={searchQuery}
              selectedCategoryFilter={selectedCategoryFilter}
              onOpenTaskModal={handleOpenTaskModal}
              onToggleStatus={handleToggleStatus}
            />
          )}

          {viewMode === 'list' && (
            <ListView
              tasks={tasks}
              categories={categories}
              searchQuery={searchQuery}
              selectedCategoryFilter={selectedCategoryFilter}
              onOpenTaskModal={handleOpenTaskModal}
              onToggleStatus={handleToggleStatus}
              onDeleteTask={handleDeleteTask}
            />
          )}
        </div>
      </main>

      {/* Footer info */}
      <footer className="py-4 text-center text-xs text-stone-500 border-t border-stone-200 bg-white">
        <p>오피스 및 개인 일정 관리 프로그램 &bull; Supabase Auth & DB 연동 완료 &bull; 뮤트톤 오피스 테마</p>
      </footer>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        taskToEdit={taskToEdit}
        defaultDate={defaultTaskDate}
        categories={categories}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        tasks={tasks}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* CSV Import & Supabase Accumulation Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        categories={categories}
        userId={currentUser.id}
        onImportSuccess={handleCsvImportSuccess}
      />

      {/* Supabase DB Table & RLS Setup SQL Modal */}
      <SupabaseSqlModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
}
