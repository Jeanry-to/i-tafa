'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ChatWidget.module.css';
import { useLanguage } from '@/lib/i18n/language-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    t('chat.suggestion.1'),
    t('chat.suggestion.2'),
    t('chat.suggestion.3'),
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const nextHistory: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextHistory);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Une erreur est survenue.');
      }

      setMessages([...nextHistory, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setError(t('chat.error'));
      console.error('Erreur widget chat :', err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className={styles.wrapper}>
      {isOpen && (
        <div className={styles.panel} role="dialog" aria-label="Assistant de conversation">
          <div className={styles.header}>
            <div>
              <p className={styles.headerTitle}>{t('chat.header.title')}</p>
              <p className={styles.headerSubtitle}>{t('chat.header.subtitle')}</p>
            </div>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label={t('chat.launcher.close')}
            >
              ✕
            </button>
          </div>

          <div className={styles.messages} ref={scrollRef}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>{t('chat.empty.text')}</p>
                <div className={styles.suggestions}>
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      className={styles.suggestionChip}
                      onClick={() => sendMessage(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={
                  msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant
                }
              >
                {msg.content}
              </div>
            ))}

            {isLoading && (
              <div className={styles.bubbleAssistant}>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            )}

            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>

          <form className={styles.inputRow} onSubmit={handleSubmit}>
            <input
              className={styles.input}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.input.placeholder')}
              aria-label={t('chat.input.placeholder')}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={isLoading || input.trim() === ''}
              aria-label="Envoyer"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        className={styles.launcher}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? t('chat.launcher.close') : t('chat.launcher.open')}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
