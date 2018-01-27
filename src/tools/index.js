import line from "./line.js"
import circle from "./circle.js"
import rectangle from "./rectangle.js"
import fill from "./fill.js"

const tools = {
	"Freeform Line": {
		// maybe this should be more like
		// from: "lastPos", to: "pos", draw: (...)=>
		// or make this less framework-like/abstract at this level
		// and just have it register event handlers
		// and have a function for transforming mouse coordinates to canvas coordinates, etc.
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
	},
	"Fill": {
		// these UI function signatures are pretty arbitrary and would only get worse
		// as time goes on and I maintain backwards compatibility out of laziness and add things to the end
		// and it doesn't help that there's this layer of indirection
		click: function(opCtx, x, y, swatch, documentCtx){
			opCtx.drawImage(documentCtx.canvas, 0, 0);
			fill(opCtx, x, y, swatch);
		}
	}
};

const toolsArray = Object.keys(tools).map((key)=> {
	const tool = tools[key];
	return {name: key, ...tool}
})

export default toolsArray;
