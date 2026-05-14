import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";

interface SoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (value: boolean) => Promise<void>;
  playSound: (soundFile: any) => Promise<void>;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabledState] = useState(true);

  useEffect(() => {
    loadSoundSetting();
  }, []);

  const loadSoundSetting = async () => {
    try {
      const savedSound = await AsyncStorage.getItem("settings_sound");
      if (savedSound !== null) {
        setSoundEnabledState(savedSound === "true");
      }
    } catch (e) {
      console.error("Failed to load sound setting", e);
    }
  };

  const setSoundEnabled = async (value: boolean) => {
    setSoundEnabledState(value);
    try {
      await AsyncStorage.setItem("settings_sound", value.toString());
    } catch (e) {
      console.error("Failed to save sound setting", e);
    }
  };

  const playSound = async (soundFile: any) => {
    if (!soundEnabled) return;

    try {
      const { sound } = await Audio.Sound.createAsync(soundFile);
      await sound.playAsync();
      
      // Unload sound from memory after playing
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (e) {
      console.error("Failed to play sound", e);
    }
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
