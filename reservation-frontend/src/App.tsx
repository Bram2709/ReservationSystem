import './App.css'
import { Route, Routes } from 'react-router-dom'
import { LandingPage } from './Pages/LandingPage.tsx';

function App() {

  return (
    <Routes>
      <Route path='/' element={<LandingPage />} />
    </Routes>
  );
}

export default App
