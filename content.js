console.log("Thor's Spy Tool: Alt + Click an element to capture it.");

document.addEventListener('click', (e) => {
  if (e.altKey) {
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    const data = {
      id: el.id || "",
      name: el.getAttribute("name") || "",
      tagName: el.tagName.toLowerCase(),
      type: el.type || ""
    };

    chrome.runtime.sendMessage({ type: "ELEMENT_SPYED", data: data });

    // Visual feedback
    const original = el.style.outline;
    el.style.outline = "3px solid #00ff00";
    setTimeout(() => { el.style.outline = original; }, 1000);
  }
}, true);