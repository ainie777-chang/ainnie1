import React from 'react';
import { Task, Category, Importance, Urgency } from '../types';
import { getWeekDays, CalendarDay, formatKoreanDate } from '../utils/dateUtils';
import { Plus, CheckCircle2, Circle, Clock, Calendar, Flame } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  tasks: Task[];
  categories: Category[];
  searchQuery: string;
  selectedCategoryFilter: string;
  onOpenTaskModal: (task?: Task, defaultDate?: string) => void;
  onToggleStatus: (taskId: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  tasks,
  categories,
  searchQuery,
  selectedCategoryFilter,
  onOpenTaskModal,
  onToggleStatus,
}) => {
  const weekDays: CalendarDay[] = getWeekDays(currentDate);
  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategoryFilter === 'all' || task.categoryId === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const renderImportanceBadge = (imp: Importance) => {
    let colorClass = 'bg-stone-100 text-stone-700 border-stone-200';
    if (imp === 'A') colorClass = 'bg-red-900 text-white font-bold';
    else if (imp === 'B') colorClass = 'bg-red-100 text-red-800 border-red-300 font-semibold';
    else if (imp === 'C') colorClass = 'bg-amber-100 text-amber-800 border-amber-300';
    else if (imp === 'D') colorClass = 'bg-stone-100 text-stone-700 border-stone-200';
    else if (imp === 'E') colorClass = 'bg-stone-50 text-stone-500 border-stone-200';

    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border shadow-2xs ${colorClass}`}>
        중요도: {imp}급
      </span>
    );
  };

  const renderUrgencyBadge = (urg: Urgency) => {
    if (urg === '상') {
      return (
        <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-semibold border border-red-200 flex items-center gap-0.5">
          <Flame className="w-2.5 h-2.5 text-red-600" /> 시급: 상
        </span>
      );
    }
    if (urg === '중') {
      return (
        <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-medium border border-amber-200">
          시급: 중
        </span>
      );
    }
    return (
      <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
        시급: 하
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Week View Header Bar */}
      <div className="bg-stone-50 border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-stone-800 text-sm font-semibold">
          <Calendar className="w-4 h-4 text-red-900" />
          <span>주간 업무 일정표 ({formatKoreanDate(weekDays[0].dateString)} ~ {formatKoreanDate(weekDays[6].dateString)})</span>
        </div>
        <div className="text-xs text-stone-500">
          총 {filteredTasks.filter(t => weekDays.some(w => w.dateString === t.date)).length}개의 일정
        </div>
      </div>

      {/* Week Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 flex-1 divide-y md:divide-y-0 md:divide-x divide-stone-200 bg-stone-200 overflow-y-auto">
        {weekDays.map((dayItem, index) => {
          const dayTasks = filteredTasks.filter(t => t.date === dayItem.dateString);
          dayTasks.sort((a, b) => {
            if (a.importance !== b.importance) return a.importance.localeCompare(b.importance);
            if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
            return 0;
          });

          return (
            <div
              key={index}
              className={`bg-white min-h-[200px] md:min-h-[500px] p-3 flex flex-col ${
                dayItem.isToday ? 'bg-red-50/20' : ''
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                      dayItem.isToday
                        ? 'bg-red-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-800'
                    }`}
                  >
                    {dayItem.dayNumber}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-stone-800">
                      {['일', '월', '화', '수', '목', '금', '토'][dayItem.dayOfWeek]}요일
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {dayItem.date.getMonth() + 1}월 {dayItem.dayNumber}일
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onOpenTaskModal(undefined, dayItem.dateString)}
                  className="p-1 text-stone-400 hover:text-red-900 hover:bg-stone-100 rounded transition-colors"
                  title="일정 추가"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Day Tasks */}
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                {dayTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-300 py-12 text-xs">
                    <span>등록된 일정 없음</span>
                  </div>
                ) : (
                  dayTasks.map(task => {
                    const category = categoryMap.get(task.categoryId) || {
                      name: '기타',
                      color: 'bg-stone-100 text-stone-800 border-stone-300',
                      dotColor: 'bg-stone-500'
                    };
                    const isCompleted = task.status === 'completed';

                    return (
                      <div
                        key={task.id}
                        onClick={() => onOpenTaskModal(task)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer shadow-2xs flex flex-col gap-2 ${
                          isCompleted
                            ? 'bg-stone-50 border-stone-200 text-stone-400 opacity-75'
                            : `${category.color} hover:shadow-sm hover:border-red-400`
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-start space-x-2 flex-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleStatus(task.id);
                              }}
                              className="mt-0.5 text-stone-500 hover:text-red-900 transition-colors"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                              ) : (
                                <Circle className="w-4 h-4 text-stone-400" />
                              )}
                            </button>
                            <span className={`font-handwriting text-lg leading-tight ${isCompleted ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                              {task.title}
                            </span>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-xs text-stone-600 line-clamp-2 pl-6 font-handwriting">
                            {task.description}
                          </p>
                        )}

                        <div className="pl-6 space-y-1.5 pt-1 border-t border-stone-200/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {renderImportanceBadge(task.importance)}
                              {renderUrgencyBadge(task.urgency)}
                            </div>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-handwriting font-bold ${
                              (task.progress ?? (isCompleted ? 100 : 0)) === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-700'
                            }`}>
                              {task.progress ?? (isCompleted ? 100 : 0)}% 달성
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (task.progress ?? (isCompleted ? 100 : 0)) === 100 ? 'bg-emerald-600' : 'bg-slate-700'
                              }`} 
                              style={{ width: `${task.progress ?? (isCompleted ? 100 : 0)}%` }} 
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs text-stone-500">
                            <span className="font-handwriting text-sm">{category.name}</span>
                            {task.startTime && (
                              <span className="flex items-center gap-1 font-handwriting text-sm">
                                <Clock className="w-3 h-3 text-stone-400" />
                                {task.startTime} {task.endTime ? `- ${task.endTime}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
