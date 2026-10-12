'use client';
import { useEffect } from 'react';
import { authApi } from './api';

const getAccessTokenExpiry = () => {
  const token = localStorage.getItem('bs_token');
  if (!token) return 0;

  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return 0;
  }
};

export function useTokenRefresh() {
  useEffect(() => {
    let timer;
    let refreshing = false;

    const refresh = async () => {
      if (refreshing || !localStorage.getItem('bs_refresh_token')) return;
      refreshing = true;
      let succeeded = false;
      try {
        await authApi.refresh();
        succeeded = true;
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('bs_token');
          localStorage.removeItem('bs_refresh_token');
          localStorage.removeItem('bs_user');
          window.location.href = '/admin/login';
          return;
        }
      } finally {
        refreshing = false;
        if (succeeded) scheduleRefresh();
        else if (localStorage.getItem('bs_refresh_token')) timer = setTimeout(refresh, 30_000);
      }
    };

    const scheduleRefresh = () => {
      clearTimeout(timer);
      if (!localStorage.getItem('bs_refresh_token')) return;
      const expiresAt = getAccessTokenExpiry();
      if (!expiresAt) return;
      const refreshIn = Math.max(expiresAt - Date.now() - 5 * 60 * 1000, 0);
      timer = setTimeout(refresh, refreshIn);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const expiresAt = getAccessTokenExpiry();
        if (expiresAt - Date.now() < 10 * 60 * 1000) refresh();
      }
    };

    scheduleRefresh();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}
