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
    setupAudioMode();
  }, []);

  const setupAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
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

    let soundInstance: Audio.Sound | null = null;
    try {
      const { sound } = await Audio.Sound.createAsync(
        soundFile,
        { shouldPlay: true, volume: 1.0 },
        null,
        false // Do not download async for now
      );
      soundInstance = sound;
      
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
        if (!status.isLoaded && status.error) {
          console.warn("Playback error:", status.error);
          await sound.unloadAsync();
        }
      });

      await sound.playAsync();
    } catch (e) {
      // Quietly fail for network sounds
      if (__DEV__) {
        console.log("Sound play skipped or failed (likely network/URL issue):", e instanceof Error ? e.message : e);
      }
      if (soundInstance) {
        try {
          await (soundInstance as Audio.Sound).unloadAsync();
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
