'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  Avatar,
} from '@mui/material';
import { Send, ArrowUp, History, RefreshCw, Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  references?: Array<{ id: string; type: string; title: string }>;
}

interface AIAssistantProps {
  workspaceId: string;
}

export function AIAssistant({ workspaceId }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setStreaming(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/backend/workspaces/${workspaceId}/ai/assistant/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          question: input,
          retrieved_context: [],
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start AI stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'token') {
                assistantContent += parsed.content || '';
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id ? { ...m, content: assistantContent } : m
                  )
                );
              } else if (parsed.type === 'done') {
                setStreaming(false);
                reader.releaseLock();
                return;
              } else if (parsed.type === 'error') {
                setError(parsed.error || 'AI stream error');
                setStreaming(false);
                reader.releaseLock();
                return;
              }
            } catch {
              // Ignore parse errors on partial chunks
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to send message');
      setStreaming(false);
    } finally {
      if (!streaming) setStreaming(false);
    }
  }, [input, streaming, workspaceId]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStreaming(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bg: 'primary.main', color: 'primary.contrastText' }}>
            <Bot size={20} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
              AI Workspace Assistant
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Answers based on authorized workspace context only
            </Typography>
          </Box>
        </Box>
        <Chip label={streaming ? 'Streaming...' : 'Ready'} size="small" color={streaming ? 'primary' : 'default'} />
      </Paper>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
            <History size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <Typography variant="body2">Start a conversation with your AI assistant.</Typography>
            <Typography variant="caption" sx={{ mt: 1 }}>
              Your questions are answered using only authorized workspace data.
            </Typography>
          </Box>
        )}
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
              maxWidth: msg.role === 'user' ? '80%' : '100%',
              marginLeft: msg.role === 'user' ? 'auto' : 0,
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                bg: msg.role === 'user' ? 'primary.main' : 'action.hover',
                color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
              }}
            >
              {msg.role === 'user' ? <Send size={18} /> : <Bot size={18} />}
            </Avatar>
            <Box sx={{ maxWidth: '100%' }}>
              <Paper
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bg:
                    msg.role === 'user' ? 'primary.main' : 'background.paper',
                  color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  border: msg.role === 'assistant' ? '1px solid' : 'none',
                  borderColor: 'divider',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 0 }}>
                  {msg.content}
                </Typography>
                {msg.references && msg.references.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {msg.references.map((ref) => (
                      <Chip key={ref.id} label={`${ref.type}: ${ref.title}`} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        ))}
        {error && (
          <Box sx={{ p: 1.5, color: 'error.main', backgroundColor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
      </Box>

      <Paper sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <form onSubmit={sendMessage}>
          <TextField
            fullWidth
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming}
            placeholder={streaming ? 'Streaming...' : 'Ask about your workspace...'}
            sx={{ flex: 1 }}
          />
          <Button
            type="submit"
            disabled={streaming || !input.trim()}
            variant="contained"
            startIcon={
              streaming ? (
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <ArrowUp size={18} />
              )
            }
          >
            {streaming ? 'Stop' : 'Send'}
          </Button>
          {streaming && (
            <Button
              type="button"
              onClick={stopStream}
              variant="outlined"
              color="error"
              size="small"
            >
              Stop
            </Button>
          )}
          <Button type="button" onClick={clearChat} variant="text" size="small" color="inherit">
            Clear
          </Button>
        </form>
        </Box>
      </Paper>
    </Box>
  );
}
