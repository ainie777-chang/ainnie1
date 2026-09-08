/**
 * Superbase (Supabase) Client & API Methods
 * Using @supabase/supabase-js v2 modern syntax
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Task, Category } from '../types';

const STORAGE_URL_KEY = 'supabase_project_url';
const STORAGE_ANON_KEY = 'supabase_project_anon_key';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
  const localKey = localStorage.getItem(STORAGE_ANON_KEY) || '';

  const url = (localUrl || envUrl).trim();
  const anonKey = (localKey || envKey).trim();

  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
  else localStorage.removeItem(STORAGE_URL_KEY);

  if (anonKey) localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_ANON_KEY);

  // Re-initialize client
  initClient();
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    !url.includes('your-project') &&
    !anonKey.includes('your-anon-key') &&
    url.startsWith('https://')
  );
}

let clientInstance: SupabaseClient | null = null;

function initClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();
  const validUrl = (url && url.startsWith('https://')) ? url : 'https://mock-instance.supabase.co';
  const validKey = anonKey || 'placeholder-anon-key';

  clientInstance = createClient(validUrl, validKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return clientInstance;
}

export function getSupabase(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = initClient();
  }
  return clientInstance;
}

// -------------------------------------------------------------
// Database Operations (Tasks)
// -------------------------------------------------------------

export interface DbTaskRow {
  id: string;
  user_id?: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  category_id: string;
  importance: string;
  urgency: string;
  status: string;
  progress: number;
  all_day: boolean;
  created_at?: string;
  updated_at?: string;
}

export function taskToDbRow(task: Task, userId?: string): DbTaskRow {
  return {
    id: task.id,
    ...(userId ? { user_id: userId } : {}),
    title: task.title,
    description: task.description || null,
    date: task.date,
    start_time: task.startTime || null,
    end_time: task.endTime || null,
    category_id: task.categoryId,
    importance: task.importance,
    urgency: task.urgency,
    status: task.status,
    progress: task.progress ?? 0,
    all_day: task.allDay ?? true,
    created_at: task.createdAt,
    updated_at: new Date().toISOString(),
  };
}

export function dbRowToTask(row: DbTaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    date: row.date,
    startTime: row.start_time || undefined,
    endTime: row.end_time || undefined,
    categoryId: row.category_id,
    importance: (row.importance as Task['importance']) || 'C',
    urgency: (row.urgency as Task['urgency']) || '중',
    status: (row.status as Task['status']) || 'todo',
    progress: row.progress ?? 0,
    allDay: row.all_day ?? true,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Fetch all tasks for current authenticated user
 */
export async function fetchUserTasks(userId: string): Promise<{ tasks: Task[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { tasks: [], error: 'Supabase가 아직 구성되지 않았습니다.' };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching tasks from Supabase:', error);
      return { tasks: [], error: error.message };
    }

    const tasks = (data as DbTaskRow[] || []).map(dbRowToTask);
    return { tasks, error: null };
  } catch (err: any) {
    return { tasks: [], error: err?.message || 'DB 연결 오류' };
  }
}

/**
 * Accumulate / bulk insert tasks into Supabase (e.g. from CSV)
 */
export async function bulkAccumulateTasksToSupabase(
  newTasks: Task[],
  userId: string
): Promise<{ count: number; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { count: 0, error: 'Supabase가 구성되지 않았습니다. 로컬에 저장됩니다.' };
  }

  try {
    const supabase = getSupabase();
    const rows = newTasks.map(t => taskToDbRow(t, userId));

    // Modern Supabase v2 upsert or insert to accumulate data
    const { error, count } = await supabase
      .from('tasks')
      .upsert(rows, { onConflict: 'id', count: 'exact' });

    if (error) {
      console.error('Supabase bulk insert error:', error);
      return { count: 0, error: error.message };
    }

    return { count: count || newTasks.length, error: null };
  } catch (err: any) {
    return { count: 0, error: err?.message || '데이터 누적 저장 중 오류 발생' };
  }
}

/**
 * Upsert single task
 */
export async function saveTaskToSupabase(task: Task, userId: string): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: true, error: null };
  }

  try {
    const supabase = getSupabase();
    const row = taskToDbRow(task, userId);

    const { error } = await supabase
      .from('tasks')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || '저장 오류' };
  }
}

/**
 * Delete task from Supabase
 */
export async function deleteTaskFromSupabase(taskId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: true, error: null };
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || '삭제 오류' };
  }
}
