import { supabase } from './supabase';

export interface MessageThread {
  id: string;
  missionId: string;
  patronId: string;
  workerId: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  attachments: string[] | null;
  readAt: string | null;
  createdAt: string;
}

function rowToThread(r: any): MessageThread {
  return {
    id: r.id,
    missionId: r.mission_id,
    patronId: r.patron_id,
    workerId: r.worker_id,
    lastMessageAt: r.last_message_at,
    createdAt: r.created_at,
  };
}

function rowToMessage(r: any): ChatMessage {
  return {
    id: r.id,
    threadId: r.thread_id,
    senderId: r.sender_id,
    body: r.body,
    attachments: r.attachments ?? null,
    readAt: r.read_at ?? null,
    createdAt: r.created_at,
  };
}

export async function getOrCreateThread(params: {
  missionId: string;
  patronId: string;
  workerId: string;
}): Promise<{ data: MessageThread | null; error: any }> {
  const { missionId, patronId, workerId } = params;

  const { data: existing, error: findErr } = await supabase
    .from('message_threads')
    .select('*')
    .eq('mission_id', missionId)
    .eq('patron_id', patronId)
    .eq('worker_id', workerId)
    .maybeSingle();

  if (findErr) return { data: null, error: findErr };
  if (existing) return { data: rowToThread(existing), error: null };

  const { data: created, error: createErr } = await supabase
    .from('message_threads')
    .insert({ mission_id: missionId, patron_id: patronId, worker_id: workerId })
    .select()
    .single();

  if (createErr) return { data: null, error: createErr };
  return { data: created ? rowToThread(created) : null, error: null };
}

export async function getThreadsForUser(userId: string): Promise<{
  data: MessageThread[];
  error: any;
}> {
  const { data, error } = await supabase
    .from('message_threads')
    .select('*')
    .or(`patron_id.eq.${userId},worker_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  return { data: (data ?? []).map(rowToThread), error };
}

export async function getMessages(
  threadId: string,
  opts: { limit?: number; before?: string } = {}
): Promise<{ data: ChatMessage[]; error: any }> {
  const limit = opts.limit ?? 50;
  let query = supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts.before) query = query.lt('created_at', opts.before);

  const { data, error } = await query;
  return {
    data: (data ?? []).map(rowToMessage).reverse(),
    error,
  };
}

// Modération légère : masque les tentatives de partage de coordonnées externes
// pour éviter le contournement de la plateforme (audit AML §4.2.3)
const PHONE_FR = /(?:\+33[\s.\-]?|0)[1-9](?:[\s.\-]?\d{2}){4}/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/g;
const EXTERNAL_CHANNELS = /\b(whatsapp|telegram|signal|instagram|snapchat|facebook|messenger)\b/gi;

export function moderateMessage(raw: string): { clean: string; flagged: boolean } {
  let flagged = false;
  let clean = raw;
  if (PHONE_FR.test(clean)) { flagged = true; clean = clean.replace(PHONE_FR, '[numéro masqué]'); }
  if (EMAIL_RE.test(clean)) { flagged = true; clean = clean.replace(EMAIL_RE, '[email masqué]'); }
  if (EXTERNAL_CHANNELS.test(clean)) {
    flagged = true;
    clean = clean.replace(EXTERNAL_CHANNELS, '[application masquée]');
  }
  return { clean, flagged };
}

export async function sendMessage(params: {
  threadId: string;
  senderId: string;
  body: string;
  attachments?: string[];
}): Promise<{ data: ChatMessage | null; error: any; moderated: boolean }> {
  const { threadId, senderId, body, attachments } = params;
  const trimmed = body.trim();
  if (!trimmed) return { data: null, error: new Error('Empty message'), moderated: false };

  const { clean, flagged } = moderateMessage(trimmed);

  const { data, error } = await supabase
    .from('messages')
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      body: clean,
      attachments: attachments ?? null,
    })
    .select()
    .single();

  return { data: data ? rowToMessage(data) : null, error, moderated: flagged };
}

export async function markThreadAsRead(threadId: string, userId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .neq('sender_id', userId)
    .is('read_at', null);

  return { error };
}

export function subscribeToThreadMessages(
  threadId: string,
  onInsert: (msg: ChatMessage) => void
) {
  const channel = supabase
    .channel(`messages:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        if (payload.new) onInsert(rowToMessage(payload.new));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToUserThreads(
  userId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(`user-threads:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'message_threads',
        filter: `patron_id=eq.${userId}`,
      },
      () => onChange()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'message_threads',
        filter: `worker_id=eq.${userId}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
