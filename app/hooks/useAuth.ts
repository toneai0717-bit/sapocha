"use client";
import { useState, useCallback } from "react";

const ACCESS_KEY_KEY = "sapocha_access_key";

export function useAuth() {
  const [storedKey, setStoredKey] = useState("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [accessKeyInput, setAccessKeyInput] = useState("");

  const load = useCallback(() => {
    try { setStoredKey(localStorage.getItem(ACCESS_KEY_KEY) ?? ""); } catch {}
  }, []);

  const submit = () => {
    if (!accessKeyInput.trim()) return;
    const key = accessKeyInput.trim();
    try { localStorage.setItem(ACCESS_KEY_KEY, key); } catch {}
    setStoredKey(key);
    setAccessKeyInput("");
    setShowAuthPrompt(false);
  };

  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (storedKey) headers["Authorization"] = `Bearer ${storedKey}`;
    return headers;
  };

  return {
    storedKey,
    showAuthPrompt,
    accessKeyInput,
    setAccessKeyInput,
    setShowAuthPrompt,
    load,
    submit,
    getHeaders,
  };
}
