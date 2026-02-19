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
        <span className="title">DNSBL_CHECKER.BAT</span>
      </div>
      
      <div className="terminal-body">
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Enter IP address..." 
            value={ip}
            onChange={(e) => setIp(e.target.value)}
          />
          <button onClick={handleCheck} disabled={loading}>
            {loading ? '...' : 'SCAN'}
          </button>
        </div>

        <div className="results">
          {results.length > 0 ? (
            results.map((r) => (
              <div key={r.host} className={`line ${r.isBlacklisted ? 'listed' : 'clean'}`}>
                <span className="host">{r.host}</span>
                <span className="status">[{r.status}]</span>
              </div>
            ))
          ) : (
            <div className="idle">Ready for DNSBL lookup...</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .bl-widget {
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 8px;
          overflow: hidden;
          font-family: 'Fira Code', 'Courier New', monospace;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .terminal-header {
          background: #161b22;
          padding: 8px 12px;
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
          padding: 6px 10px; border-radius: 4px; font-size: 12px;
        }
        button {
          background: #238636; color: white; border: none; padding: 6px 12px;
          border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;
        }
        button:hover { background: #2ea043; }
        .results { font-size: 11px; max-height: 200px; overflow-y: auto; }
        .line { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #21262d; }
        .listed { color: #ff7b72; }
        .clean { color: #7ee787; }
        .idle { color: #8b949e; text-align: center; padding: 20px; font-style: italic; }
      `}</style>
    </div>
  );
}