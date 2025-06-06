import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface ExtraParamsContextType {
  extraParams: object;
  setExtraParams: (params: object) => void;
}

const ExtraParamsContext = createContext<ExtraParamsContextType | undefined>(undefined);

interface ExtraParamsProviderProps {
  children: ReactNode;
  value?: object;
}

export const ExtraParamsProvider: React.FC<ExtraParamsProviderProps> = ({ children, value }) => {
  const [extraParams, setExtraParamsState] = useState<object>(() => {
    if (value) return value;
    const savedParams = localStorage.getItem("extraParams");
    try {
      return savedParams ? JSON.parse(savedParams) : {};
    } catch (e) {
      console.error("Failed to parse extraParams from localStorage", e);
      return {};
    }
  });

  useEffect(() => {
    if (value) {
      setExtraParamsState(value);
    }
  }, [value]);

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