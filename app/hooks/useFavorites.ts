"use client";
import { useState, useCallback } from "react";
import { type Favorite, type DateCourse } from "../types";

const FAVORITES_KEY = "sapocha_favorites_v1";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const load = useCallback(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(JSON.parse(stored) as Favorite[]);
    } catch {}
  }, []);

  const add = (fav: Omit<Favorite, "id" | "savedAt">) => {
    const newFav = { ...fav, id: Date.now().toString(), savedAt: Date.now() } as Favorite;
    setFavorites((prev) => {
      const next = [newFav, ...prev];
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const remove = (id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const isSavedReply = (message: string) =>
    favorites.some((f) => f.type === "reply" && f.message === message);

  const isSavedCourse = (theme: string) =>
    favorites.some((f) => f.type === "date" && f.course.theme === theme);

  const toggleReply = (params: { message: string; reason?: string; situation: string; contactName?: string }) => {
    const existing = favorites.find((f) => f.type === "reply" && f.message === params.message);
    if (existing) {
      remove(existing.id);
    } else {
      add({ type: "reply", ...params });
    }
  };

  const toggleCourse = (params: { course: DateCourse; situation: string; contactName?: string }) => {
    const existing = favorites.find((f) => f.type === "date" && f.course.theme === params.course.theme);
    if (existing) {
      remove(existing.id);
    } else {
      add({ type: "date", ...params });
    }
  };

  return { favorites, load, remove, isSavedReply, isSavedCourse, toggleReply, toggleCourse };
}
