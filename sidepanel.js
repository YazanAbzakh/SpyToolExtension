chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ELEMENT_SPYED") {
    const data = message.data;
    const engine = document.getElementById('engine').value;
    const selectorType = document.getElementById('selectorType').value;
    const output = document.getElementById('output');

    let val = data[selectorType] || data.tagName;
    let snippet = "";

    if (engine === "selenium") {
      snippet = `driver.findElement(By.${selectorType}("${val}")).click();\n`;
    } else {
      snippet = `await page.locator('${selectorType === 'id' ? '#' : ''}${val}').click();\n`;
    }

    output.value += snippet;
  }
});

document.getElementById('clear').onclick = () => {
  document.getElementById('output').value = "";
};