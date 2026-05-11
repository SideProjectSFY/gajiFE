'use client';

import { useState, useEffect } from 'react';
import { css } from '../../styled-system/css';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle size={18} className={css({ color: 'green.500' })} />,
    error: <AlertCircle size={18} className={css({ color: 'red.500' })} />,
    info: <Info size={18} className={css({ color: 'teal.600' })} />
  };

  return (
    <div className={css({
      display: 'flex',
      alignItems: 'center',
      gap: '3',
      p: '3',
      pr: '8',
      rounded: 'md',
      bg: 'white',
      shadow: 'md',
      borderLeft: '4px solid',
      borderColor: toast.type === 'success' ? 'green.500' : toast.type === 'error' ? 'red.500' : 'teal.600',
      minW: '300px',
      animation: 'slideIn 0.3s ease-out',
      position: 'relative',
      mb: '2'
    })}>
      {icons[toast.type]}
      <p className={css({ fontSize: 'sm', color: 'gray.800', fontWeight: 'medium' })}>{toast.message}</p>
      <button 
        onClick={() => onDismiss(toast.id)}
        className={css({
          position: 'absolute',
          top: '2',
          right: '2',
          p: '1',
          color: 'gray.400',
          cursor: 'pointer',
          _hover: { color: 'gray.600' }
        })}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// Simple event bus for toasts
type ToastListener = (toast: Toast) => void;
const listeners: ToastListener[] = [];

export const toast = {
  show: (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };
    listeners.forEach(listener => listener(newToast));
  },
  success: (message: string) => toast.show(message, 'success'),
  error: (message: string) => toast.show(message, 'error'),
  info: (message: string) => toast.show(message, 'info')
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleNewToast = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
    };
    listeners.push(handleNewToast);
    return () => {
      const index = listeners.indexOf(handleNewToast);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className={css({
      position: 'fixed',
      bottom: '4',
      right: '4',
      zIndex: 'toast'
    })}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
