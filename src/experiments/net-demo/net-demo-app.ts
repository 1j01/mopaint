import { HistoryStore, MopaintWebSocketClient } from "../networking.js";
import { DocView } from "./doc-view.js";

const store = new HistoryStore();
new MopaintWebSocketClient(store, `${location.protocol.match(/s:$/) ? "wss://" : "ws://"}${location.host}`);

const root = document.getElementById("root")!;

const docViewA = new DocView(store);
root.appendChild(docViewA.svg);

const docViewB = new DocView(store);
root.appendChild(docViewB.svg);
