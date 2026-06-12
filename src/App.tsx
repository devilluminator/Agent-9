// import { invoke } from "@tauri-apps/api/core";
//
import { Effect, getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";
import {
	restoreStateCurrent,
	StateFlags,
} from "@tauri-apps/plugin-window-state";
import FontFaceObserver from "fontfaceobserver";
import { useEffect, useState } from "react";
import "./App.css";
import Chat from "./components/Chat";
import Footer from "./components/footer";
import Setup from "./components/Setup";
import Header from "./components/window-bar/Header";
import useStore from "./store";

function App() {
	// Store
	const { currentProvider } = useStore();
	// States
	// const [greetMsg, setGreetMsg] = useState("");
	// const [name, setName] = useState("");
	const [fontLoaded, setFontLoaded] = useState(false);

	// async function greet() {
	//   // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
	//   setGreetMsg(await invoke("greet", { name }));
	// }
	// Blur, Acrylic effects
	async function initWindow() {
		const appWindow = getCurrentWindow();
		try {
			// Fonts
			// const observer = new FontFaceObserver('Tourner');
			await restoreStateCurrent(StateFlags.ALL);
			// Apply the Acrylic effect
			await appWindow.setMinSize(new PhysicalSize(900, 600));
			await appWindow.setEffects({
				effects: [Effect.Acrylic], // You can also use Effect.Mica, Effect.Blur, etc.
				color: "#00000010", // Optional: RGBA hex (last two digits = alpha, Win 10,7)
			});
			await appWindow.show();
			await appWindow.setFocus();
			const observer = new FontFaceObserver("Tourner");
			await observer.load().then(() => {
				setFontLoaded(true);
			});
			console.log("Acrylic effect applied successfully!");
		} catch (err) {
			console.error("Failed to apply acrylic effect:", err);
		}
	}
	// Effects
	useEffect(() => {
		initWindow();
	});
	return (
		<div
			className={`flex flex-col h-screen ${fontLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-900 bg-pattern`}
		>
			<Header />
			<main className="flex flex-col justify-center items-center h-full">
				{!currentProvider ? <Setup /> : <Chat />}
			</main>
			<Footer />
		</div>
	);
}

export default App;
