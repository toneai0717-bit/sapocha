"use client";
import { useState, useCallback } from "react";
import { type Profile, EMPTY_PROFILE } from "../types";

const PROFILE_KEY = "sapocha_profile_v2";

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [savedProfile, setSavedProfile] = useState<Profile>(EMPTY_PROFILE);

  const load = useCallback(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Profile;
        setSavedProfile(parsed);
        setProfile(parsed);
      }
    } catch {}
  }, []);

  const save = (p: Profile) => {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
    setSavedProfile(p);
    setProfile(p);
  };

  const updateField = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const resetDraft = () => setProfile(savedProfile);

  return { profile, savedProfile, load, save, updateField, resetDraft };
}
