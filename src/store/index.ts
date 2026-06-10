import { getCurrentWindow } from "@tauri-apps/api/window";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoreState {
	appWindow: ReturnType<typeof getCurrentWindow>;
	count: number;
	increment: () => void;
	decrement: () => void;
	currentProvider: string | null;
}

const useStore = create<StoreState>()(
	persist(
		(set) => ({
			count: 0,
			appWindow: getCurrentWindow(),
			increment: () => set((state) => ({ count: state.count + 1 })),
			decrement: () => set((state) => ({ count: state.count - 1 })),
			currentProvider: localStorage.getItem("settings"),
		}),
		{
			name: "store",
		},
	),
);

export default useStore;
