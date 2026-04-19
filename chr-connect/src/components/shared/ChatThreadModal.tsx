'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import {
  getOrCreateThread,
  getMessages,
  sendMessage,
  markThreadAsRead,
  subscribeToThreadMessages,
  type ChatMessage,
  type MessageThread,
} from '@/lib/chat-service';

interface ChatThreadModalProps {
  missionId: string;
  missionTitle: string;
  patronId: string;
  workerId: string;
  peerName: string;
  peerAvatar?: string;
  peerId?: string;
  senderName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatThreadModal({
  missionId,
  missionTitle,
  patronId,
  workerId,
  peerName,
  peerAvatar,
  peerId,
  senderName,
  isOpen,
  onClose,
}: ChatThreadModalProps) {
  const { user } = useAuth();
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [moderationNotice, setModerationNotice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    let unsub: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: t, error: thErr } = await getOrCreateThread({
        missionId,
        patronId,
        workerId,
      });
      if (cancelled) return;
      if (thErr || !t) {
        setError(thErr?.message || 'Impossible d\'ouvrir la conversation.');
        setLoading(false);
        return;
      }
      setThread(t);

      const { data: msgs, error: msgErr } = await getMessages(t.id);
      if (cancelled) return;
      if (msgErr) {
        setError(msgErr.message || 'Impossible de charger les messages.');
        setLoading(false);
        return;
      }
      setMessages(msgs);
      setLoading(false);

      await markThreadAsRead(t.id, user.id);

      unsub = subscribeToThreadMessages(t.id, (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.senderId !== user.id) {
          markThreadAsRead(t.id, user.id);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [isOpen, user?.id, missionId, patronId, workerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || !thread || !user?.id || sending) return;
    setSending(true);
    const { data, error: sendErr, moderated } = await sendMessage({
      threadId: thread.id,
      senderId: user.id,
      body: input,
    });
    setSending(false);

    if (sendErr) {
      setError(sendErr.message || "Envoi impossible.");
      return;
    }

    if (moderated) {
      setModerationNotice(true);
      setTimeout(() => setModerationNotice(false), 4000);
    }

    setInput('');
    if (data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));

      if (peerId) {
        fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: peerId,
            payload: {
              title: senderName || 'Nouveau message',
              body: data.body.length > 120 ? data.body.slice(0, 117) + '…' : data.body,
              url: `/patron/missions`,
              tag: `chat-${data.threadId}`,
            },
          }),
        }).catch(() => {
          /* best-effort, chat already persisted */
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
      />
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:h-[640px] md:max-h-[85vh] md:rounded-3xl bg-[var(--bg-card)] border-0 md:border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col rounded-t-3xl h-[85vh]"
      >
        <div className="p-4 border-b border-[var(--border)] shrink-0 flex items-center gap-3">
          {peerAvatar ? (
            <img src={peerAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[var(--text-muted)]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--text-primary)] truncate">{peerName}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{missionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
        >
          {loading && (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-[var(--text-muted)]" />
              </div>
              <p className="text-sm text-[var(--text-primary)] font-medium">
                Démarrez la conversation
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Échangez les détails pratiques avec {peerName}
              </p>
            </div>
          )}

          {!loading &&
            messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={clsx(
                      'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-bl-md'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    <p
                      className={clsx(
                        'text-[10px] mt-1',
                        isMine ? 'text-white/70' : 'text-[var(--text-muted)]'
                      )}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>

        {moderationNotice && (
          <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 text-[11px] text-amber-500">
            Partage de coordonnées externes masqué. Merci d'échanger via ConnectCHR pour protéger vos droits.
          </div>
        )}

        <div className="p-3 border-t border-[var(--border)] shrink-0 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre message…"
            rows={1}
            disabled={!thread || loading}
            className="flex-1 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-blue-500/50 max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !thread || sending}
            className="w-10 h-10 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            aria-label="Envoyer"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </>
  );
}
