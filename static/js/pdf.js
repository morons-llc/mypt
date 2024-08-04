// This bundle has the main JS code for the /pdf page.
function enableSelectionAnchors() {
  const scrollContainer = document.getElementById("page-container");

  // Create copy link button
  const button = document.createElement("button");
  button.id = "copy-button";
  button.textContent = "Copy link";
  button.style.display = "none";
  button.style.position = "absolute";
  button.style.zIndex = "100";
  scrollContainer.appendChild(button);

  const hideButton = () => {
    button.style.display = "none";
  };

  /**
   * @param {{ top: number; left: number;}} coordinates
   */
  const moveButtonAbove = (coordinates) => {
    const rect = button.getBoundingClientRect();

    const top = coordinates.top - rect.height * 2;
    const left = coordinates.left;

    button.style.top = `${top}px`;
    button.style.left = `${left}px`;
    button.style.display = "block";
  };

  /**
   * @param {null | Node} node
   * @returns {null | Element} The closest parent with an explicit id="..." parameter
   */
  function findClosestParentElementWithId(node) {
    let current = node;

    while (current) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = /** @type {Element} **/ (current);
        if (element.getAttribute("id")) {
          return element;
        }
      }

      current = current.parentNode;
    }

    return null;
  }

  /**
   * @param {Element} element The element to search under.
   * @returns {Node[]}
   */
  function getAllTextNodesUnderElement(element) {
    const textNodes = []; // Array to hold all text nodes
    const treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

    let currentNode = treeWalker.currentNode;
    while (currentNode) {
      if (currentNode.nodeType == Node.TEXT_NODE) {
        textNodes.push(currentNode); // Add the text content of the current node to the array
      }
      currentNode = treeWalker.nextNode(); // Move to the next node
    }

    return textNodes; // Return the array of text nodes
  }

  /**
   * @param {Element} element The element to get a selection range for
   * @param {string} text The text we want to select a full range over
   * @returns {Range}
   */
  function getSelectionRangeForText(element, text) {
    const range = document.createRange();

    // There can be many text nodes spanning a selection, so we need to get all
    // of them and compute which nodes the selection actually starts and ends
    // from.
    const textNodes = getAllTextNodesUnderElement(element);
    const contents = textNodes.map((node) => node.textContent).join("");

    // Find the start and end index of the text we're looking to highlight, with
    // respect to the contents.
    const contentsStartIndex = contents.indexOf(text);
    const contentsEndIndex = contentsStartIndex + text.length;

    // We want to iterate _each_ text node, but increment the current
    // contentsIndex to keep track of when we reach the text node that contain
    // the start and/or end indexes.
    let contentsIndex = 0;
    for (const currentNode of textNodes) {
      const currentStart = contentsIndex;
      const currentEnd = contentsIndex + currentNode.textContent.length;

      if (
        contentsStartIndex >= currentStart &&
        contentsStartIndex < currentEnd
      ) {
        // Found the start node
        const offset = contentsStartIndex - currentStart;
        range.setStart(currentNode, offset);
      }

      if (contentsEndIndex >= currentStart && contentsEndIndex < currentEnd) {
        // Found the end node
        const offset = contentsEndIndex - currentStart;
        range.setEnd(currentNode, offset);
      }

      contentsIndex = currentEnd;
    }

    return range;
  }

  function jumpToSelectionTarget() {
    const { hash } = window.location;
    if (!hash) {
      return;
    }

    const value = hash.startsWith("#") ? hash.slice(1) : hash;

    if (!value.startsWith("selection--")) {
      return;
    }

    const parts = value.split("--");
    if (parts.length !== 3) {
      return;
    }

    // eslint-disable-next-line no-unused-vars
    const [_, targetElementId, encodedText] = parts;
    const element = document.getElementById(targetElementId);
    const text = decodeURIComponent(encodedText);

    if (!element) {
      return;
    }

    element.scrollIntoView({ block: "center" });

    const range = getSelectionRangeForText(element, text);
    if (range.collapsed) {
      return;
    }

    const selection = window.getSelection(); // Get the current selection object
    selection.removeAllRanges(); // Clear any existing ranges
    selection.addRange(range); // Add our new range
  }

  // On first load, jump to the selection target & select some text.
  jumpToSelectionTarget();

  function getSelectedTextPosition() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return; // No selection

    const range = selection.getRangeAt(0);

    const rect = range.getBoundingClientRect();

    const adjustedTop = rect.top + scrollContainer.scrollTop;
    const adjustedLeft = rect.left + scrollContainer.scrollLeft;

    return { top: adjustedTop, left: adjustedLeft };
  }

  document.addEventListener("selectionchange", () => {
    const selection = document.getSelection();
    if (selection.isCollapsed) {
      hideButton();
      return;
    }

    const selectedText = selection.toString();
    if (selectedText.trim() === "") {
      hideButton();
      return;
    }

    const position = getSelectedTextPosition();
    if (position) {
      moveButtonAbove(position);
    }
  });

  button.addEventListener("click", () => {
    const selection = document.getSelection();
    if (selection.isCollapsed) {
      return;
    }

    const selectedText = selection.toString();
    if (selectedText.trim() === "") {
      return;
    }

    const parent = findClosestParentElementWithId(selection.anchorNode);
    if (!parent) {
      return;
    }

    const id = parent.getAttribute("id");
    const url = new URL(window.location.href);
    url.hash = `#selection--${id}--${encodeURIComponent(selectedText)}`;

    navigator.clipboard.writeText(url.toString()).then(() => {
      const oldText = button.textContent;
      button.textContent = "Copied!";

      setTimeout(() => {
        button.textContent = oldText;
      }, 1500);
    });
  });
}

enableSelectionAnchors();
