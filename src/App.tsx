import React from 'react';
import TeamVisualizer from './components/TeamVisualizer';
import ConfigEditor from './components/ConfigEditor';

const App: React.FC = () => {
  return (
    <div className="app">
      <h1>Team Clock</h1>
      <TeamVisualizer />
      <ConfigEditor />
    </div>
  );
};

export default App;
