import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getConfig } from '../services/configService';
import { useAuth } from './AuthContext';

const ConfigContext = createContext();

export function useConfig() {
  return useContext(ConfigContext);
}

export function ConfigProvider({ children }) {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState(null);

  const refreshConfig = useCallback(async () => {
    try {
      setLoadingConfig(true);
      setError(null);
      const data = await getConfig();
      setConfig(data);
    } catch (err) {
      console.error("Failed to load global config:", err);
      setError(err.message || "Failed to sync configuration");
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  // Fetch config on initial mount
  useEffect(() => {
    refreshConfig();
  }, [refreshConfig, currentUser]);

  const value = {
    config,
    loadingConfig,
    refreshConfig,
    error
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}
