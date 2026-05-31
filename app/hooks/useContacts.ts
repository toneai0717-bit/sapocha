"use client";
import { useState, useCallback } from "react";
import { type Contact } from "../types";

const CONTACTS_KEY = "sapocha_contacts_v1";
const SELECTED_CONTACT_KEY = "sapocha_selected_contact_v1";

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const load = useCallback(() => {
    try {
      const stored = localStorage.getItem(CONTACTS_KEY);
      if (stored) setContacts(JSON.parse(stored) as Contact[]);
      const sel = localStorage.getItem(SELECTED_CONTACT_KEY);
      if (sel) setSelectedContactId(sel);
    } catch {}
  }, []);

  const add = (name: string, contactProfile: string) => {
    const contact: Contact = {
      id: Date.now().toString(),
      name,
      profile: contactProfile,
      situationHistory: [],
      createdAt: Date.now(),
    };
    setContacts((prev) => {
      const next = [...prev, contact];
      try { localStorage.setItem(CONTACTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setSelectedContactId(contact.id);
    try { localStorage.setItem(SELECTED_CONTACT_KEY, contact.id); } catch {}
    setShowAdd(false);
  };

  const update = (updated: Contact) => {
    setContacts((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      try { localStorage.setItem(CONTACTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setEditing(null);
  };

  const remove = (id: string) => {
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try { localStorage.setItem(CONTACTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setEditing(null);
    if (selectedContactId === id) {
      setSelectedContactId(null);
      try { localStorage.removeItem(SELECTED_CONTACT_KEY); } catch {}
    }
  };

  const select = (id: string) => {
    if (selectedContactId === id) {
      setSelectedContactId(null);
      try { localStorage.removeItem(SELECTED_CONTACT_KEY); } catch {}
    } else {
      setSelectedContactId(id);
      try { localStorage.setItem(SELECTED_CONTACT_KEY, id); } catch {}
    }
  };

  const appendHistory = (id: string, situation: string) => {
    setContacts((prev) => {
      const next = prev.map((c) =>
        c.id === id
          ? { ...c, situationHistory: [...c.situationHistory.slice(-9), situation] }
          : c
      );
      try { localStorage.setItem(CONTACTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const getSelected = () => contacts.find((c) => c.id === selectedContactId) ?? null;

  const getHistory = (): string => {
    const contact = getSelected();
    if (!contact || contact.situationHistory.length === 0) return "";
    return contact.situationHistory.map((s, i) => `${i + 1}. ${s}`).join("\n");
  };

  return {
    contacts,
    selectedContactId,
    showAdd,
    setShowAdd,
    editing,
    setEditing,
    load,
    add,
    update,
    remove,
    select,
    appendHistory,
    getSelected,
    getHistory,
  };
}
