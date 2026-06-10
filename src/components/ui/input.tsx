import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"file:inline-flex bg-input/30 file:bg-transparent disabled:opacity-50 px-3 py-1 border border-input aria-invalid:border-destructive focus-visible:border-ring dark:aria-invalid:border-destructive/50 file:border-0 rounded-3xl outline-none aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:aria-invalid:ring-destructive/40 w-full min-w-0 h-9 file:h-7 file:font-medium placeholder:text-muted-foreground file:text-foreground md:text-sm file:text-sm text-base transition-colors disabled:cursor-not-allowed disabled:pointer-events-none",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
