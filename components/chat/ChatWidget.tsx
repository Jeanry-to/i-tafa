'use client'

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import {
  getClientForProfile,
  getCurrentProfile,
} from '@/lib/services/api'

type ChatAttachment = {
  name: string
  type: string
  size: number
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  attachments?: ChatAttachment[]
}

const MAX_FILES = 5
const MAX_FILE_SIZE = 50 * 1024 * 1024

const ACCEPTED_FILES = [
  'image/*',
  'application/pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.txt',
  '.md',
  '.json',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.html',
  '.xml',
  '.sql',
  '.py',
  '.java',
  '.php',
  '.c',
  '.cpp',
  '.h',
  '.cs',
  'audio/*',
  'video/*',
].join(',')

function formatFileSize(size: number): string {
  if (size < 1024) {
    return String(size) + ' o'
  }

  if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + ' Ko'
  }

  if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(1) + ' Mo'
  }

  return (size / (1024 * 1024 * 1024)).toFixed(1) + ' Go'
}

function getFileIcon(type: string, name: string): string {
  const lowerName = name.toLowerCase()

  if (type.startsWith('image/')) {
    return '[IMG]'
  }

  if (type.startsWith('audio/')) {
    return '[AUDIO]'
  }

  if (type.startsWith('video/')) {
    return '[VIDEO]'
  }

  if (type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return '[PDF]'
  }

  if (
    lowerName.endsWith('.doc') ||
    lowerName.endsWith('.docx')
  ) {
    return '[WORD]'
  }

  if (
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.csv')
  ) {
    return '[EXCEL]'
  }

  if (
    lowerName.endsWith('.js') ||
    lowerName.endsWith('.jsx') ||
    lowerName.endsWith('.ts') ||
    lowerName.endsWith('.tsx') ||
    lowerName.endsWith('.py') ||
    lowerName.endsWith('.java') ||
    lowerName.endsWith('.php') ||
    lowerName.endsWith('.sql') ||
    lowerName.endsWith('.css') ||
    lowerName.endsWith('.html')
  ) {
    return '[CODE]'
  }

  return '[FILE]'
}

