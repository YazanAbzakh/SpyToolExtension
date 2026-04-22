console.log("Thor's Pro Spy Tool Active.");

function getElementXPath(element) {
    if (element.id && element.id !== '') return `//*[@id="${element.id}"]`;
    if (element === document.body) return '/html/body';
    let ix = 0;
    let siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
        let sibling = siblings[i];
        if (sibling === element) return getElementXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
    }
}

document.addEventListener('click', (e) => {
    if (e.altKey) {
        e.preventDefault();
        e.stopPropagation();

        const el = e.target;
        const data = {
            tagName: el.tagName.toLowerCase(),
            id: el.id || null,
            name: el.getAttribute("name") || null,
            className: el.className || null,
            xpath: getElementXPath(el),
            css: `${el.tagName.toLowerCase()}${el.className ? '.' + el.className.replace(/\s+/g, '.') : ''}`
        };

        if (chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage({ type: "ELEMENT_SPYED", data: data }, (response) => {
                if (chrome.runtime.lastError) {
                    console.debug("Spy Tool: Sidepanel is not listening.");
                }
            });
        } else {
            console.error("Spy Tool: Connection lost. Please refresh the page.");
        }

        const original = el.style.outline;
        el.style.outline = "3px dashed #ff9900";
        setTimeout(() => { el.style.outline = original; }, 1000);
    }
}, true);