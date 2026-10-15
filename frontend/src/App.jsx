// src/App.jsx
import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import {
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { AuthContext } from './contexts/AuthContext';
import ShopPage from './pages/ShopPage';        
import ScrollToTopButton from "./components/ScrollToTopButton";
import CartPage from './pages/CartPage';
import AboutSection from './pages/AboutSection';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import MentionsLegales from "./pages/MentionsLegales";
import Footer from './components/Footer';
import NavBar from './components/NavBar';
import Canonical from './components/Canonical';
import ScrollToTopOnNavigate from './components/ScrollToTopOnNavigate';
import { ToastContainer } from 'react-toastify';
import './styles/Global.css';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from './pages/HomePage';

// Code de l'admin (éditeurs, Firebase, factures…) chargé à part : les visiteurs ne le téléchargent pas
const Login = lazy(() => import('./components/Modal/Login'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));
const AdminDemandes = lazy(() => import('./pages/admin/Demandes'));
const AdminFactures = lazy(() => import('./pages/admin/Factures'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminLogoSettings = lazy(() => import('./pages/admin/AdminLogoSettings'));


function App() {
  const { user, logout } = useContext(AuthContext);
  // 'superadmin' a aussi accès à l'administration (même règle que le backend)
  const isAdmin = !!user && ['admin', 'superadmin'].includes(user.role);


  // Panier global partagé
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const handleRemoveFromCart = id => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (item.quantite > 1) {
        return prev.map(i =>
          i.id === id ? { ...i, quantite: i.quantite - 1 } : i
        );
      }
      return prev.filter(i => i.id !== id);
    });
  };

  return (
    <>
      <ToastContainer position="top-center" />
      <div className="app-container">
        <NavBar isAdmin={isAdmin} handleLogout={logout} cart={cart} />
        <main className="main-content">
          <Canonical />
          <ScrollToTopOnNavigate />
          <Suspense fallback={<p className="page-loading" role="status">Chargement…</p>}>
          <Routes>
            <Route
              path="/"
              element={<HomePage  />}
            />
            <Route path="/shop" element={<ShopPage cart={cart} setCart={setCart} />} />
            <Route
              path="/panier"
              element={
                <CartPage cart={cart} setCart={setCart} onRemove={handleRemoveFromCart} />
              }
            />
            <Route path="/login" element={isAdmin ? <Navigate to="/admin" /> : <Login />} />
            <Route
              path="/admin"
              element={isAdmin ? <AdminPanel /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/categories"
              element={isAdmin ? <AdminCategories /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/utilisateurs"
              element={isAdmin ? <AdminUsers /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/demandes"
              element={isAdmin ? <AdminDemandes /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/factures"
              element={isAdmin ? <AdminFactures /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/parametres"
              element={isAdmin ? <AdminSettings /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/logo"
              element={isAdmin ? <AdminLogoSettings /> : <Navigate to="/login" />}
            />
            <Route path="/a-propos" element={<AboutSection />} />
            <Route path="/confidentialite" element={<PrivacyPolicy />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/contact"
              element={
                <Contact
                  cart={cart}
                  setCart={setCart}
                  onRemove={handleRemoveFromCart}
                />
              }
            />

          </Routes>
          </Suspense>
            <ScrollToTopButton />
        </main>
        <Footer />
      </div>
    </>
  );
}

export default App;
