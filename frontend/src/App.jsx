import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import ThemeToggle from "./ThemeToggle";

export default function App() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("💡 Paste code and click Explain");
  const [dark, setDark] = useState(false);
  const autoExplainedRef = useRef(false);

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
  }, [dark]);

  // Auto-populate selected text
  useEffect(() => {
    if (!window.chrome || !chrome.tabs || !chrome.scripting) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs?.[0]) return;

      chrome.scripting.executeScript(
        { target: { tabId: tabs[0].id }, func: () => window.getSelection().toString() },
        (results) => {
          const sel = results?.[0]?.result || "";
          if (sel.trim()) {
            setCode(sel);
            if (!autoExplainedRef.current) {
              autoExplainedRef.current = true;
              chrome.runtime.sendMessage({ action: "openOverlay", codeSnippet: sel });
            }
          }
        }
      );
    });
  }, []);

  const explain = () => {
    if (!code.trim()) {
      setOutput("⚠️ Please paste some code first.");
      return;
    }
    chrome.runtime.sendMessage({ action: "openOverlay", codeSnippet: code });
  };

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      alert("Copied explanation to clipboard");
    } catch {
      alert("Copy failed");
    }
  };

  return (
    <div className="container">
      <h1>🤖 AI Code Explainer</h1>
      <p className="subtitle">Paste code below and get an AI explanation</p>

      <textarea
        className="codebox"
        placeholder="// paste code here"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button className="primary" onClick={explain}>
        ✨ Explain Code
      </button>

      <div className="controls">
        <button
          onClick={() => {
            setCode("");
            setOutput("💡 Paste code and click Explain");
          }}
        >
          Clear
        </button>
        <button onClick={copyOutput}>Copy</button>
        <ThemeToggle theme={dark ? "dark" : "light"} toggleTheme={() => setDark(!dark)} />
      </div>

      <div className="outputBox">
        <pre>{output}</pre>
      </div>
    </div>
  );
}
