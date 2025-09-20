import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import CreateOrder from './pages/CreateOrder';
import OrdersList from './pages/OrdersList';
import OrderView from './pages/OrderView';
import UpdateOrder from './pages/UpdateOrder';
import './App.css';
import './animations.css';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
          <Routes>
            <Route path="/" element={<OrdersList />} />
            <Route path="/create" element={<CreateOrder />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/order/:id" element={<OrderView />} />
            <Route path="/update-order/:id" element={<UpdateOrder />} />
          </Routes>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
