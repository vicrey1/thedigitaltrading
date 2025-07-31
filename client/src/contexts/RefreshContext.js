// src/contexts/RefreshContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
  console.log('RefreshProvider rendered');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  return (
    <RefreshContext.Provider value={{ autoRefresh, setAutoRefresh, refreshInterval, setRefreshInterval }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  return useContext(RefreshContext);
};

// Custom hook for auto-refreshing data
export const useAutoRefresh = (fetchFunction, dependencies = []) => {
  const { autoRefresh, refreshInterval } = useRefresh();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let isMounted = true;
    const refresh = async () => {
      if (isMounted) await fetchFunction();
    };
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []); // eslint-disable-line
};