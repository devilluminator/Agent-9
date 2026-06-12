import { Badge } from "@/components/ui/badge";
import useStore from "@/store";
import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";

function Footer() {
	const { currentProvider } = useStore();
	// States
	const [version, setVersion] = useState("");
	// Effect
	useEffect(() => {
		getVersion().then((version) => {
			setVersion(version);
		});
	});
	return (
		<footer className="flex flex-col justify-between items-center h-0 overflow-clip">
			{!currentProvider ? (
				<span className="opacity-75 p-1.5 w-full text-muted text-sm text-right">
					<Badge>V.{version}</Badge>
				</span>
			) : (
				<div className="flex justify-start items-center bg-zinc-900/30 p-1.5 w-full text-zinc-100/75 text-sm">
					{currentProvider.model}
				</div>
			)}
		</footer>
	);
}

export default Footer;
