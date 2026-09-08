import React from 'react';
import { Task, Category, Importance, Urgency } from '../types';
import { getMonthDays, CalendarDay } from '../utils/dateUtils';
import { Plus, CheckCircle2, Circle, Clock, Flame } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  categories: Category[];
  searchQuery: string;
  selectedCategoryFilter: string;
  onOpenTaskModal: (task?: Task, defaultDate?: string) => void;
  onToggleStatus: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  tasks,
  categories,
  searchQuery,
  selectedCategoryFilter,
  onOpenTaskModal,
  onToggleStatus,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days: CalendarDay[] = getMonthDays(year, month);

  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategoryFilter === 'all' || task.categoryId === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

  // Render Importance Badge (A-E)
  const renderImportanceBadge = (imp: Importance) => {
    let colorClass = 'bg-stone-100 text-stone-700 border-stone-200';
    if (imp === 'A') colorClass = 'bg-red-900 text-white font-bold';
    else if (imp === 'B') colorClass = 'bg-red-100 text-red-800 border-red-300 font-semibold';
    else if (imp === 'C') colorClass = 'bg-amber-100 text-amber-800 border-amber-300';
    else if (imp === 'D') colorClass = 'bg-stone-100 text-stone-700 border-stone-200';
    else if (imp === 'E') colorClass = 'bg-stone-50 text-stone-500 border-stone-200';

    return (
      <span className={`text-[10px] px-1.5 py-0.2 rounded border shadow-2xs ${colorClass}`} title={`중요도: ${imp}`}>
        {imp}급
      </span>
    );
  };

  // Render Urgency Badge (상/중/하)
  const renderUrgencyBadge = (urg: Urgency) => {
    if (urg === '상') {
      return (
        <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.2 rounded font-semibold border border-red-200 flex items-center gap-0.5">
          <Flame className="w-2.5 h-2.5 text-red-600" /> 시급:상
        </span>
      );
    }
    if (urg === '중') {
      return (
        <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded font-medium border border-amber-200">
          시급:중
        </span>
      );
    }
    return (
      <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-normal">
        시급:하
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 bg-stone-100/80 border-b border-stone-200 text-center py-2 text-xs font-bold text-stone-700">
        {weekdays.map((day, idx) => (
          <div key={day} className={idx >= 5 ? 'text-stone-400' : ''}>
            {day}요일
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-stone-200 bg-stone-200">
        {days.map((dayItem, index) => {
          const dayTasks = filteredTasks.filter(t => t.date === dayItem.dateString);
          dayTasks.sort((a, b) => {
            // Sort by importance (A > B > C > D > E) then time
            if (a.importance !== b.importance) return a.importance.localeCompare(b.importance);
            if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
            return 0;
          });

          return (
            <div
              key={index}
              className={`bg-white min-h-[130px] sm:min-h-[150px] p-1.5 sm:p-2 flex flex-col transition-colors group relative ${
                !dayItem.isCurrentMonth ? 'bg-stone-50/70 text-stone-400' : 'text-stone-800'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${
                    dayItem.isToday
                      ? 'bg-red-900 text-white shadow-xs'
                      : dayItem.dayOfWeek === 0 || dayItem.dayOfWeek === 6
                      ? 'text-stone-400 font-medium'
                      : 'text-stone-800'
                  }`}
                >
                  {dayItem.dayNumber}
                </span>

                <button
                  onClick={() => onOpenTaskModal(undefined, dayItem.dateString)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-900 hover:bg-stone-100 rounded transition-all"
                  title="이 날짜에 일정 추가"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks List for Day */}
              <div className="flex-1 overflow-y-auto space-y-1 max-h-[115px] sm:max-h-[135px] pr-0.5 custom-scrollbar">
                {dayTasks.map(task => {
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
                      className={`group/task text-xs p-1.5 rounded-md border transition-all cursor-pointer shadow-2xs flex flex-col gap-1 ${
                        isCompleted 
                          ? 'bg-stone-50 border-stone-200 text-stone-400 opacity-70' 
                          : `${category.color} hover:shadow-xs hover:border-red-300`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center space-x-1.5 overflow-hidden flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStatus(task.id);
                            }}
                            className="flex-shrink-0 text-stone-500 hover:text-red-900 transition-colors"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-stone-400" />
                            )}
                          </button>
                          
                          <span className={`font-handwriting text-base sm:text-lg truncate ${isCompleted ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                            {task.title}
                          </span>
                        </div>
                      </div>

                      {/* Badges: Importance, Urgency, Progress & Time */}
                      <div className="flex items-center justify-between text-[10px] pl-4 pt-0.5 border-t border-stone-200/50">
                        <div className="flex items-center space-x-1">
                          {renderImportanceBadge(task.importance)}
                          {renderUrgencyBadge(task.urgency)}
                          <span className={`px-1.5 py-0.2 rounded font-mono font-bold ${
                            (task.progress ?? (isCompleted ? 100 : 0)) === 100 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-stone-200 text-stone-700'
                          }`}>
                            {task.progress ?? (isCompleted ? 100 : 0)}%
                          </span>
                        </div>

                        {task.startTime && (
                          <span className="text-stone-500 font-mono text-[10px]">
                            {task.startTime}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
