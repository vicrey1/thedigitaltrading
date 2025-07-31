import React, { createContext, useContext, useState, useCallback } from 'react';

const UserDataRefreshContext = createContext({
  lastRefresh: 0,
  refreshUserData: () => {},
});

export function UserDataRefreshProvider({ children }) {
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const refreshUserData = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);
  return (
    <UserDataRefreshContext.Provider value={{ lastRefresh, refreshUserData }}>
      {children}
    </UserDataRefreshContext.Provider>
  );
}

export function useUserDataRefresh() {
  return useContext(UserDataRefreshContext);
}
