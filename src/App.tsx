import './App.css';

import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Game } from './components/Game';
import { ScoresPage } from './components/ScoresPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/scores" element={<ScoresPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;