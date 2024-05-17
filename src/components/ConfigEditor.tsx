import React, { useState, useEffect } from 'react';
import { TeamMember } from '../types';

const ConfigEditor: React.FC = () => {
  const [config, setConfig] = useState('');

  useEffect(() => {
    const savedTeam = localStorage.getItem('team');
    if (savedTeam) {
      setConfig(savedTeam);
    }
  }, []);

  const handleSave = () => {
    try {
      const parsedConfig: TeamMember[] = JSON.parse(config);
      localStorage.setItem('team', JSON.stringify(parsedConfig, null, 2));
      alert('Configuration saved!');
      location.reload();
    } catch (error) {
      alert('Invalid JSON');
    }
  };

  return (
    <div className="config-editor">
      <textarea value={config} onChange={(e) => setConfig(e.target.value)} rows={10} cols={50} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default ConfigEditor;