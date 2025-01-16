
interface Point {
	x: number;
	y: number;
}

interface Operation {
	name: string;
	timestamp: string;
	apply: () => void;
}

const historyList = document.getElementById('historyList')!;
const drawingCanvas = document.getElementById('drawingCanvas') as HTMLCanvasElement;
const selectionCanvas = document.getElementById('selectionCanvas') as HTMLCanvasElement;
const ctx = drawingCanvas.getContext('2d')!;
const selectionCtx = selectionCanvas.getContext('2d')!;

let isDrawing = false;
let currentTool = 'pencil';
let selectionStart: Point | null = null;
let selectionEnd: Point | null = null;

// History management
let historyOperations: Operation[] = [];
let currentEditIndex = -1;
let currentViewIndex = -1;

function addOperation(name: string, applyFunction: () => void) {
	historyOperations = historyOperations.slice(0, currentEditIndex + 1);

	const operation: Operation = {
		name: name,
		timestamp: new Date().toLocaleTimeString(),
		apply: applyFunction
	};

	historyOperations.push(operation);
	currentEditIndex = historyOperations.length - 1;
	currentViewIndex = currentEditIndex;
	updateHistoryList();
	updateCanvas();
}

function updateHistoryList() {
	historyList.innerHTML = '';

	historyOperations.forEach((operation, index) => {
		const item = document.createElement('div');
		item.className = `history-item ${index === currentEditIndex ? 'active-edit' : ''} ${index === currentViewIndex ? 'active-view' : ''}`;

		const editButton = document.createElement('button');
		editButton.className = 'edit-button';
		editButton.innerHTML = '✏️';
		editButton.onclick = (e) => {
			e.stopPropagation();
			setEditPoint(index);
		};

		const textSpan = document.createElement('span');
		textSpan.className = 'history-text';
		textSpan.textContent = `${operation.name} (${operation.timestamp})`;

		item.appendChild(editButton);
		item.appendChild(textSpan);
		item.onclick = () => setBothPoints(index);
		historyList.appendChild(item);
	});
}

function setEditPoint(index: number) {
	if (index < 0 || index >= historyOperations.length) return;
	currentEditIndex = index;
	updateHistoryList();
}

function setBothPoints(index: number) {
	if (index < 0 || index >= historyOperations.length) return;
	currentEditIndex = index;
	currentViewIndex = index;
	updateHistoryList();
	updateCanvas();
}

function updateCanvas() {
	for (let i = 0; i <= currentViewIndex; i++) {
		historyOperations[i]!.apply();
	}
}

function undo() {
	if (currentViewIndex > 0) {
		currentViewIndex--;
		currentEditIndex = currentViewIndex;
		updateHistoryList();
		updateCanvas();
	}
}

function redo() {
	if (currentViewIndex < historyOperations.length - 1) {
		currentViewIndex++;
		currentEditIndex = currentViewIndex;
		updateHistoryList();
		updateCanvas();
	}
}

function resizeCanvas() {
	drawingCanvas.width = window.innerWidth;
	drawingCanvas.height = window.innerHeight;
	selectionCanvas.width = drawingCanvas.width;
	selectionCanvas.height = drawingCanvas.height;
	updateCanvas();
}

// Toolbar
document.querySelectorAll('.tool').forEach(button => {
	button.addEventListener('click', () => {
		if (button.id === 'pencil' || button.id === 'select') {
			document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
			button.classList.add('active');
			currentTool = button.id;
			if (currentTool === 'pencil') {
				clearSelection();
			}
		} else if (button.id === 'delete') {
			deleteSelection();
		} else if (button.id === 'invert') {
			invertSelection();
		} else if (button.id === 'undo') {
			undo();
		} else if (button.id === 'redo') {
			redo();
		}
	});
});

