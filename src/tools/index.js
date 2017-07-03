import line from "./line.js"
import circle from "./circle.js"
import rectangle from "./rectangle.js"

const tools = {
	"Freeform Line": {
		// maybe this should be more like
		// from: "lastPos", to: "pos", draw: (...)=>
		drawSegmentOfPath: line
	},
	"Line": {
		drawShape: line
	},
	"Freeform Circles": {
		drawSegmentOfPath: circle
	},
	"Circle": {
		drawShape: circle
	},
	"Rectangle": {
		drawShape: rectangle
	}
};

const toolsArray = Object.keys(tools).map((key)=> {
	const tool = tools[key];
	return {name: key, ...tool}
})

export default toolsArray;
