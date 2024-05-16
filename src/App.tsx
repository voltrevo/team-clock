import React from 'react';
import TeamVisualizer from './components/TeamVisualizer';
import ConfigEditor from './components/ConfigEditor';

const App: React.FC = () => {
  return (
    <div className="app">
      <h1>Team Timezone Tracker</h1>
      <ConfigEditor />
      <TeamVisualizer />
    </div>
  );
};

export default App;
