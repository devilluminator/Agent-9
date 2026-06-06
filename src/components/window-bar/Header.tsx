import useStore from "@/store";
import { StateFlags, saveWindowState } from "@tauri-apps/plugin-window-state";
import { X } from "lucide-react";

function Header() {
  const { appWindow } = useStore();
  // Functions
  async function closeWindow() {
    await saveWindowState(StateFlags.ALL);
    await appWindow.close();
  }
  return (
    // Header
    <header
      className="flex justify-between items-center bg-linear-to-r from-zinc-900/75 to-transparent shadow-md shadow-slate-900 p-1.5 w-auto"
      data-tauri-drag-region
    >
      <div>
        <span className="font-tourner text-zinc-100 text-xl">A9</span>
      </div>
      <X
        className="w-8 hover:text-red-300 cursor-pointer"
        onClick={closeWindow}
      />
    </header>
  );
}

export default Header;
