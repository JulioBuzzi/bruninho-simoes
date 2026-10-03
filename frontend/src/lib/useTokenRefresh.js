'use client';
import { useEffect } from 'react';
import { authApi } from './api';

/**
 * Proactively refreshes the JWT token before it expires.
 * Call this hook inside any page that requires authentication.
 * Reads the exp claim from the token and schedules a refresh
 * 5 minutes before expiry. On tab focus/visibility, also checks
 * if the token needs renewing.
 */
export function useTokenRefresh() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scheduleRefresh = () => {
      const token = localStorage.getItem('bs_token');
      if (!token) return;

      try {
        // Decode payload (no verification needed here — server will verify)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000; // ms
        const now = Date.now();
        const msUntilExpiry = expiresAt - now;

        // If already expired or less than 30s left, refresh immediately
        if (msUntilExpiry < 30_000) {
          doRefresh();
          return;
        }

        // Schedule refresh 5 minutes before expiry
        const refreshIn = msUntilExpiry - 5 * 60 * 1000;
        const timer = setTimeout(doRefresh, Math.max(refreshIn, 0));
        return () => clearTimeout(timer);
      } catch {
        // Malformed token — let the 401 interceptor handle it
      }
    };

    const doRefresh = async () => {
      try {
        const data = await authApi.refresh();
        localStorage.setItem('bs_token', data.token);
        localStorage.setItem('bs_user', JSON.stringify(data.user));
        // Reschedule for the new token
        scheduleRefresh();
      } catch {
        // Refresh failed — interceptor in api.js will redirect to login on next request
      }
    };

    // Refresh when tab becomes visible again (user returns after long break)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem('bs_token');
        if (!token) return;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const msLeft = payload.exp * 1000 - Date.now();
          // If less than 10 minutes left, refresh now
          if (msLeft < 10 * 60 * 1000) doRefresh();
        } catch {}
      }
    };

    const cleanup = scheduleRefresh();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cleanup?.();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}