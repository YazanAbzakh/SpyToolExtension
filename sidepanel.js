/**
 * Thor's Automation Spy - Pro Edition
 * UNIVERSAL MODEL DISCOVERY + AUTO-RETRY LOGIC
 * This version handles "High Demand" errors by automatically retrying.
 */

let lastData = null;
let discoveredModel = null; 

// --- 1. Settings & Key Management ---

document.getElementById('settingsToggle').onclick = () => {
    const area = document.getElementById('settingsArea');
    area.style.display = (area.style.display === 'block') ? 'none' : 'block';
};

document.getElementById('saveKeyBtn').onclick = () => {
    const keyInput = document.getElementById('apiKeyInput');
    const key = keyInput.value.trim();
    if (key) {
        chrome.storage.local.set({ gemini_api_key: key }, () => {
            alert("API Key saved! Discovery will begin on next spy.");
            discoveredModel = null; 
            keyInput.value = "";
            document.getElementById('settingsArea').style.display = 'none';
        });
    }
};

// --- 2. Message Listener ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "ELEMENT_SPYED") {
        lastData = msg.data;
        renderAIView().then(() => {
            sendResponse({ status: "success" });
        }).catch(err => {
            console.error("Communication Failure:", err);
            sendResponse({ status: "error", error: err.message });
        });
        return true; 
    }
});

// --- 3. Model Discovery & AI Logic ---

async function getWorkingModel(apiKey) {
    if (discoveredModel) return discoveredModel;

    console.log("Discovering available models...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.error) throw new Error(`Discovery Failed: ${data.error.message}`);

    const bestModel = data.models.find(m => 
        m.supportedGenerationMethods.includes("generateContent") && 
        (m.name.includes("gemini-1.5-flash") || m.name.includes("gemini-1.5-pro"))
    ) || data.models.find(m => m.supportedGenerationMethods.includes("generateContent"));

    if (!bestModel) throw new Error("No compatible Gemini models found.");

    discoveredModel = bestModel.name;
    return discoveredModel;
}

async function renderAIView() {
    const zone = document.getElementById('suggestionZone');
    const actList = document.getElementById('actionButtons');
    const status = document.getElementById('spyStatus');
    const engine = document.getElementById('engine').value;

    zone.style.display = 'block';
    actList.innerHTML = '';
    status.innerText = "Connecting to Google AI...";

    const storage = await chrome.storage.local.get(['gemini_api_key']);
    const apiKey = storage.gemini_api_key;

    if (!apiKey) {
        status.innerHTML = `<div style="color:#f44747; padding:10px;">Error: No API Key. Go to Settings.</div>`;
        return;
    }

    try {
        const modelPath = await getWorkingModel(apiKey);
        const prompt = `You are a Test Automation Architect. 
        Tool: ${engine}
        Element: ${JSON.stringify(lastData)}
        Return ONLY a JSON array of 5 testing actions with "label" and "code" keys.`;

        let attempts = 0;
        const maxAttempts = 3;
        let success = false;

        while (attempts < maxAttempts && !success) {
            attempts++;
            status.innerText = attempts > 1 ? `High demand. Retry #${attempts-1}...` : `Analyzing with AI...`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const result = await response.json();

            if (result.error) {
                // Check if it's a "High Demand" / 503 / 429 error
                if (result.error.message.includes("high demand") || result.error.code === 429 || result.error.code === 503) {
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                        continue;
                    }
                }
                throw new Error(result.error.message);
            }

            if (result.candidates && result.candidates.length > 0) {
                let rawText = result.candidates[0].content.parts[0].text;
                rawText = rawText.replace(/```json|```/g, "").trim();
                const suggestions = JSON.parse(rawText);

                status.innerText = `Actions for <${lastData.tagName}>:`;
                suggestions.forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = 'action-btn';
                    btn.innerText = `✨ ${item.label}`;
                    btn.onclick = () => {
                        const output = document.getElementById('testOutput');
                        output.value += `${item.code}\n`;
                        output.scrollTop = output.scrollHeight;
                        zone.style.display = 'none'; 
                    };
                    actList.appendChild(btn);
                });
                success = true;
            }
        }
    } catch (err) {
        console.error("Final Logic Failure:", err);
        status.innerHTML = `<div style="color:#f44747; border:1px solid #f44747; padding:10px;">AI ERROR: ${err.message}</div>`;
    }
}

// --- 4. Utilities ---

document.getElementById('clearBtn').onclick = () => {
    document.getElementById('testOutput').value = "";
};