import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import TeamGenerator from './pages/TeamGenerator';
import AdminConsole from './pages/AdminConsole';
import PositionsGuide from './pages/PositionsGuide';
import LoginPage from './pages/LoginPage';
import { hasSession } from './lib/auth';
import './App.css';

function App() {
  // Nothing else renders (or connects to Firestore) until the password has been entered.
  const [loggedIn, setLoggedIn] = useState(hasSession);

  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TeamGenerator />} />
        <Route path="/admin" element={<AdminConsole />} />
        <Route path="/positions" element={<PositionsGuide />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
