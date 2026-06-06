import { Command } from "@tauri-apps/plugin-shell";

/**
 * Execute an arbitrary command on the system.
 */
async function executeAnyCommand(fullCommandLine: string): Promise<string> {
	// Simple check to see if the user is on Windows
	const isWindows = navigator.userAgent.toLowerCase().includes("win");

	let programName: string;
	let args: string[];

	if (isWindows) {
		// Uses cmd.exe to run the command
		programName = "run-cmd";
		args = ["/C", fullCommandLine];
	} else {
		// Uses sh to run the command on macOS/Linux
		programName = "run-sh";
		args = ["-c", fullCommandLine];
	}

	try {
		const command = await Command.create(programName, args);
		const output = await command.execute();

		if (output.code !== 0) {
			throw new Error(
				`Command failed with exit code ${output.code}. Stderr: ${output.stderr}`,
			);
		}

		return output.stdout;
	} catch (error) {
		console.error("Shell Execution Error:", error);
		throw error;
	}
}
export default executeAnyCommand;
// Example usage:
// await executeAnyCommand("mkdir -p my-folder && cd my-folder && echo 'Hello' > test.txt");
