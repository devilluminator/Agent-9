import { ConversationDB } from "@/lib/database";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoreState {
  count: number;
  increment: () => void;
  decrement: () => void;
  currentProvider: {
    provider_name: string;
    base_url: string;
    api_key: string;
    model: string;
  } | null;
  updateProvider: (provider: {
    provider_name: string;
    base_url: string;
    api_key: string;
    model: string;
  }) => void;
  db: ConversationDB | null;
  initDb: () => Promise<void>;
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
      currentProvider: (() => {
        try {
          const raw = localStorage.getItem("settings");
          if (!raw) return null;
          const parsed = JSON.parse(raw) as {
            provider_name: string;
            base_url: string;
            api_key: string;
            model: string;
          };
          return parsed;
        } catch {
          return null;
        }
      })(),
      updateProvider: (provider) => {
        set({ currentProvider: provider });
        localStorage.setItem("settings", JSON.stringify(provider));
      },
      db: null,
      initDb: async () => {
        // Only initialize once
        if (get().db) return;
        const dbInstance = await ConversationDB.create();
        set({ db: dbInstance });
      },
    }),
    {
      name: "store",
      partialize: (state) => ({
        count: state.count,
        currentProvider: state.currentProvider,
        // omit db from persistence
      }),
    }
  )
);

export default useStore;