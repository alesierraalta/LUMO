"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DebugLog {
  timestamp: string;
  type: 'event' | 'state' | 'error' | 'network' | 'render';
  message: string;
  data?: any;
}

export function useDebugInventoryAdjust(inventoryId: string, action: 'add' | 'remove') {
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const router = useRouter();
  const mountTime = useRef(Date.now());

  const addLog = (type: DebugLog['type'], message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    setDebugLogs(prev => [...prev.slice(-49), log]); // Keep last 50 logs
    console.log(`🔍 [${type.toUpperCase()}] ${message}`, data || '');
  };

  // Monitor component lifecycle
  useEffect(() => {
    addLog('render', `Component mounted - ${action} stock for ${inventoryId}`);
    
    // Monitor router state
    addLog('state', 'Router ready', { pathname: window.location.pathname });

    // Monitor DOM mutations
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const addedButtons = Array.from(mutation.addedNodes).filter(
            node => node instanceof Element && (
              node.tagName === 'BUTTON' || 
              node.querySelector('button')
            )
          );
          if (addedButtons.length > 0) {
            addLog('render', `Buttons added to DOM: ${addedButtons.length}`);
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Monitor all click events
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as Element;
      addLog('event', `Click detected on: ${target.tagName}`, {
        className: target.className,
        id: target.id,
        textContent: target.textContent?.slice(0, 50)
      });
    };

    document.addEventListener('click', clickHandler, true);

    // Monitor network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0]?.toString() || '';
      addLog('network', `Fetch request: ${url}`);
      try {
        const response = await originalFetch(...args);
        addLog('network', `Fetch response: ${response.status} ${url}`);
        return response;
      } catch (error) {
        addLog('error', `Fetch error: ${url}`, error);
        throw error;
      }
    };

    // Monitor errors
    const errorHandler = (e: ErrorEvent) => {
      addLog('error', `JavaScript error: ${e.message}`, {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
      });
    };

    window.addEventListener('error', errorHandler);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', clickHandler, true);
      window.fetch = originalFetch;
      window.removeEventListener('error', errorHandler);
      addLog('render', 'Component unmounted');
    };
  }, [inventoryId, action]);

  // Debug button visibility
  useEffect(() => {
    const checkButtons = () => {
      const buttons = document.querySelectorAll('button');
      const visibleButtons = Array.from(buttons).filter(btn => {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      });
      
      addLog('state', `Button check: ${visibleButtons.length}/${buttons.length} visible`, {
        total: buttons.length,
        visible: visibleButtons.length,
        buttonTexts: visibleButtons.map(btn => btn.textContent?.slice(0, 20))
      });
    };

    const interval = setInterval(checkButtons, 2000);
    checkButtons(); // Initial check

    return () => clearInterval(interval);
  }, []);

  // Enhanced button click wrapper
  const debugButtonClick = (originalHandler: () => void, buttonName: string) => {
    return () => {
      addLog('event', `Button clicked: ${buttonName}`);
      try {
        originalHandler();
        addLog('event', `Button handler completed: ${buttonName}`);
      } catch (error) {
        addLog('error', `Button handler error: ${buttonName}`, error);
      }
    };
  };

  // Toggle debug visibility with keyboard shortcut
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsDebugVisible(prev => !prev);
        addLog('event', `Debug overlay ${!isDebugVisible ? 'shown' : 'hidden'}`);
      }
    };

    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [isDebugVisible]);

  return {
    debugLogs,
    isDebugVisible,
    setIsDebugVisible,
    addLog,
    debugButtonClick
  };
}