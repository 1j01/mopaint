import png_chunks_extract from "png-chunks-extract";
import png_chunks_encode from "png-chunks-encode";
import png_chunk_text from "png-chunk-text";

const read_png_chunks_from_blob = function(blob, callback) {
	const file_reader = new FileReader();
	file_reader.onload = function() {
		const array_buffer = this.result;
		const uint8_array = new Uint8Array(array_buffer);
		const chunks = png_chunks_extract(uint8_array);
		callback(chunks);
	};
	file_reader.readAsArrayBuffer(blob);
};

export function injectMetadataIntoBlob(blob, metadata, callback) {
	read_png_chunks_from_blob(blob, function(chunks) {
		for (let k in metadata) {
			if (metadata.hasOwnProperty(k)) {
				chunks.splice(-1, 0, png_chunk_text.encode(k, metadata[k]));
			}
		}
		const reencoded_buffer = png_chunks_encode(chunks);
		const reencoded_blob = new Blob([reencoded_buffer], { type: "image/png" });
		callback(reencoded_blob);
	});
}

// exports.inject_metadata = function(uint8_array, metadata) {
// 	const chunks = png_chunks_extract(uint8_array)
// 	for (let k in metadata){
// 		chunks.splice(-1, 0, png_chunk_text.encode(k, metadata[k]))
// 	}
// 	const reencoded_buffer = png_chunks_encode(chunks)
// 	const reencoded_blob = new Blob([reencoded_buffer], {type: "image/png"})
// 	return reencoded_blob
// }

// export function readMetadataFromBlob(file, callback) {
// 	const file_reader = new FileReader
// 	file_reader.onload = function() {
// 		const array_buffer = this.result
// 		const uint8_array = new Uint8Array(array_buffer)
// 		if (is_png(uint8_array)) {
// 			const metadata = read_metadata(uint8_array)
// 			callback(metadata);
// 		}else{
// 			throw new Error("not a PNG")
// 		}
// 	}
// 	file_reader.readAsArrayBuffer(file)
// };

export function readMetadataSync(uint8_array) {
	const chunks = png_chunks_extract(uint8_array);

	const textChunks = chunks
		.filter((chunk) => {
			return chunk.name === "tEXt";
		})
		.map((chunk) => {
			return png_chunk_text.decode(chunk.data);
		});

	const metadata = {};

	for (let i = 0; i < textChunks.length; i++) {
		const textChunk = textChunks[i];
		metadata[textChunk.keyword] = textChunk.text;
	}

	return metadata;
}