export default function ChatWidget() {
  const { t } = useLanguage()

  const [isOpen, setIsOpen] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([])

  const [input, setInput] = useState('')

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const [isLoading, setIsLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [clientId, setClientId] = useState<string | null>(null)

  const [loadingClient, setLoadingClient] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadClient() {
      setLoadingClient(true)

      try {
        const profile = await getCurrentProfile()

        if (!mounted) {
          return
        }

        if (!profile?.id) {
          setClientId(null)
          return
        }

        const client = await getClientForProfile(profile.id)

        if (!mounted) {
          return
        }

        if (client?.id) {
          setClientId(client.id)
        } else {
          setClientId(null)
        }
      } catch (err) {
        console.error('Erreur recuperation client pour le chat:', err)

        if (mounted) {
          setClientId(null)
        }
      } finally {
        if (mounted) {
          setLoadingClient(false)
        }
      }
    }

    loadClient()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isOpen])

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) {
      return
    }

    setError(null)

    const availableSlots =
      MAX_FILES - selectedFiles.length

    if (availableSlots <= 0) {
      setError(
        'Vous pouvez joindre au maximum ' +
          String(MAX_FILES) +
          ' fichiers.',
      )

      event.target.value = ''
      return
    }

    const filesToAdd = files.slice(0, availableSlots)

    const invalidFiles: string[] = []

    for (const file of filesToAdd) {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(
          file.name +
            ' depasse la taille maximale de 50 Mo.',
        )
      }
    }

    if (invalidFiles.length > 0) {
      setError(invalidFiles.join(' '))
    }

    const validFiles = filesToAdd.filter(
      (file) => file.size <= MAX_FILE_SIZE,
    )

    if (validFiles.length > 0) {
      setSelectedFiles((previous) => [
        ...previous,
        ...validFiles,
      ])
    }

    event.target.value = ''
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index),
    )
  }

  function clearSelectedFiles() {
    setSelectedFiles([])
  }

  async function sendMessage(
    event?: FormEvent<HTMLFormElement>,
  ) {
    event?.preventDefault()

    const text = input.trim()

    if (
      text.length === 0 &&
      selectedFiles.length === 0
    ) {
      return
    }

    if (loadingClient) {
      return
    }

    if (!clientId) {
      setError(
        'Impossible de trouver votre compte client.',
      )
      return
    }

    setIsLoading(true)
    setError(null)

    const filesForMessage: ChatAttachment[] =
      selectedFiles.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      }))

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      attachments:
        filesForMessage.length > 0
          ? filesForMessage
          : undefined,
    }

    setMessages((previous) => [
      ...previous,
      userMessage,
    ])

    setInput('')

    const filesToSend = [...selectedFiles]

    clearSelectedFiles()

    try {
      const formData = new FormData()

      formData.append('message', text)

      formData.append('clientId', clientId)

      formData.append(
        'history',
        JSON.stringify(messages),
      )

      for (const file of filesToSend) {
        formData.append('files', file)
      }

      const response = await fetch('/api/agent', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Une erreur est survenue pendant la requete.',
        )
      }

      const reply =
        typeof data?.reply === 'string'
          ? data.reply
          : 'Je n ai pas recu de reponse.'

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: reply,
        },
      ])
    } catch (err) {
      console.error('Erreur envoi message:', err)

      const message =
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue.'

      setError(message)

      setMessages((previous) => previous.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  function handleInputKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()

      if (!isLoading) {
        void sendMessage()
      }
    }
  }

  const canSend =
    !isLoading &&
    !loadingClient &&
    !!clientId &&
    (input.trim().length > 0 ||
      selectedFiles.length > 0)

  return (
    <>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '80px',
            width: '380px',
            maxWidth: 'calc(100vw - 40px)',
            height: '560px',
            maxHeight: 'calc(100vh - 120px)',
            background: 'var(--background, #ffffff)',
            color: 'var(--foreground, #111111)',
            border: '1px solid rgba(127, 127, 127, 0.25)',
            borderRadius: '16px',
            boxShadow:
              '0 12px 40px rgba(0, 0, 0, 0.20)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom:
                '1px solid rgba(127, 127, 127, 0.20)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div>
              <strong>
                {t('agent') || 'Agent IA'}
              </strong>

              <div
                style={{
                  fontSize: '12px',
                  opacity: 0.65,
                  marginTop: '3px',
                }}
              >
                Texte et fichiers
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px 8px',
              }}
              aria-label="Fermer"
            >
              X
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background:
                    'rgba(127, 127, 127, 0.10)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                }}
              >
                Bonjour. Vous pouvez poser une question
                ou joindre un fichier.
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent:
                    message.role === 'user'
                      ? 'flex-end'
                      : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background:
                      message.role === 'user'
                        ? 'var(--itafa-accent, #2563eb)'
                        : 'rgba(127, 127, 127, 0.12)',
                    color:
                      message.role === 'user'
                        ? '#ffffff'
                        : 'inherit',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '14px',
                    lineHeight: 1.45,
                  }}
                >
                  {message.content && (
                    <div>{message.content}</div>
                  )}

                  {message.attachments &&
                    message.attachments.length > 0 && (
                      <div
                        style={{
                          marginTop:
                            message.content
                              ? '8px'
                              : '0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px',
                        }}
                      >
                        {message.attachments.map(
                          (attachment, attachmentIndex) => (
                            <div
                              key={attachmentIndex}
                              style={{
                                fontSize: '12px',
                                opacity: 0.9,
                              }}
                            >
                              {getFileIcon(
                                attachment.type,
                                attachment.name,
                              )}{' '}
                              {attachment.name}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background:
                    'rgba(127, 127, 127, 0.12)',
                  fontSize: '14px',
                }}
              >
                Analyse en cours...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div
              style={{
                margin: '0 14px 8px',
                padding: '8px 10px',
                borderRadius: '8px',
                background:
                  'rgba(220, 38, 38, 0.10)',
                color: '#b91c1c',
                fontSize: '12px',
              }}
            >
              {error}
            </div>
          )}

          {selectedFiles.length > 0 && (
            <div
              style={{
                padding: '8px 12px',
                borderTop:
                  '1px solid rgba(127, 127, 127, 0.15)',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            >
              {selectedFiles.map((file, index) => (
                <div
                  key={
                    file.name +
                    '-' +
                    String(index)
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '4px 0',
                    fontSize: '12px',
                  }}
                >
                  <span>
                    {getFileIcon(
                      file.type,
                      file.name,
                    )}
                  </span>

                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </span>

                  <span
                    style={{
                      opacity: 0.6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatFileSize(file.size)}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      removeSelectedFile(index)
                    }
                    disabled={isLoading}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: isLoading
                        ? 'default'
                        : 'pointer',
                      padding: '2px 5px',
                    }}
                    aria-label={
                      'Supprimer ' + file.name
                    }
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={sendMessage}
            style={{
              padding: '10px',
              borderTop:
                '1px solid rgba(127, 127, 127, 0.20)',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '7px',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILES}
              onChange={handleFileChange}
              disabled={isLoading}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                isLoading ||
                selectedFiles.length >= MAX_FILES
              }
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '9px',
                border:
                  '1px solid rgba(127, 127, 127, 0.30)',
                background: 'transparent',
                cursor:
                  isLoading ||
                  selectedFiles.length >= MAX_FILES
                    ? 'default'
                    : 'pointer',
                fontSize: '20px',
              }}
              aria-label="Joindre un fichier"
              title="Joindre un fichier"
            >
              +
            </button>

            <textarea
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleInputKeyDown}
              placeholder="Ecrivez votre message..."
              disabled={isLoading}
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                minHeight: '38px',
                maxHeight: '100px',
                borderRadius: '9px',
                border:
                  '1px solid rgba(127, 127, 127, 0.30)',
                background: 'transparent',
                color: 'inherit',
                padding: '9px 10px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />

            <button
              type="submit"
              disabled={!canSend}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '9px',
                border: 'none',
                background:
                  'var(--itafa-accent, #2563eb)',
                color: '#ffffff',
                cursor: canSend
                  ? 'pointer'
                  : 'default',
                opacity: canSend ? 1 : 0.5,
                fontSize: '18px',
              }}
              aria-label="Envoyer"
            >
              &gt;
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          minWidth: '70px',
          height: '44px',
          padding: '0 16px',
          borderRadius: '22px',
          border: 'none',
          background:
            'var(--itafa-accent, #2563eb)',
          color: '#ffffff',
          cursor: 'pointer',
          boxShadow:
            '0 6px 20px rgba(0, 0, 0, 0.20)',
          zIndex: 9999,
          fontWeight: 600,
        }}
      >
        {isOpen ? 'Fermer' : 'Chat'}
      </button>
    </>
  )
}