let lastSpyedData = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ELEMENT_SPYED") {
    lastSpyedData = message.data;
    showSuggestions(lastSpyedData);
  }
});

function showSuggestions(data) {
  const zone = document.getElementById('suggestionZone');
  const btnContainer = document.getElementById('actionButtons');
  const tagDisplay = document.getElementById('detectedTag');

  // 1. Show the zone and the tag name
  zone.style.display = 'block';
  tagDisplay.innerText = `<${data.tagName}>`;
  btnContainer.innerHTML = ''; // Clear old buttons

  // 2. Define actions based on type
  let actions = ["isPresent", "isVisible"]; // Default actions for everything
  
  if (data.tagName === "input" || data.tagName === "textarea") {
    actions.unshift("sendKeys", "click", "clear");
  } else if (data.tagName === "button" || data.tagName === "a") {
    actions.unshift("click");
  } else {
    actions.unshift("click");
  }

  // 3. Create buttons for each action
  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.innerText = `Want to ${action}?`;
    btn.onclick = () => generateCode(action);
    btnContainer.appendChild(btn);
  });
}

function generateCode(action) {
  const engine = document.getElementById('engine').value;
  const selectorType = document.getElementById('selectorType').value;
  const output = document.getElementById('testOutput');

  const selectorValue = lastSpyedData[selectorType] || lastSpyedData.tagName;
  let code = "";

  if (engine === "selenium_java") {
    const by = `By.${selectorType}("${selectorValue}")`;
    if (action === "sendKeys") code = `driver.findElement(${by}).sendKeys("Text");\n`;
    else if (action === "click") code = `driver.findElement(${by}).click();\n`;
    else if (action === "isPresent") code = `driver.findElements(${by}).size() > 0;\n`;
    else code = `driver.findElement(${by}).${action}();\n`;
  } 
  
  else if (engine === "playwright_js") {
    const sel = selectorType === 'id' ? `#${selectorValue}` : selectorValue;
    if (action === "sendKeys") code = `await page.locator('${sel}').fill('Text');\n`;
    else if (action === "click") code = `await page.locator('${sel}').click();\n`;
    else code = `await expect(page.locator('${sel}')).toBeVisible();\n`;
  }

  output.value += code;
  // Hide suggestions after choice
  document.getElementById('suggestionZone').style.display = 'none';
}

document.getElementById('clearBtn').onclick = () => {
  document.getElementById('testOutput').value = "";
};