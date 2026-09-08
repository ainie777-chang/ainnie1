// Date helper utilities for calendar and schedule views

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
}

export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMonthDays = (year: number, month: number): CalendarDay[] => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const days: CalendarDay[] = [];
  const todayStr = formatDateString(new Date());

  // Day of week for the first day (0 = Sun, 1 = Mon, etc.)
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // Add previous month's trailing days to fill the first week
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
    const dateString = formatDateString(prevDate);
    days.push({
      date: prevDate,
      dateString,
      dayNumber: prevDate.getDate(),
      isCurrentMonth: false,
      isToday: dateString === todayStr,
      dayOfWeek: prevDate.getDay(),
    });
  }

  // Add current month's days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const currDate = new Date(year, month, i);
    const dateString = formatDateString(currDate);
    days.push({
      date: currDate,
      dateString,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: dateString === todayStr,
      dayOfWeek: currDate.getDay(),
    });
  }

  // Add next month's leading days to complete the grid (up to multiple of 7, usually 35 or 42 cells)
  const remainingCells = 7 - (days.length % 7);
  if (remainingCells < 7) {
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateString = formatDateString(nextDate);
      days.push({
        date: nextDate,
        dateString,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        dayOfWeek: nextDate.getDay(),
      });
    }
  }

  return days;
};

export const getWeekDays = (currentDate: Date): CalendarDay[] => {
  const d = new Date(currentDate);
  const day = d.getDay(); // 0 is Sunday
  // Let's start week on Monday (1) or Sunday (0). Office calendars usually start on Monday or Sunday. Let's make it Monday start or Sunday start. Let's start on Monday (ISO week) as it's standard for office productivity.
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(d.setDate(diffToMonday));
  const todayStr = formatDateString(new Date());

  const weekDays: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const curr = new Date(monday);
    curr.setDate(monday.getDate() + i);
    const dateString = formatDateString(curr);
    weekDays.push({
      date: curr,
      dateString,
      dayNumber: curr.getDate(),
      isCurrentMonth: curr.getMonth() === new Date().getMonth(),
      isToday: dateString === todayStr,
      dayOfWeek: curr.getDay(),
    });
  }

  return weekDays;
};

export const formatKoreanDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const wk = weekdays[dateObj.getDay()];
  return `${Number(m)}월 ${Number(d)}일 (${wk})`;
};

export const formatKoreanMonthYear = (date: Date): string => {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
};
