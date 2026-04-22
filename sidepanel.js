let lastData = null;
let selectedSelector = { type: 'tagName', value: '' };

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "ELEMENT_SPYED") {
        lastData = msg.data;
        renderSpyView();
    }
});

function renderSpyView() {
    const zone = document.getElementById('suggestionZone');
    const selList = document.getElementById('selectorList');
    const actList = document.getElementById('actionButtons');
    
    zone.style.display = 'block';
    selList.innerHTML = '';
    actList.innerHTML = '';
    document.getElementById('textInputArea').style.display = 'none';

    // Option B: Rank and show selectors
    const types = ['id', 'name', 'className', 'css', 'xpath'];
    types.forEach(type => {
        if (lastData[type]) {
            const chip = document.createElement('div');
            chip.className = 'selector-chip';
            chip.innerText = `${type.toUpperCase()}: ${lastData[type]}`;
            chip.onclick = () => {
                document.querySelectorAll('.selector-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                selectedSelector = { type, value: lastData[type] };
            };
            selList.appendChild(chip);
            // Default to first available
            if (!selectedSelector.value) chip.click();
        }
    });

    // Suggest actions
    const actions = (lastData.tagName === 'input') ? ['sendKeys', 'click', 'isPresent'] : ['click', 'isPresent'];
    actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.innerText = action.toUpperCase();
        btn.onclick = () => {
            if (action === 'sendKeys') {
                document.getElementById('textInputArea').style.display = 'block';
            } else {
                generate(action);
            }
        };
        actList.appendChild(btn);
    });
}

function generate(action, val = "Text") {
    const engine = document.getElementById('engine').value;
    const output = document.getElementById('testOutput');
    let code = "";

    if (engine === "selenium_java") {
        const by = `By.${selectedSelector.type === 'className' ? 'className' : selectedSelector.type}("${selectedSelector.value}")`;
        if (action === 'sendKeys') code = `driver.findElement(${by}).sendKeys("${val}");\n`;
        else if (action === 'click') code = `driver.findElement(${by}).click();\n`;
        else code = `driver.findElement(${by}).isDisplayed();\n`;
    } else {
        const sel = selectedSelector.type === 'id' ? `#${selectedSelector.value}` : selectedSelector.value;
        if (action === 'sendKeys') code = `await page.locator('${sel}').fill('${val}');\n`;
        else code = `await page.locator('${sel}').click();\n`;
    }

    output.value += code;
    document.getElementById('suggestionZone').style.display = 'none';
}

document.getElementById('confirmTextBtn').onclick = () => {
    const val = document.getElementById('customText').value || "Your Text";
    generate('sendKeys', val);
};

document.getElementById('clearBtn').onclick = () => document.getElementById('testOutput').value = "";