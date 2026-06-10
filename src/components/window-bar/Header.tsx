import { StateFlags, saveWindowState } from "@tauri-apps/plugin-window-state";
import { X } from "lucide-react";
import useStore from "@/store";

function Header() {
	const { appWindow } = useStore();
	// Functions
	async function closeWindow() {
		await appWindow.onMoved(() => {
			saveWindowState(StateFlags.POSITION);
		});
		await appWindow.onResized(() => {
			saveWindowState(StateFlags.SIZE);
		});
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
