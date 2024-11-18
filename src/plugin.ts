import { Board } from "@penpot/plugin-types";
import type { PluginMessageEvent } from "./model";

let lastSelectedFrame = null;

penpot.ui.open("Vector Fields Generator", `?theme=${penpot.theme}`, {
  width: 880,
  height: 660,
});

penpot.on("themechange", (theme) => {
  sendMessage({ type: "theme", content: theme });
});

function sendMessage(message: PluginMessageEvent) {
  penpot.ui.sendMessage(message);
}

penpot.ui.onMessage((data: any) => {
  if (data.pluginMessage.type === "create-svg") {
    const svg = penpot.createShapeFromSvg(data.pluginMessage.svg);

    const board = penpot.createBoard();
    board.addFlexLayout();
    board.verticalSizing = "auto";
    board.horizontalSizing = "auto";
    board.fills = [{ fillColor: data.pluginMessage.backgroundColor }];

    if (svg) {
      board.appendChild(svg);
    }

    if (
      penpot.selection.length > 0 &&
      penpot.selection[0].type === "board" &&
      svg
    ) {
      const selected = penpot.selection[0];

      board.resize(selected.width, selected.height);
      selected.appendChild(board);
      board.boardX = 0;
      board.boardY = 0;
    }
  }
});

function updateSelectedFrame() {
  const selection = penpot.selection;
  if (selection.length === 1 && selection[0]?.type === "board") {
    lastSelectedFrame = selection[0];
    sendFrameInfo(lastSelectedFrame);
  } else {
    lastSelectedFrame = null;
    penpot.ui.sendMessage({ type: "no-frame-selected" });
  }
}

updateSelectedFrame();

function sendFrameInfo(board: Board) {
  let backgroundColor = null;

  if (board.fills && board.fills.length > 0 && board.fills[0].fillColor) {
    const color = board.fills[0].fillColor;
    backgroundColor = color;
  }

  penpot.ui.sendMessage({
    type: "board-selected",
    width: board.width,
    height: board.height,
    backgroundColor: backgroundColor,
  });
}

penpot.on("selectionchange", () => {
  updateSelectedFrame();
});
