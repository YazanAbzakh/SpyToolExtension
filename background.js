chrome.runtime.onInstalled.addListener(() => {
  console.log("Thor's Pro Automation Spy Initialized.");
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error("Side Panel Setup Error:", error));
});