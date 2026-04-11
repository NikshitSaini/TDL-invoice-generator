import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getConfig } from '../services/configService';

const ConfigContext = createContext();

export function useConfig() {
  return useContext(ConfigContext);
}

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const refreshConfig = useCallback(async () => {
    try {
      setLoadingConfig(true);
      const data = await getConfig();
      setConfig(data);
    } catch (error) {
      console.error("Failed to load global config:", error);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  // Fetch config on initial mount
  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const value = {
    config,
    loadingConfig,
    refreshConfig
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}
