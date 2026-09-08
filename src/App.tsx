/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
import { Briefcase, CheckSquare, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

export default function App() {
  // State initialization with localStorage
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

  // Sync to localStorage
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

  // Task CRUD handlers
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'>, taskId?: string) => {
    if (taskId) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...taskData } : t));
    } else {
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setTasks(prev => [newTask, ...prev]);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleToggleStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'completed' ? 'todo' : 'completed';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // Category CRUD handlers
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
    // Check if any tasks use this category
    const hasTasks = tasks.some(t => t.categoryId === id);
    if (hasTasks) return false;

    setCategories(prev => prev.filter(c => c.id !== id));
    return true;
  };

  // Export / Import
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
        alert('일정 데이터를 성공적으로 복원했습니다.');
      } catch (err) {
        alert('올바른 백업 파일 형식이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  const handleOpenTaskModal = (task?: Task, defaultDate?: string) => {
    setTaskToEdit(task || null);
    setDefaultTaskDate(defaultDate);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900">
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
        <p>오피스 및 개인 일정 관리 프로그램 &bull; 뮤트톤 오피스 테마</p>
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
    </div>
  );
}

