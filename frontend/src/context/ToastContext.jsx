import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = (msg, type='success') => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </ToastContext.Provider>
  );
};
