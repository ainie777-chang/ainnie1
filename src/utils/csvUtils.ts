/**
 * CSV Import & Export Utilities for Tasks
 * Supports standard RFC 4180 CSV format, Korean & English headers, and edge-case handling.
 */

import { Task, Category, Importance, Urgency, TaskStatus } from '../types';

/**
 * Standard CSV Header
 */
export const CSV_HEADERS = [
  '일정ID',
  '일정제목',
  '상세내용',
  '날짜(YYYY-MM-DD)',
  '시작시간(HH:mm)',
  '종료시간(HH:mm)',
  '카테고리ID',
  '카테고리명',
  '중요도(A-E)',
  '시급도(상/중/하)',
  '진행상태(todo/in_progress/completed)',
  '달성률(%)',
  '종일여부(true/false)'
];

/**
 * Robust CSV Line Parser that handles quotes and escaped characters
 */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse CSV text into Task objects to be accumulated in Supabase
 */
export function parseTasksFromCsv(
  csvContent: string,
  existingCategories: Category[]
): { tasks: Task[]; errors: string[]; parsedCount: number } {
  const rows = parseCsvRows(csvContent);
  if (rows.length === 0) {
    return { tasks: [], errors: ['CSV 파일에 데이터가 없습니다.'], parsedCount: 0 };
  }

  const header = rows[0].map(h => h.replace(/[\ufeff\s]/g, '').toLowerCase());
  const dataRows = rows.slice(1);

  // Column index detection (supports Korean & English)
  const getColIndex = (keywords: string[]): number => {
    return header.findIndex(h => keywords.some(k => h.includes(k.toLowerCase())));
  };

  const idIdx = getColIndex(['id', '일정id']);
  const titleIdx = getColIndex(['title', '제목', '일정제목', '할일']);
  const descIdx = getColIndex(['description', '내용', '상세', '상세내용', '메모']);
  const dateIdx = getColIndex(['date', '날짜', '일자']);
  const startTimeIdx = getColIndex(['starttime', '시작시간', '시작']);
  const endTimeIdx = getColIndex(['endtime', '종료시간', '마감시간', '종료']);
  const categoryIdIdx = getColIndex(['categoryid', '카테고리id']);
  const categoryNameIdx = getColIndex(['category', 'categoryname', '카테고리명', '카테고리']);
  const importanceIdx = getColIndex(['importance', '중요도', '우선순위']);
  const urgencyIdx = getColIndex(['urgency', '시급도', '긴급도']);
  const statusIdx = getColIndex(['status', '상태', '진행상태']);
  const progressIdx = getColIndex(['progress', '달성률', '진척도', '완성도']);
  const allDayIdx = getColIndex(['allday', '종일', '종일여부']);

  const parsedTasks: Task[] = [];
  const errors: string[] = [];

  const defaultCategory = existingCategories[0] || { id: 'work', name: '핵심업무' };

  dataRows.forEach((row, rowIndex) => {
    const rowNum = rowIndex + 2; // considering 1-based index and header
    const title = titleIdx !== -1 ? row[titleIdx] : row[0];
    if (!title) {
      return; // Skip empty title rows
    }

    // Date parsing
    let dateStr = dateIdx !== -1 ? row[dateIdx] : '';
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // If date is invalid or missing, fallback to today
      const today = new Date().toISOString().split('T')[0];
      dateStr = dateStr && !isNaN(Date.parse(dateStr))
        ? new Date(dateStr).toISOString().split('T')[0]
        : today;
    }

    // Category matching
    let categoryId = defaultCategory.id;
    if (categoryIdIdx !== -1 && row[categoryIdIdx]) {
      const match = existingCategories.find(c => c.id === row[categoryIdIdx]);
      if (match) categoryId = match.id;
    } else if (categoryNameIdx !== -1 && row[categoryNameIdx]) {
      const catName = row[categoryNameIdx];
      const match = existingCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (match) {
        categoryId = match.id;
      }
    }

    // Importance parsing (A, B, C, D, E)
    let importance: Importance = 'C';
    if (importanceIdx !== -1 && row[importanceIdx]) {
      const val = row[importanceIdx].toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(val)) {
        importance = val as Importance;
      }
    }

    // Urgency parsing (상, 중, 하)
    let urgency: Urgency = '중';
    if (urgencyIdx !== -1 && row[urgencyIdx]) {
      const val = row[urgencyIdx].trim();
      if (val === '상' || val === 'High' || val === 'high') urgency = '상';
      else if (val === '하' || val === 'Low' || val === 'low') urgency = '하';
      else urgency = '중';
    }

    // Status parsing
    let status: TaskStatus = 'todo';
    if (statusIdx !== -1 && row[statusIdx]) {
      const val = row[statusIdx].toLowerCase().trim();
      if (val === 'completed' || val === '완료' || val === 'done') status = 'completed';
      else if (val === 'in_progress' || val === '진행중' || val === 'doing') status = 'in_progress';
      else status = 'todo';
    }

    // Progress percentage
    let progress = 0;
    if (progressIdx !== -1 && row[progressIdx]) {
      const num = parseInt(row[progressIdx].replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num)) {
        progress = Math.min(100, Math.max(0, num));
      }
    }
    if (status === 'completed' && progress === 0) {
      progress = 100;
    }

    // Times & All Day
    const startTime = startTimeIdx !== -1 && row[startTimeIdx] ? row[startTimeIdx] : undefined;
    const endTime = endTimeIdx !== -1 && row[endTimeIdx] ? row[endTimeIdx] : undefined;
    let allDay = true;
    if (allDayIdx !== -1 && row[allDayIdx]) {
      const val = row[allDayIdx].toLowerCase();
      allDay = val === 'true' || val === '1' || val === '예' || val === '종일';
    } else if (startTime) {
      allDay = false;
    }

    const taskId = (idIdx !== -1 && row[idIdx])
      ? row[idIdx]
      : `task-csv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const task: Task = {
      id: taskId,
      title,
      description: descIdx !== -1 ? row[descIdx] : undefined,
      date: dateStr,
      startTime,
      endTime,
      categoryId,
      importance,
      urgency,
      status,
      progress,
      allDay,
      createdAt: new Date().toISOString(),
    };

    parsedTasks.push(task);
  });

  return {
    tasks: parsedTasks,
    errors,
    parsedCount: parsedTasks.length,
  };
}

/**
 * Generate CSV string from tasks for downloading/backup
 */
export function exportTasksToCsv(tasks: Task[], categories: Category[]): string {
  const catMap = new Map(categories.map(c => [c.id, c.name]));

  const rows: string[][] = [CSV_HEADERS];

  tasks.forEach(t => {
    const row = [
      t.id,
      escapeCsvField(t.title),
      escapeCsvField(t.description || ''),
      t.date,
      t.startTime || '',
      t.endTime || '',
      t.categoryId,
      escapeCsvField(catMap.get(t.categoryId) || '기타'),
      t.importance,
      t.urgency,
      t.status,
      t.progress.toString(),
      t.allDay ? 'true' : 'false'
    ];
    rows.push(row);
  });

  // UTF-8 BOM for Excel compatibility in Korean
  return '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
}

function escapeCsvField(field: string): string {
  if (!field) return '""';
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return `"${field}"`;
}

/**
 * Download sample CSV template
 */
export function downloadSampleCsv() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const sampleRows = [
    CSV_HEADERS.join(','),
    `"task-sample-1","2026 3분기 경영전략 회의","경영진 및 본부장 주간 핵심 안건 보고","${today}","09:30","11:30","strategy","전략기획","A","상","in_progress","60","false"`,
    `"task-sample-2","월간 재무제표 마감 검토","회계팀 세무 결산 및 외부 감사 자료 취합","${today}","14:00","16:00","finance","재무회계","A","상","todo","30","false"`,
    `"task-sample-3","사내 보안 감사 실사 대응","ISMS-P 인증 유지 및 계정 접근 권한 점검","${tomorrow}","","","operation","운영관리","B","중","todo","0","true"`
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + sampleRows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `supabase_tasks_sample_template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
