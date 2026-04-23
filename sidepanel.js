/**
 * Thor's Automation Spy - OpenAI Backend Edition
 * Production-minded version:
 * - No Gemini logic
 * - No localhost default
 * - Calls a hosted backend endpoint
 * - Optional backend URL override can be saved for testing
 */

let lastData = null;

/**
 * Replace this with your real hosted backend before publishing.
 * Example:
 * https://your-domain.com
 */
const DEFAULT_BACKEND_BASE_URL = "https://your-production-backend.com";

// --- 1. Settings & Backend URL Management ---

document.getElementById('settingsToggle').onclick = () => {
    const area = document.getElementById('settingsArea');
    area.style.display = (area.style.display === 'block') ? 'none' : 'block';
};

document.getElementById('saveKeyBtn').onclick = async () => {
    const input = document.getElementById('apiKeyInput');
    const backendUrl = input.value.trim();

    if (!backendUrl) {
        await chrome.storage.local.remove('backend_base_url');
        alert("Backend URL override cleared. Using production backend.");
        input.value = "";
        document.getElementById('settingsArea').style.display = 'none';
        return;
    }

    try {
        new URL(backendUrl);
    } catch (error) {
        alert("Please enter a valid backend URL.");
        return;
    }

    chrome.storage.local.set({ backend_base_url: backendUrl }, () => {
        alert("Backend URL override saved.");
        input.value = "";
        document.getElementById('settingsArea').style.display = 'none';
    });
};

// --- 2. Runtime Message Listener ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "ELEMENT_SPYED") {
        lastData = msg.data;

        renderAIView()
            .then(() => {
                sendResponse({ status: "success" });
            })
            .catch((err) => {
                console.error("Communication Failure:", err);
                sendResponse({ status: "error", error: err.message });
            });

        return true;
    }
});

// --- 3. Backend Communication ---

async function getBackendBaseUrl() {
    const storage = await chrome.storage.local.get(['backend_base_url']);
    return storage.backend_base_url || DEFAULT_BACKEND_BASE_URL;
}

async function fetchActionSuggestions(engine, elementData) {
    const backendBaseUrl = await getBackendBaseUrl();
    const response = await fetch(`${backendBaseUrl}/generate-actions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            engine,
            element: elementData
        })
    });

    let result;

    try {
        result = await response.json();
    } catch (error) {
        throw new Error("Backend returned a non-JSON response.");
    }

    if (!response.ok) {
        throw new Error(result.error || `Backend error: ${response.status}`);
    }

    if (!Array.isArray(result)) {
        throw new Error("Backend response must be a JSON array of actions.");
    }

    return result;
}

async function renderAIView() {
    const zone = document.getElementById('suggestionZone');
    const actionList = document.getElementById('actionButtons');
    const status = document.getElementById('spyStatus');
    const engine = document.getElementById('engine').value;

    zone.style.display = 'block';
    actionList.innerHTML = '';
    status.innerText = "Contacting Thor AI backend...";

    if (!lastData) {
        status.innerHTML = `<div style="color:#f44747; padding:10px;">Error: No element data found.</div>`;
        return;
    }

    try {
        const suggestions = await fetchActionSuggestions(engine, lastData);

        if (!suggestions.length) {
            status.innerHTML = `<div style="color:#f44747; padding:10px;">No actions were returned for this element.</div>`;
            return;
        }

        status.innerText = `Actions for <${lastData.tagName}>:`;

        suggestions.forEach((item) => {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.innerText = `✨ ${item.label || 'Suggested Action'}`;

            btn.onclick = () => {
                const output = document.getElementById('testOutput');
                output.value += `${item.code || ''}\n`;
                output.scrollTop = output.scrollHeight;
                zone.style.display = 'none';
            };

            actionList.appendChild(btn);
        });
    } catch (err) {
        console.error("Backend AI Failure:", err);
        status.innerHTML = `<div style="color:#f44747; border:1px solid #f44747; padding:10px;">AI ERROR: ${err.message}</div>`;
    }
}

// --- 4. Utilities ---

document.getElementById('clearBtn').onclick = () => {
    document.getElementById('testOutput').value = "";
};
