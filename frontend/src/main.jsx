import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AuthProvider from './contexts/AuthProvider';
import { BrowserRouter } from 'react-router-dom';
import { SeoProvider } from './components/layout/Seo';
import './styles/global.css';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <SeoProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </SeoProvider>
  </React.StrictMode>
);
