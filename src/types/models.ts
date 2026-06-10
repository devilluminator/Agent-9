// Individual model entry
interface ModelEntry {
	id: string; // e.g., "glm-5.1:cloud"
	object: "model"; // literal type, always "model"
	created: number; // Unix timestamp (seconds)
	owned_by: string; // e.g., "library"
}

// Root response object
export type ModelsListResponse = {
	object: "list"; // literal type, always "list"
	data: ModelEntry[];
};
