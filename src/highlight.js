import { Dialog } from "quasar";
import store from './store'


window.destroyHighlight = function(guid) {

  Dialog.create({
    title: "Delete highlight?",
    ok: {
      push:true,
      label:"Yes",
    },
    cancel: true
  })
  .then((v)=>{
    store.commit("destroyHighlight", { guid: guid });
  });


};

class HighlightManager {
  constructor(store) {
    this.$store = store;
    window.store = store;
  }

  get window() {
    return defaultWindow();
  }
  get document() {
    return this.window.document;
  }
  get selection() {
    return this.window.getSelection();
  }

  highlightRange(col, range, guid) {
    let colour;
    if (col) {
      colour = col;
    } else {
      colour = this.$store.getters.highlightColor;
    }
    let sel = this.selection,
      doc = this.document;
    sel.removeAllRanges();
    sel.addRange(range);
    let location = this.getLocation();
    if (!guid) guid = createGuid();
    doc.designMode = "on";
    doc.execCommand("HiliteColor", false, colour);
    if (colour !== "transparent") {
      doc.execCommand(
        "createLink",
        false,
        `javascript:window.top.destroyHighlight("${guid}")`
      );
    } else {
      doc.execCommand("unlink", false);
    }

    doc.designMode = "off";
    location.endLocation = this.getLocation();
    location.guid = guid;
    return location;
  }
  highlight(colour) {
    let sel = this.selection;
    let col;
    if (colour) {
      col = colour;
    } else {
      col = this.$store.getters.highlightColor;
    }
    if (!sel.baseNode) return;
    if (sel.baseNode.parentElement.style.backgroundColor === colour) {
      col = "transparent";
    }
    let range = sel.getRangeAt(0);
    return this.highlightRange(col, range);
  }
  getLocation() {
    let win = this.window,
      sel = win.getSelection(),
      rng = sel.getRangeAt(0);
    let start = getNodeLocation(rng.startContainer);
    let end = getNodeLocation(rng.endContainer);
    start.offset = rng.startOffset;
    if (rng.startContainer === rng.endContainer) {
      end.offset = start.offset + rng.toString().length;
    } else {
      end.offset = rng.endOffset;
    }

    let textContent = rng.toString();
    return {
      start,
      end,
      textContent
    };
  }
  createRange(start, end) {
    let startEl = this.findEl(start);
    let endEl = this.findEl(end);
    if (!startEl || !endEl) return;
    window.doc = this.document;
    let startNode = startEl.childNodes[start.index];
    let endNode = endEl.childNodes[end.index];
    let range = document.createRange();
    let startOffset = pickOffset(startNode, start);
    let endOffset = pickOffset(endNode, end);
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  }
  findEl(location) {
    return findElInDocument(location, this.document);
  }
  markHighlights() {
    let highlights = this.$store.getters.highlights;
    let destroyedHighlights = this.$store.getters.destroyedHighlights;
    this.markSelectedHighlights(highlights);
    this.markSelectedHighlights(destroyedHighlights, "transparent");
  }
  markSelectedHighlights(highlights, color) {
    highlights.forEach((highlight) => {
      if (
        highlight.location.chapterName ===
        this.$store.getters.lastLocation.chapterName
      ) {
        let range =
          highlight.range && highlight.range.anchorNode
            ? highlight.range
            : this.createRange(highlight.start, highlight.end);
        if (range) {
          this.highlightRange(color, range, highlight.guid);
          highlight.range = this.selection.getRangeAt(0);

          this.selection.removeAllRanges();
        }
      }
    });
  }
  releaseSelection() {
    this.selection.removeAllRanges();
  }
}

function s4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

function createGuid() {
  return "guid-" + s4() + s4();
}

function pickOffset(node, location) {
  return node.length < location.offset ? node.length - 1 : location.offset;
}

function findElInDocument(location, doc) {
  let elements = doc.querySelectorAll(location.tagName);
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].outerHTML === location.outerHTML) {
      return elements[i];
    }
  }
}

function getNodeIndexInElement(element, node) {
  for (let i = 0; i < element.childNodes.length; i++) {
    if (element.childNodes[i] === node) {
      return i;
    }
  }
}

function getNodeLocation(node) {
  let parentElement = node.parentElement;
  let tagName = parentElement.tagName,
    className = parentElement.className,
    index = getNodeIndexInElement(parentElement, node),
    outerHTML = parentElement.outerHTML;
  return { tagName, className, index, outerHTML };
}

let _defaultWindow;
function defaultWindow() {
  let iframe = document.querySelector("iframe");
  _defaultWindow = iframe ? iframe.contentWindow : window;
  return _defaultWindow;
}

let _highlightManager;
export default function CreateHighlightManager(store) {
  if (_highlightManager) return _highlightManager;
  _highlightManager = new HighlightManager(store);
  window.hh = _highlightManager;
  return _highlightManager;
}
