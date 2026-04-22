// This only needs to handle the side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// The message forwarding logic was removed because sidepanel.js 
// listens to the content script directly!