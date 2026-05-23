import React, { createContext, useContext, useState } from "react";

interface SoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (value: boolean) => Promise<void>;
  playSound: (soundFile: any) => Promise<void>;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabledState] = useState(true);

  const setSoundEnabled = async (value: boolean) => {
    setSoundEnabledState(value);
  };

  const playSound = async (_soundFile: any) => {
    // audio disabled
  };

  return (
    <SoundContext.Provider value={{ soundEnabled, setSoundEnabled, playSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
};
