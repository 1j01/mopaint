
function compute({ program, cache, }) {

}

function deleteHistory({ program, cache, stepsToDelete }) {


	// TODO: non-destructive (DDDBD), prereq: metahistory

	// return {
	// 	permanentlyDelete: function () {

	// 	}
	// };
}


function loadImageFile(bytes) {
	return bytes.slice(4);
}
function crop(array, x1, x2) {
	return array.slice(x1, x2);
}



/* global it:false expect:false */
// it("compute", () => {
// });

it("history deletion", () => {
	// var program = {
	// 	image: [loadImageFile, [0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 255, 255]],
	// 	cropped: [crop, "@@@@image"],
	// };
	var program = {
		imageFileData: {
			type: "array",
			data: [/*magic bytes (not a real format)*/0, 0, 0, 0, /*pixel data*/255, 255, 255, 255, 255, 0, 255, 255],
		},
		imageData: {
			type: "call",
			function: loadImageFile,
			inputs: {
				imageFileData: "imageFileData",
			},
			// outputs: {
			// imageData: "imageData",
			// },
		},
		croppedImageData: {
			type: "call",
			function: crop,
			inputs: {
				imageData: "imageData",
			},
			// outputs: {
			// croppedImageData: "croppedImageData",
			// },
		},
	};
	const stepsToDelete = [
		"imageFileData",
		"imageData",
	];
	expect(deleteHistory({ program, stepsToDelete }))
		.toMatchSnapshot();
});
