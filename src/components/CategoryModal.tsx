import React, { useState } from 'react';
import { Category, Task } from '../types';
import { CATEGORY_PRESET_COLORS } from '../constants';
import { X, Plus, Trash2, Edit2, Check, AlertCircle, Palette } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  tasks: Task[];
  onAddCategory: (name: string, preset: typeof CATEGORY_PRESET_COLORS[0]) => void;
  onUpdateCategory: (id: string, name: string, preset: typeof CATEGORY_PRESET_COLORS[0]) => void;
  onDeleteCategory: (id: string) => boolean;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  tasks,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingPresetIndex, setEditingPresetIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    onAddCategory(newCategoryName.trim(), CATEGORY_PRESET_COLORS[selectedPresetIndex]);
    setNewCategoryName('');
    setSelectedPresetIndex(0);
    setErrorMessage('');
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    const pIdx = CATEGORY_PRESET_COLORS.findIndex(p => p.color === cat.color);
    setEditingPresetIndex(pIdx >= 0 ? pIdx : 0);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) return;
    onUpdateCategory(id, editingName.trim(), CATEGORY_PRESET_COLORS[editingPresetIndex]);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const success = onDeleteCategory(id);
    if (!success) {
      setErrorMessage('해당 카테고리를 사용 중인 일정이 있어 삭제할 수 없습니다. 일정을 먼저 이동하거나 삭제해 주세요.');
    } else {
      setErrorMessage('');
    }
  };

  const taskCountMap = tasks.reduce((acc, task) => {
    acc[task.categoryId] = (acc[task.categoryId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-900 text-white flex items-center justify-center text-sm font-bold">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">일정 카테고리 관리</h2>
              <p className="text-xs text-stone-500">업무, 일상, 운동, 학습 등 대시보드 카테고리 설정</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Add New Category Form */}
          <form onSubmit={handleCreate} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">새 카테고리 추가</h3>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="카테고리 이름 (예: 프로젝트 TF, 외부미팅)"
                className="flex-1 px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900/20 text-stone-900"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-900 text-white text-xs font-semibold rounded-lg hover:bg-red-800 transition-colors flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>추가</span>
              </button>
            </div>

            {/* Color Preset Selector */}
            <div>
              <span className="block text-[11px] font-semibold text-stone-500 mb-1.5">대시보드 테마 컬러 선택</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {CATEGORY_PRESET_COLORS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPresetIndex(idx)}
                    className={`h-7 rounded-lg border flex items-center justify-center transition-all ${preset.color} ${
                      selectedPresetIndex === idx ? 'ring-2 ring-red-900 ring-offset-1 font-bold' : 'opacity-85 hover:opacity-100'
                    }`}
                    title={preset.name}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${preset.dotColor}`} />
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">등록된 카테고리 ({categories.length})</h3>
            <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden bg-white">
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;
                const taskCount = taskCountMap[cat.id] || 0;

                return (
                  <div key={cat.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors">
                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none"
                        />
                        <div className="grid grid-cols-6 gap-1">
                          {CATEGORY_PRESET_COLORS.map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => setEditingPresetIndex(pIdx)}
                              className={`h-5 rounded border ${preset.color} ${
                                editingPresetIndex === pIdx ? 'ring-2 ring-red-900' : ''
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 flex-1">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${cat.color}`}>
                          <span className={`w-2 h-2 rounded-full ${cat.dotColor}`} />
                          <span>{cat.name}</span>
                        </span>
                        <span className="text-xs text-stone-400">
                          일정 {taskCount}개 등록됨
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(cat.id)}
                            className="p-1.5 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
                            title="저장"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 text-stone-500 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
                            title="취소"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-900 text-white text-xs font-medium rounded-lg hover:bg-red-800 transition-colors shadow-xs"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
