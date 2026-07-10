import React, { useState } from 'react';
import { Play, Save, Settings, Code, FileJson } from 'lucide-react';

export default function PromptLab() {
  const [systemPrompt, setSystemPrompt] = useState('You are an expert React developer. Write concise, idiomatic code.');
  const [userPrompt, setUserPrompt] = useState('Create a button component with a loading state.');
  const [temperature, setTemperature] = useState(0.7);
  const [jsonMode, setJsonMode] = useState(false);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleTest = () => {
    setIsRunning(true);
    // Mock the backend API call
    setTimeout(() => {
      setOutput(jsonMode ? 
        '{\n  "component": "Button",\n  "status": "success",\n  "code": "..."\n}' : 
        'Here is your button component:\n\n```jsx\nexport function LoadingButton() { ... }\n```');
      setIsRunning(false);
    }, 1500);
  };

  return (
    <div className="prompt-lab-container">
      {/* Left Panel: Configuration */}
      <div className="config-panel">
        <div className="panel-header">
          <Settings size={18} className="header-icon" />
          <h2>Configuration</h2>
        </div>

        <div className="config-section">
          <label>System Prompt</label>
          <textarea 
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            className="code-textarea"
            placeholder="Enter system instructions..."
          />
        </div>

        <div className="config-section">
          <label>User Prompt Template</label>
          <textarea 
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={4}
            className="code-textarea"
            placeholder="Enter the user prompt..."
          />
        </div>

        <div className="config-section">
          <label className="split-label">
            <span>Temperature: {temperature}</span>
          </label>
          <input 
            type="range" 
            min="0" max="2" step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="slider"
          />
        </div>

        <div className="config-section toggle-section">
          <div className="toggle-label">
            <FileJson size={16} />
            <span>JSON Mode</span>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={jsonMode}
              onChange={(e) => setJsonMode(e.target.checked)}
            />
            <span className="slider-toggle round"></span>
          </label>
        </div>

        <div className="panel-actions">
          <button className="btn-secondary">
            <Save size={16} /> Save Preset
          </button>
          <button className="btn-primary" onClick={handleTest} disabled={isRunning}>
            <Play size={16} fill={isRunning ? "none" : "currentColor"} /> 
            {isRunning ? 'Running...' : 'Test Prompt'}
          </button>
        </div>
      </div>

      {/* Right Panel: Output */}
      <div className="output-panel">
        <div className="panel-header">
          <Code size={18} className="header-icon" />
          <h2>Test Output</h2>
        </div>
        
        <div className="output-content">
          {output ? (
            <pre className="output-pre">
              <code>{output}</code>
            </pre>
          ) : (
            <div className="empty-state">
              <span className="empty-text">Click "Test Prompt" to see the results.</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .prompt-lab-container {
          display: flex;
          height: 100%;
          width: 100%;
          background-color: var(--color-background-surface, #1e1e1e);
        }
        
        /* Layout Panels */
        .config-panel {
          width: 400px;
          min-width: 320px;
          border-right: 1px solid var(--color-border, #333);
          display: flex;
          flex-direction: column;
          padding: 24px;
          overflow-y: auto;
          background-color: var(--color-background-surface, #1e1e1e);
        }
        
        .output-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 24px;
          background-color: var(--color-background-surface, #181818);
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          color: var(--color-text-primary, #fff);
        }
        .panel-header h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }
        .header-icon {
          color: #a3a6aa;
        }

        /* Config Sections */
        .config-section {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .config-section label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text-secondary, #aaa);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .code-textarea {
          background-color: var(--color-background-surface, #262626);
          border: 1px solid var(--color-border, #333);
          border-radius: 8px;
          padding: 12px;
          color: var(--color-text-primary, #fff);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.9rem;
          resize: vertical;
          line-height: 1.5;
          transition: border-color 0.2s;
        }
        .code-textarea:focus {
          outline: none;
          border-color: #627267;
        }

        /* Toggles & Sliders */
        .split-label {
          display: flex;
          justify-content: space-between;
        }
        .slider {
          width: 100%;
          accent-color: #5c7365;
        }
        .toggle-section {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background-color: var(--color-background-surface, #262626);
          border-radius: 8px;
          border: 1px solid var(--color-border, #333);
        }
        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-primary, #fff);
          font-weight: 500;
          font-size: 0.95rem;
        }

        /* Switch styling */
        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider-toggle {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #333;
          transition: .3s;
        }
        .slider-toggle:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
        }
        input:checked + .slider-toggle {
          background-color: #5c7365;
        }
        input:checked + .slider-toggle:before {
          transform: translateX(20px);
        }
        .slider-toggle.round {
          border-radius: 24px;
        }
        .slider-toggle.round:before {
          border-radius: 50%;
        }

        /* Buttons */
        .panel-actions {
          display: flex;
          gap: 12px;
          margin-top: auto;
          padding-top: 24px;
        }
        .panel-actions button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background-color: #4a5c51;
          color: #fff;
          border: 1px solid #4a5c51;
        }
        .btn-primary:hover:not(:disabled) {
          background-color: #5c7365;
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-secondary {
          background-color: transparent;
          color: var(--color-text-primary, #fff);
          border: 1px solid var(--color-border, #444);
        }
        .btn-secondary:hover {
          background-color: rgba(255,255,255,0.05);
        }

        /* Output Area */
        .output-content {
          flex: 1;
          background-color: var(--color-background-surface, #262626);
          border: 1px solid var(--color-border, #333);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .output-pre {
          margin: 0;
          padding: 24px;
          overflow: auto;
          color: #d1d5db;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.95rem;
          line-height: 1.6;
          height: 100%;
        }
        .empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .empty-text {
          color: var(--color-text-secondary, #666);
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}
