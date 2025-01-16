const drawingCanvas = document.getElementById('drawingCanvas');
const selectionCanvas = document.getElementById('selectionCanvas');
const ctx = drawingCanvas.getContext('2d');
const selectionCtx = selectionCanvas.getContext('2d');
let isDrawing = false;
let currentTool = 'pencil';
let selectionStart = null;
let selectionEnd = null;

// History management
const maxHistoryStates = 50;
let historyStates = [];
let currentEditIndex = -1;
let currentViewIndex = -1;
let isPerformingAction = false;

function saveState(actionName) {
	if (isPerformingAction) return;

	// Remove any states after current edit index
	historyStates = historyStates.slice(0, currentEditIndex + 1);

	// Add new state
	historyStates.push({
		imageData: ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height),
		actionName: actionName,
		timestamp: new Date().toLocaleTimeString()
	});

	// Limit history size
	if (historyStates.length > maxHistoryStates) {
		historyStates.shift();
	}

	currentEditIndex = historyStates.length - 1;
	currentViewIndex = currentEditIndex;
	updateHistoryList();
	updateCanvas();
}

function updateHistoryList() {
	const historyList = document.getElementById('historyList');
	historyList.innerHTML = '';

	historyStates.forEach((state, index) => {
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
		textSpan.textContent = `${state.actionName} (${state.timestamp})`;

		item.appendChild(editButton);
		item.appendChild(textSpan);
		item.onclick = () => setBothPoints(index);
		historyList.appendChild(item);
	});
}

function setEditPoint(index) {
	if (index < 0 || index >= historyStates.length) return;
	currentEditIndex = index;
	updateHistoryList();
}

function setBothPoints(index) {
	if (index < 0 || index >= historyStates.length) return;
	currentEditIndex = index;
	currentViewIndex = index;
	updateHistoryList();
	updateCanvas();
}

function updateCanvas() {
	if (currentViewIndex < 0 || currentViewIndex >= historyStates.length) return;

	isPerformingAction = true;
	ctx.putImageData(historyStates[currentViewIndex].imageData, 0, 0);
	isPerformingAction = false;
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
	if (currentViewIndex < historyStates.length - 1) {
		currentViewIndex++;
		currentEditIndex = currentViewIndex;
		updateHistoryList();
		updateCanvas();
	}
}

// Rest of the code remains the same, just replace any direct canvas updates
// with calls to saveState() which will handle the history management

// Previous functions remain unchanged
function resizeCanvas() {
	drawingCanvas.width = window.innerWidth;
	drawingCanvas.height = window.innerHeight;
	selectionCanvas.width = window.innerWidth;
	selectionCanvas.height = window.innerHeight;
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
	if (historyStates.length === 0) {
		saveState('Initial canvas');
	}
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Tool selection
document.querySelectorAll('.tool').forEach(button => {
	button.addEventListener('click', () => {
		if (button.id === 'pencil' || button.id === 'select') {
			document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
			button.classList.add('active');
			currentTool = button.id;
			if (currentTool === 'pencil') {
				clearSelection();
			}
		} else if (button.id === 'delete' && selectionStart && selectionEnd) {
			deleteSelection();
		} else if (button.id === 'invert' && selectionStart && selectionEnd) {
			invertSelection();
		} else if (button.id === 'undo') {
			undo();
		} else if (button.id === 'redo') {
			redo();
		}
	});
});

// Drawing functions
let currentPath = [];

function startDrawing(e) {
	isDrawing = true;
	const rect = drawingCanvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;

	if (currentTool === 'pencil') {
		currentPath = [{ x, y }];
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 2;
		ctx.lineCap = 'round';
	} else if (currentTool === 'select') {
		selectionStart = { x, y };
		selectionEnd = { x, y };
	}
}

function draw(e) {
	if (!isDrawing) return;
	const rect = drawingCanvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;

	if (currentTool === 'pencil') {
		currentPath.push({ x, y });
		ctx.lineTo(x, y);
		ctx.stroke();
	} else if (currentTool === 'select') {
		selectionEnd = { x, y };
		drawSelectionPreview();
	}
}

function stopDrawing() {
	if (isDrawing && currentTool === 'pencil' && currentPath.length > 1) {
		saveState('Draw');
	}
	isDrawing = false;
	currentPath = [];
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
	return {
		x: Math.min(selectionStart.x, selectionEnd.x),
		y: Math.min(selectionStart.y, selectionEnd.y),
		width: Math.abs(selectionEnd.x - selectionStart.x),
		height: Math.abs(selectionEnd.y - selectionStart.y)
	};
}

function deleteSelection() {
	if (!selectionStart || !selectionEnd) return;
	const bounds = getSelectionBounds();
	ctx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
	clearSelection();
	saveState('Delete selection');
}

function invertSelection() {
	if (!selectionStart || !selectionEnd) return;
	const bounds = getSelectionBounds();
	const imageData = ctx.getImageData(bounds.x, bounds.y, bounds.width, bounds.height);
	for (let i = 0; i < imageData.data.length; i += 4) {
		imageData.data[i] = 255 - imageData.data[i];
		imageData.data[i + 1] = 255 - imageData.data[i + 1];
		imageData.data[i + 2] = 255 - imageData.data[i + 2];
	}
	ctx.putImageData(imageData, bounds.x, bounds.y);
	clearSelection();
	saveState('Invert selection');
}

// Keyboard shortcuts
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

// Event listeners
drawingCanvas.addEventListener('mousedown', startDrawing);
drawingCanvas.addEventListener('mousemove', draw);
drawingCanvas.addEventListener('mouseup', stopDrawing);
drawingCanvas.addEventListener('mouseout', stopDrawing);
