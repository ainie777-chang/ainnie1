import React, { useState } from 'react';
import { Task, Category, TaskStatus, Importance, Urgency } from '../types';
import { formatKoreanDate } from '../utils/dateUtils';
import { CheckCircle2, Circle, Clock, Trash2, Edit3, Filter, Flame } from 'lucide-react';

interface ListViewProps {
  tasks: Task[];
  categories: Category[];
  searchQuery: string;
  selectedCategoryFilter: string;
  onOpenTaskModal: (task?: Task) => void;
  onToggleStatus: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  categories,
  searchQuery,
  selectedCategoryFilter,
  onOpenTaskModal,
  onToggleStatus,
  onDeleteTask,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'importance' | 'urgency' | 'title'>('importance');

  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategoryFilter === 'all' || task.categoryId === selectedCategoryFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesImportance = importanceFilter === 'all' || task.importance === importanceFilter;
    const matchesUrgency = urgencyFilter === 'all' || task.urgency === urgencyFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesImportance && matchesUrgency;
  });

  // Sorting
  filteredTasks.sort((a, b) => {
    if (sortBy === 'importance') {
      return a.importance.localeCompare(b.importance) || (a.date).localeCompare(b.date);
    }
    if (sortBy === 'urgency') {
      const uRank: Record<Urgency, number> = { '상': 3, '중': 2, '하': 1 };
      return uRank[b.urgency] - uRank[a.urgency] || a.importance.localeCompare(b.importance);
    }
    if (sortBy === 'date') {
      return a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || '');
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const renderImportanceBadge = (imp: Importance) => {
    let colorClass = 'bg-stone-100 text-stone-700 border-stone-200';
    if (imp === 'A') colorClass = 'bg-red-900 text-white font-bold';
    else if (imp === 'B') colorClass = 'bg-red-100 text-red-800 border-red-300 font-semibold';
    else if (imp === 'C') colorClass = 'bg-amber-100 text-amber-800 border-amber-300';
    else if (imp === 'D') colorClass = 'bg-stone-100 text-stone-700 border-stone-200';
    else if (imp === 'E') colorClass = 'bg-stone-50 text-stone-500 border-stone-200';

    return (
      <span className={`px-2 py-0.5 text-xs rounded-md border ${colorClass}`}>
        {imp}급
      </span>
    );
  };

  const renderUrgencyBadge = (urg: Urgency) => {
    if (urg === '상') {
      return <span className="px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded-md font-semibold border border-red-200 flex items-center gap-1 w-fit"><Flame className="w-3 h-3 text-red-600" /> 상</span>;
    }
    if (urg === '중') {
      return <span className="px-2 py-0.5 text-xs bg-amber-50 text-amber-800 rounded-md font-medium border border-amber-200">중</span>;
    }
    return <span className="px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded-md font-normal">하</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Sub-header Filter Bar */}
      <div className="bg-stone-50 border-b border-stone-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <div className="flex items-center space-x-1.5 text-xs text-stone-800 font-bold">
            <Filter className="w-4 h-4 text-red-900" />
            <span>대시보드 필터:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="상태 필터"
            className="text-xs py-1 px-2.5 bg-white border border-stone-300 rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-red-900/20"
          >
            <option value="all">모든 상태</option>
            <option value="todo">대기중</option>
            <option value="in_progress">진행중</option>
            <option value="completed">완료됨</option>
          </select>

          <select
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
            aria-label="중요도 필터"
            className="text-xs py-1 px-2.5 bg-white border border-stone-300 rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-red-900/20"
          >
            <option value="all">중요도 전체 (A-E)</option>
            <option value="A">중요도 A급</option>
            <option value="B">중요도 B급</option>
            <option value="C">중요도 C급</option>
            <option value="D">중요도 D급</option>
            <option value="E">중요도 E급</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            aria-label="시급도 필터"
            className="text-xs py-1 px-2.5 bg-white border border-stone-300 rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-red-900/20"
          >
            <option value="all">시급도 전체 (상/중/하)</option>
            <option value="상">시급도: 상</option>
            <option value="중">시급도: 중</option>
            <option value="하">시급도: 하</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-stone-500">정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="정렬 기준"
            className="py-1 px-2.5 bg-white border border-stone-300 rounded-lg text-stone-700 focus:outline-none"
          >
            <option value="importance">중요도순 (A→E)</option>
            <option value="urgency">시급도순 (상→하)</option>
            <option value="date">날짜순</option>
            <option value="title">제목순</option>
          </select>
          <span className="text-stone-500 ml-1">총 <b>{filteredTasks.length}</b>건</span>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-100/80 border-b border-stone-200 text-xs font-bold text-stone-700">
              <th className="py-3 px-4 w-12 text-center">상태</th>
              <th className="py-3 px-4">일정 제목 및 내용</th>
              <th className="py-3 px-4 w-32">카테고리</th>
              <th className="py-3 px-4 w-28 text-center">중요도 (A-E)</th>
              <th className="py-3 px-4 w-28 text-center">시급도</th>
              <th className="py-3 px-4 w-32 text-center">완성도 (%)</th>
              <th className="py-3 px-4 w-36">일자 및 시간</th>
              <th className="py-3 px-4 w-24 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-sm">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-stone-400">
                  조건에 일치하는 일정이 없습니다. 새 일정을 등록해 보세요.
                </td>
              </tr>
            ) : (
              filteredTasks.map(task => {
                const category = categoryMap.get(task.categoryId) || {
                  name: '기타',
                  color: 'bg-stone-100 text-stone-800 border-stone-300',
                  dotColor: 'bg-stone-500'
                };
                const isCompleted = task.status === 'completed';

                return (
                  <tr 
                    key={task.id}
                    className={`hover:bg-stone-50 transition-colors ${isCompleted ? 'bg-stone-50/50 text-stone-400' : 'text-stone-800'}`}
                  >
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(task.id)}
                        className="p-1 hover:bg-stone-200/60 rounded-full transition-colors inline-flex items-center justify-center"
                        title={isCompleted ? '완료 취소' : '완료 처리'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-teal-700" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-400" />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div 
                          onClick={() => onOpenTaskModal(task)}
                          className={`font-handwriting text-xl cursor-pointer hover:underline ${isCompleted ? 'line-through text-stone-400' : 'text-stone-900'}`}
                        >
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-stone-500 line-clamp-1 font-handwriting">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${category.color}`}>
                        <span className={`w-2 h-2 rounded-full ${category.dotColor}`} />
                        <span className="font-handwriting">{category.name}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {renderImportanceBadge(task.importance)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {renderUrgencyBadge(task.urgency)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-handwriting font-bold px-2 py-0.5 rounded ${
                          (task.progress ?? (isCompleted ? 100 : 0)) === 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {task.progress ?? (isCompleted ? 100 : 0)}%
                        </span>
                        <div className="w-16 bg-stone-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              (task.progress ?? (isCompleted ? 100 : 0)) === 100 ? 'bg-emerald-600' : 'bg-slate-700'
                            }`} 
                            style={{ width: `${task.progress ?? (isCompleted ? 100 : 0)}%` }} 
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-xs font-handwriting text-stone-600">
                      <div>{formatKoreanDate(task.date)}</div>
                      {task.startTime && (
                        <div className="text-sm text-stone-400 flex items-center gap-1 mt-0.5 font-handwriting">
                          <Clock className="w-3 h-3" />
                          {task.startTime} {task.endTime ? `- ${task.endTime}` : ''}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onOpenTaskModal(task)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
