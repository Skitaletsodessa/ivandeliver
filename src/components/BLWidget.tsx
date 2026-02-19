import React, { useState } from 'react';

export default function BLWidget() {
  const [ip, setIp] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!ip) return;
    setLoading(true);
    try {
      const res = await fetch('/api/check-bl', {
        method: 'POST',
        body: JSON.stringify({ target: ip })
      });
      const data = await res.json();
      setResults(data.results);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="bl-widget">
      <div className="terminal-header">
        <span className="dot red"></span>
        <span className="dot yellow"></span>
        <span className="dot green"></span>
        <span className="title">MTA_DIAGNOSTICS.SH</span>
      </div>
      
      <div className="terminal-body">
        <div className="input-group">
          <input 
            type="text" 
            placeholder="IP or Domain..." 
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
          <button onClick={handleCheck} disabled={loading}>
            {loading ? '...' : 'SCAN'}
          </button>
        </div>

        <div className="results">
          {results.length > 0 ? (
            results.map((r) => (
              <div key={r.host} className={`line ${r.severity}`}>
                <span className="host">{r.host}</span>
                <span className="status">
                  {r.severity === 'danger' && '🛑 '}
                  {r.severity === 'warning' && '⚠️ '}
                  {r.severity === 'safe' && '✅ '}
                  {r.status}
                </span>
              </div>
            ))
          ) : (
            <div className="idle">Waiting for input...</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .bl-widget {
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 12px;
          overflow: hidden;
          font-family: 'Fira Code', monospace;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .terminal-header {
          background: #161b22;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-bottom: 1px solid #30363d;
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .red { background: #ff5f56; } .yellow { background: #ffbd2e; } .green { background: #27c93f; }
        .title { color: #8b949e; font-size: 10px; margin-left: auto; letter-spacing: 1px; }
        
        .terminal-body { padding: 15px; }
        .input-group { display: flex; gap: 8px; margin-bottom: 15px; }
        
        input { 
          flex: 1; background: #010409; border: 1px solid #30363d; color: #58a6ff;
          padding: 8px 12px; border-radius: 6px; font-size: 13px; outline: none;
        }
        input:focus { border-color: #3b82f6; }
        
        button {
          background: #238636; color: white; border: none; padding: 0 15px;
          border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;
          transition: background 0.2s;
        }
        button:hover { background: #2ea043; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }

        .results { 
          font-size: 11px; 
          max-height: 250px; 
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #30363d #0d1117;
        }
        .line { 
          display: flex; 
          justify-content: space-between; 
          padding: 6px 4px; 
          border-bottom: 1px solid #21262d; 
        }
        .host { color: #8b949e; }
        
        /* Цвета статусов */
        .danger .status { color: #ff7b72; font-weight: bold; }
        .warning .status { color: #f2cc60; }
        .safe .status { color: #7ee787; }
        
        .idle { color: #484f58; text-align: center; padding: 30px; font-style: italic; font-size: 12px; }
      `}</style>
    </div>
  );
}