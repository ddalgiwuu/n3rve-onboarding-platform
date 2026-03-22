import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface OpenClawQCResult {
  severity: 'error' | 'warning' | 'info';
  category: 'METADATA' | 'AUDIO' | 'ARTWORK' | 'DSP_SPECIFIC' | 'FORMAT';
  field?: string;
  dsp?: string;
  message: string;
  messageKo: string;
  suggestion?: string;
  suggestedValue?: string;
  source: 'OPENCLAW';
}

interface QCResponse {
  requestId: string;
  sessionId: string;
  results: OpenClawQCResult[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
    isValid: boolean;
  };
}

interface UseOpenClawQCReturn {
  results: OpenClawQCResult[];
  isChecking: boolean;
  isConnected: boolean;
  isAvailable: boolean;
  sendQCRequest: (step: number, data: unknown) => void;
  summary: { errors: number; warnings: number; info: number; isValid: boolean } | null;
  clearResults: () => void;
}

export function useOpenClawQC(): UseOpenClawQCReturn {
  const socketRef = useRef<Socket | null>(null);
  const [results, setResults] = useState<OpenClawQCResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [summary, setSummary] = useState<QCResponse['summary'] | null>(null);
  const sessionIdRef = useRef<string>(
    `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const socket = io(`${apiUrl}/qc`, {
      transports: ['websocket'],
      auth: { sessionId: sessionIdRef.current },
      reconnection: true,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsAvailable(false);
    });

    socket.on('connected', (data: { role: string; sessionId?: string }) => {
      if (data.sessionId) sessionIdRef.current = data.sessionId;
    });

    socket.on(
      'qc-status',
      (data: { requestId: string; status: string; message: string }) => {
        if (data.status === 'processing') {
          setIsChecking(true);
          setIsAvailable(true);
        } else if (data.status === 'unavailable') {
          setIsChecking(false);
          setIsAvailable(false);
        }
      }
    );

    socket.on('qc-result', (data: QCResponse) => {
      setResults(data.results.map((r) => ({ ...r, source: 'OPENCLAW' as const })));
      setSummary(data.summary);
      setIsChecking(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendQCRequest = useCallback((step: number, data: unknown) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (socketRef.current?.connected) {
        const requestId = `req-${Date.now()}`;
        socketRef.current.emit('qc-request', {
          requestId,
          sessionId: sessionIdRef.current,
          step,
          data,
        });
        setIsChecking(true);
      }
    }, 500);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setSummary(null);
  }, []);

  return { results, isChecking, isConnected, isAvailable, sendQCRequest, summary, clearResults };
}
