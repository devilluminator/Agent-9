import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Switch({
	className,
	size = "default",
	...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
	size?: "sm" | "default";
}) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			data-size={size}
			className={cn(
				// Colors adjusted: checked background is green, unchecked background is blue
				"group/switch peer inline-flex after:absolute relative after:-inset-x-3 after:-inset-y-2 items-center data-checked:bg-green-500 data-unchecked:bg-blue-500 dark:data-checked:bg-green-600 dark:data-unchecked:bg-blue-600 data-disabled:opacity-50 border border-transparent aria-invalid:border-destructive focus-visible:border-ring dark:aria-invalid:border-destructive/50 rounded-full outline-none aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:aria-invalid:ring-destructive/40 transition-all data-disabled:cursor-not-allowed shrink-0",
				// Dimensions doubled:
				// - default: w-[32px] -> w-[64px], h-[18.4px] -> h-[36.8px]
				// - sm: w-[24px] -> w-[48px], h-[14px] -> h-[28px]
				"data-[size=default]:w-[64px] data-[size=sm]:w-[48px] data-[size=default]:h-[36.8px] data-[size=sm]:h-[28px]",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className={cn(
					"block bg-background rounded-full ring-0 transition-transform pointer-events-none",
					// Thumb dimensions increased slightly:
					// - default: size-8 (32px) -> size-[34px]
					// - sm: size-6 (24px) -> size-[26px]
					"group-data-[size=default]/switch:size-[34px] group-data-[size=sm]/switch:size-[26px]",
					// Translation adjusted to -6px to keep the larger thumb aligned within the track boundaries
					"group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-6px)] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-6px)] group-data-[size=sm]/switch:data-unchecked:translate-x-0",
				)}
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
