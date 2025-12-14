import { HashRouter, Routes, Route } from 'react-router-dom';
import TeamGenerator from './pages/TeamGenerator';
import AdminConsole from './pages/AdminConsole';
import './App.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TeamGenerator />} />
        <Route path="/admin" element={<AdminConsole />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
