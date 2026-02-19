import React, { useState } from 'react';

export default function BLChecker() {
  const [ip, setIp] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const checkIP = async () => {
    setLoading(true);
    const res = await fetch('/api/check-bl', {
      method: 'POST',
      body: JSON.stringify({ target: ip })
    });
    const data = await res.json();
    setResults(data.results);
    setLoading(false);
  };

  return (
    <div className="bl-checker-card">
      <input 
        type="text" 
        value={ip} 
        onChange={(e) => setIp(e.target.value)} 
        placeholder="Enter IP (e.g. 1.2.3.4)" 
      />
      <button onClick={checkIP} disabled={loading}>
        {loading ? 'Checking...' : 'Run Analysis'}
      </button>

      <div className="results-grid">
        {results.map((res) => (
          <div key={res.host} className={`res-item ${res.isBlacklisted ? 'bad' : 'good'}`}>
            <span>{res.host}</span>
            <span className="status">{res.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}