// Get snippet from storage
chrome.storage.local.get(["ai_code_snippet"], async (result) => {
  const snippet = result.ai_code_snippet || "";
  const outputEl = document.getElementById("animatedOutput");

  if (!snippet) {
    outputEl.textContent = "⚠️ No code snippet found!";
    return;
  }

  outputEl.textContent = "🤖 Fetching explanation...\n";

  try {
    const res = await fetch("http://localhost:5000/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codeSnippet: snippet }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const explanation = data.explanation || "⚠️ No explanation returned.";

    // Animate text character by character
    let i = 0;
    const speed = 20; // ms per character
    const interval = setInterval(() => {
      outputEl.textContent += explanation.charAt(i);
      i++;
      outputEl.scrollTop = outputEl.scrollHeight;
      if (i >= explanation.length) clearInterval(interval);
    }, speed);
  } catch (err) {
    outputEl.textContent = "❌ Error: " + err.message;
  }
});
