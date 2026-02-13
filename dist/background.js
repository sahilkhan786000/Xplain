chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "openOverlay" && msg.codeSnippet) {
    chrome.storage.local.set({ ai_code_snippet: msg.codeSnippet }, () => {
      chrome.windows.getCurrent({}, (currentWindow) => {
        const width = 600;
        const height = 400;
        const left = currentWindow.left + (currentWindow.width - width) / 2;
        const top = currentWindow.top + (currentWindow.height - height) / 2;

        chrome.windows.create({
          url: chrome.runtime.getURL("overlay.html"),
          type: "popup",
          width,
          height,
          left: Math.round(left),
          top: Math.round(top)
        });
      });
    });
    sendResponse({ status: "ok" });
  }
  return true;
});
