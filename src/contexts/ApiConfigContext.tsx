import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredApiBaseUrl, getStoredApiMode, setStoredApiBaseUrl, setStoredApiMode } from '../services/apiClient';

interface ApiConfigContextType {
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  apiMode: 'live' | 'demo';
  setApiMode: (mode: 'live' | 'demo') => void;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

export const ApiConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(getStoredApiBaseUrl());
  const [apiMode, setApiModeState] = useState<'live' | 'demo'>(getStoredApiMode());

  const setApiBaseUrl = (url: string) => {
    setStoredApiBaseUrl(url);
    setApiBaseUrlState(url);
  };

  const setApiMode = (mode: 'live' | 'demo') => {
    setStoredApiMode(mode);
    setApiModeState(mode);
  };

  return (
    <ApiConfigContext.Provider
      value={{
        apiBaseUrl,
        setApiBaseUrl,
        apiMode,
        setApiMode,
      }}
    >
      {children}
    </ApiConfigContext.Provider>
  );
};

export function useApiConfig() {
  const ctx = useContext(ApiConfigContext);
  if (!ctx) {
    return {
      apiBaseUrl: getStoredApiBaseUrl(),
      setApiBaseUrl: setStoredApiBaseUrl,
      apiMode: getStoredApiMode(),
      setApiMode: setStoredApiMode,
    };
  }
  return ctx;
}
