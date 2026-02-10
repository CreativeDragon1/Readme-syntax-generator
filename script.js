let savedRange = null;
const editor = document.getElementById("editor");

editor.addEventListener("mouseup", saveSelection);
editor.addEventListener("keyup", saveSelection);

function saveSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    savedRange = selection.getRangeAt(0).cloneRange();
  }
}

function restoreSelection() {
  if (!savedRange) return false;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(savedRange);
  return true;
}

function getClosest(node, tag) {
  while (node && node !== editor) {
    if (node.nodeType === 1 && node.tagName === tag.toUpperCase()) {
      return node;
    }
    node = node.parentNode;
  }
  return null;
}

function toggleFormat(tag, attributes = {}) {
  restoreSelection();
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);

  // Look for the tag starting from the container of the selection
  const existing = getClosest(range.startContainer, tag);

  if (existing) {
    unwrap(existing);
  } else {
    if (range.collapsed) {
      // Toggle and Type logic
      const el = document.createElement(tag);
      for (const [key, value] of Object.entries(attributes)) {
        el.setAttribute(key, value);
      }
      el.appendChild(document.createTextNode("\u200B")); // Invisible character
      range.insertNode(el);
      
      // Move cursor inside
      range.setStart(el.firstChild, 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      wrap(tag, attributes);
    }
  }
  saveSelection();
}

function wrap(tag, attributes = {}) {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    el.setAttribute(key, value);
  }

  try {
    el.appendChild(range.extractContents());
    range.insertNode(el);
    
    // Select the content again so the user sees it's wrapped
    const newRange = document.createRange();
    newRange.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(newRange);
    savedRange = newRange;
  } catch (e) {
    console.error("Wrapping failed:", e);
  }
}

function unwrap(element) {
  const selection = window.getSelection();
  const range = document.createRange();
  const parent = element.parentNode;
  
  // Move all children out of the element
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  
  // Set the cursor where the element used to be
  range.setStartBefore(element);
  parent.removeChild(element);
  range.collapse(true);
  
  selection.removeAllRanges();
  selection.addRange(range);
  savedRange = range;
}

// --- Specific Features ---

function makeList() {
    // Basic MD lists in HTML usually look like <ul><li>...</li></ul>
    // If not already in a list, wrap the selection in UL > LI
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const inList = getClosest(range.startContainer, "li");

    if (inList) {
        // If in a list, unwrap the LI and potentially the UL
        const ul = inList.parentNode;
        unwrap(inList);
        if (ul && ul.tagName === 'UL' && !ul.innerText.trim()) {
            ul.remove();
        }
    } else {
        const ul = document.createElement('ul');
        const li = document.createElement('li');
        
        if (range.collapsed) {
            li.appendChild(document.createTextNode("\u200B"));
            ul.appendChild(li);
            range.insertNode(ul);
            range.setStart(li.firstChild, 1);
        } else {
            li.appendChild(range.extractContents());
            ul.appendChild(li);
            range.insertNode(ul);
        }
        
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function makeLink() {
  const url = prompt("Enter URL:", "https://");
  if (!url) return;
  toggleFormat("a", { href: url });
}

function generateMarkdown() {
  // Use a clone so we don't mess up the editor's live HTML
  const temp = document.createElement("div");
  temp.innerHTML = editor.innerHTML;

  let md = temp.innerHTML;

  const rules = [
    { reg: /<strong>(.*?)<\/strong>|<b>(.*?)<\/b>/gi, rep: "**$1$2**" },
    { reg: /<em>(.*?)<\/em>|<i>(.*?)<\/i>/gi, rep: "_$1$2_" },
    { reg: /<h1>(.*?)<\/h1>/gi, rep: "# $1\n" },
    { reg: /<ul>(.*?)<\/ul>/gi, rep: "$1" },
    { reg: /<li>(.*?)<\/li>/gi, rep: "- $1\n" },
    // Improved Link Regex: handles attributes better
    { reg: /<a.*?href="(.*?)".*?>(.*?)<\/a>/gi, rep: "[$2]($1)" },
    { reg: /<br>/gi, rep: "\n" },
    { reg: /<div>(.*?)<\/div>/gi, rep: "\n$1" },
    { reg: /\u200B/g, rep: "" } 
  ];

  rules.forEach(rule => {
    md = md.replace(rule.reg, rule.rep);
  });

  // Clean up HTML tags that didn't match rules
  const finalCleaner = document.createElement("div");
  finalCleaner.innerHTML = md;
  document.getElementById("output").value = finalCleaner.textContent.trim();
}

// Initialization
document.getElementById("copy").onclick = () => {
    const output = document.getElementById("output");
    output.select();
    navigator.clipboard.writeText(output.value);
};