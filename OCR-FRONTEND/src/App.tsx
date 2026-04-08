import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RecognisePage from './pages/RecognisePage';
import HowItWorksPage from './pages/HowItWorksPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"             element={<HomePage />} />
        <Route path="/recognise"    element={<RecognisePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/about"        element={<AboutPage />} />
        <Route path="/contact"      element={<ContactPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
