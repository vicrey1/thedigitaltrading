// src/contexts/RefreshContext.js
import React, { createContext, useContext } from 'react';

const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
  console.log('RefreshProvider rendered');

  return (
    <RefreshContext.Provider value={{}}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  return useContext(RefreshContext);
};

// Custom hook for auto-refreshing data
export const useAutoRefresh = (fetchFunction, dependencies = []) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
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