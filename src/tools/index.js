import line from "./line.js"
import circle from "./circle.js"

const tools = {
	"Freeform Line": {
		// maybe this should be more like
		// from: "lastPos", to: "pos", draw: (...)=>
		drawSegmentOfPath: line
	},
	"Line Fan": {
		// TODO: actual basic Line tool
		drawShape: line
	},
	"Freeform Circles": {
		drawSegmentOfPath: circle
	},
	// TODO: actual basic Circle tool
	// "Circle Fan": {
	// 	drawShape: circle
	// }
};

const toolsArray = Object.keys(tools).map((key)=> {
	const tool = tools[key];
	return {name: key, ...tool}
})

export default toolsArray;
