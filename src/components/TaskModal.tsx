import React, { useState, useEffect } from 'react';
import { Task, Category, Importance, Urgency, TaskStatus } from '../types';
import { X, Calendar, Clock, Tag, AlertCircle, FileText, CheckCircle2, Flame, Award } from 'lucide-react';
import { formatDateString } from '../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt'>, taskId?: string) => void;
  onDelete?: (taskId: string) => void;
  taskToEdit?: Task | null;
  defaultDate?: string;
  categories: Category[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  taskToEdit,
  defaultDate,
  categories,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || formatDateString(new Date()));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'work');
  const [importance, setImportance] = useState<Importance>('B');
  const [urgency, setUrgency] = useState<Urgency>('중');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [progress, setProgress] = useState<number>(0);
  const [allDay, setAllDay] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setDate(taskToEdit.date);
      setStartTime(taskToEdit.startTime || '');
      setEndTime(taskToEdit.endTime || '');
      setCategoryId(taskToEdit.categoryId);
      setImportance(taskToEdit.importance || 'B');
      setUrgency(taskToEdit.urgency || '중');
      setStatus(taskToEdit.status);
      setProgress(taskToEdit.progress ?? (taskToEdit.status === 'completed' ? 100 : taskToEdit.status === 'in_progress' ? 50 : 0));
      setAllDay(taskToEdit.allDay);
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDate || formatDateString(new Date()));
      setStartTime('09:00');
      setEndTime('10:00');
      setCategoryId(categories[0]?.id || 'work');
      setImportance('B');
      setUrgency('중');
      setStatus('todo');
      setProgress(0);
      setAllDay(false);
    }
  }, [taskToEdit, defaultDate, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalStatus = status;
    if (progress === 100) {
      finalStatus = 'completed';
    } else if (progress > 0 && status === 'todo') {
      finalStatus = 'in_progress';
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      date,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      categoryId,
      importance,
      urgency,
      status: finalStatus,
      progress,
      allDay,
    }, taskToEdit?.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold font-handwriting">
              {taskToEdit ? '수정' : '등록'}
            </div>
            <h2 className="text-base font-bold text-stone-900">
              {taskToEdit ? '일정 수정' : '신규 일정 등록'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              일정 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 주간 기획 회의 및 안건 검토"
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 text-stone-900"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">카테고리</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900/20 text-stone-800"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Importance (A-E) & Urgency (상/중/하) */}
          <div className="grid grid-cols-2 gap-4 bg-red-50/40 p-3.5 rounded-xl border border-red-100">
            <div>
              <label className="block text-xs font-bold text-red-900 mb-1.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-red-700" /> 중요도 (Importance)
              </label>
              <div className="grid grid-cols-5 gap-1">
                {(['A', 'B', 'C', 'D', 'E'] as Importance[]).map((imp) => (
                  <button
                    key={imp}
                    type="button"
                    onClick={() => setImportance(imp)}
                    className={`py-1.5 text-xs rounded font-bold transition-all border ${
                      importance === imp 
                        ? 'bg-red-900 text-white border-red-900 shadow-xs' 
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {imp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-red-900 mb-1.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-700" /> 시급도 (Urgency)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['상', '중', '하'] as Urgency[]).map((urg) => (
                  <button
                    key={urg}
                    type="button"
                    onClick={() => setUrgency(urg)}
                    className={`py-1.5 text-xs rounded font-medium transition-all border ${
                      urgency === urg 
                        ? 'bg-red-900 text-white border-red-900 shadow-xs' 
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {urg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">날짜</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900/20 text-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">진행 상태</label>
              <select
                value={status}
                onChange={(e) => {
                  const s = e.target.value as TaskStatus;
                  setStatus(s);
                  if (s === 'completed') setProgress(100);
                  else if (s === 'todo' && progress === 100) setProgress(0);
                }}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900/20 text-stone-800"
              >
                <option value="todo">대기중</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료됨</option>
              </select>
            </div>
          </div>

          {/* Progress Percentage Control */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800">
                업무 완성도 (Progress %)
              </label>
              <span className="text-sm font-bold text-red-900 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {progress}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => {
                const val = Number(e.target.value);
                setProgress(val);
                if (val === 100) setStatus('completed');
                else if (val > 0 && status === 'todo') setStatus('in_progress');
                else if (val === 0) setStatus('todo');
              }}
              className="w-full accent-red-900 cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1">
              {[0, 25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setProgress(p);
                    if (p === 100) setStatus('completed');
                    else if (p > 0 && status === 'todo') setStatus('in_progress');
                    else if (p === 0) setStatus('todo');
                  }}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                    progress === p
                      ? 'bg-red-900 text-white border-red-900 font-bold'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">시간 설정</label>
              <label className="flex items-center space-x-1.5 text-xs text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="rounded border-stone-300 text-red-900 focus:ring-red-900"
                />
                <span>종일 일정</span>
              </label>
            </div>

            {!allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">시작 시간</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none font-mono text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">종료 시간</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none font-mono text-stone-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">상세 내용 (선택)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="참석자, 회의실, 준비물 또는 세부 메모를 입력하세요..."
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-900/20 text-stone-900 resize-none"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            {taskToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
                    onDelete(taskToEdit.id);
                    onClose();
                  }
                }}
                className="px-4 py-2 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
              >
                삭제하기
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
              >
                {taskToEdit ? '수정 완료' : '일정 등록'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
