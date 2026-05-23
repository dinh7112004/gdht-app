import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAudioModeAsync, createAudioPlayer, AudioPlayer } from "expo-audio";

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
    setupAudioMode();
  }, []);

  const setupAudioMode = async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
    } catch (e) {
      console.error("Failed to setup audio mode", e);
    }
  };

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
    if (!soundEnabled || !soundFile) return;

    let soundInstance: AudioPlayer | null = null;
    try {
      soundInstance = createAudioPlayer(soundFile);
      
      // We don't have a reliable callback for exact end of playback in the new imperative API
      // without using hooks, so we just play it.
      // expo-audio automatically handles native resources fairly well, or we can release it after some timeout.
      soundInstance.play();
      
    } catch (e) {
      // Quietly fail for network sounds
      if (__DEV__) {
        console.log("Sound play skipped or failed:", e instanceof Error ? e.message : e);
      }
      if (soundInstance) {
        try {
          soundInstance.release();
        } catch (err) {}
      }
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