function startDrawing(event: MouseEvent) {
	isDrawing = true;
	const rect = drawingCanvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;

	if (currentTool === 'pencil') {
		const path: Point[] = [{ x, y }];

		const renderPath = () => {
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 2;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(path[0]!.x, path[0]!.y);
			for (let i = 1; i < path.length; i++) {
				ctx.lineTo(path[i]!.x, path[i]!.y);
			}
			ctx.stroke();
		};

		const moveHandler = (event: MouseEvent) => {
			if (!isDrawing) return; // what is this for?
			const rect = drawingCanvas.getBoundingClientRect();
			const newX = event.clientX - rect.left;
			const newY = event.clientY - rect.top;
			path.push({ x: newX, y: newY });
			if (path.length === 2) {
				addOperation('Draw', renderPath);
			} else {
				updateCanvas();
			}
		};

		const stopHandler = () => {
			drawingCanvas.removeEventListener('mousemove', moveHandler);
			document.removeEventListener('mouseup', stopHandler);
			isDrawing = false;
		};

		drawingCanvas.addEventListener('mousemove', moveHandler);
		document.addEventListener('mouseup', stopHandler);
	} else if (currentTool === 'select') {
		selectionStart = { x, y };
		const moveHandler = (event: MouseEvent) => {
			if (!isDrawing) return;
			const rect = drawingCanvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			selectionEnd = { x, y };
			drawSelectionPreview();
		};

		const stopHandler = () => {
			drawingCanvas.removeEventListener('mousemove', moveHandler);
			document.removeEventListener('mouseup', stopHandler);
		};

		drawingCanvas.addEventListener('mousemove', moveHandler);
		document.addEventListener('mouseup', stopHandler);
	}
}

function drawSelectionPreview() {
	selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
	if (!selectionStart || !selectionEnd) return;

	const x = Math.min(selectionStart.x, selectionEnd.x);
	const y = Math.min(selectionStart.y, selectionEnd.y);
	const width = Math.abs(selectionEnd.x - selectionStart.x);
	const height = Math.abs(selectionEnd.y - selectionStart.y);

	selectionCtx.strokeStyle = 'blue';
	selectionCtx.setLineDash([5, 5]);
	selectionCtx.strokeRect(x, y, width, height);
	selectionCtx.setLineDash([]);
}

function clearSelection() {
	selectionStart = null;
	selectionEnd = null;
	selectionCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
}

function getSelectionBounds() {
	if (!selectionStart || !selectionEnd) return null;
	return {
		x: Math.min(selectionStart.x, selectionEnd.x),
		y: Math.min(selectionStart.y, selectionEnd.y),
		width: Math.abs(selectionEnd.x - selectionStart.x),
		height: Math.abs(selectionEnd.y - selectionStart.y)
	};
}

function deleteSelection() {
	const bounds = getSelectionBounds();
	if (!bounds) return;
	clearSelection();
	addOperation('Delete selection', () => ctx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height));
}

function invertSelection() {
	const bounds = getSelectionBounds();
	if (!bounds) return;
	clearSelection();
	addOperation('Invert selection', () => {
		const imageData = ctx.getImageData(bounds.x, bounds.y, bounds.width, bounds.height);
		for (let i = 0; i < imageData.data.length; i += 4) {
			imageData.data[i] = 255 - imageData.data[i]!;
			imageData.data[i + 1] = 255 - imageData.data[i + 1]!;
			imageData.data[i + 2] = 255 - imageData.data[i + 2]!;
		}
		ctx.putImageData(imageData, bounds.x, bounds.y);
	});
}

document.addEventListener('keydown', (e) => {
	if (e.ctrlKey || e.metaKey) {
		if (e.key === 'z') {
			e.preventDefault();
			if (e.shiftKey) {
				redo();
			} else {
				undo();
			}
		} else if (e.key === 'y') {
			e.preventDefault();
			redo();
		}
	}
});

drawingCanvas.addEventListener('mousedown', startDrawing);
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

addOperation('New Document', () => {
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
});
