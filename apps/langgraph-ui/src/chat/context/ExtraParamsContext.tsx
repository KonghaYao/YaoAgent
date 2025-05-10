import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface ExtraParamsContextType {
  extraParams: object;
  setExtraParams: (params: object) => void;
}

const ExtraParamsContext = createContext<ExtraParamsContextType | undefined>(undefined);

export const ExtraParamsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [extraParams, setExtraParamsState] = useState<object>(() => {
    const savedParams = localStorage.getItem("extraParams");
    try {
      return savedParams ? JSON.parse(savedParams) : {};
    } catch (e) {
      console.error("Failed to parse extraParams from localStorage", e);
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("extraParams", JSON.stringify(extraParams));
  }, [extraParams]);

  const setExtraParams = (params: object) => {
    setExtraParamsState(params);
  };

  return (
    <ExtraParamsContext.Provider value={{ extraParams, setExtraParams }}>
      {children}
    </ExtraParamsContext.Provider>
  );
};

export const useExtraParams = (): ExtraParamsContextType => {
  const context = useContext(ExtraParamsContext);
  if (context === undefined) {
    throw new Error('useExtraParams must be used within an ExtraParamsProvider');
  }
  return context;
}; 