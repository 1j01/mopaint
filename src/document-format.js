
export const CURRENT_SERIALIZATION_VERSION = 0.3;

export function serializeDocument({palette, selectedSwatch, selectedTool, undos, redos}) {
	// TODO: serialize tools as code (+ identifiers), and create a sandbox
	const serializeOperation = (operation) => {
		return {
			id: operation.id,
			toolID: operation.tool.name,
			// toolCode: operation.tool.toString(), // not enough to define it; will need the whole module
			points: operation.points,
			swatch: operation.swatch,
		};
	};
	return {
		format: "mopaint",
		formatVersion: CURRENT_SERIALIZATION_VERSION,
		palette: palette,
		selectedSwatch: selectedSwatch,
		selectedToolID: selectedTool.name,
		undos: undos.toJS().map(serializeOperation),
		redos: redos.toJS().map(serializeOperation),
	};
}

export function deserializeDocument() {

}
