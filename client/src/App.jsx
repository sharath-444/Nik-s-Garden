import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Garden from './pages/Garden';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import { ThemeProvider } from './context/ThemeContext';
import { AudioProvider } from './context/AudioContext';

function App() {
  return (
    <ThemeProvider>
      <AudioProvider>
        <Router>
          <div className="min-h-screen flex flex-col font-kalam text-[#3d3b38] transition-colors duration-500 app-container">
            <Navbar />
            <main className="flex-grow flex flex-col pt-16">
              <Routes>
                <Route path="/" element={<Garden />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AudioProvider>
    </ThemeProvider>
  );
}

export default App;
