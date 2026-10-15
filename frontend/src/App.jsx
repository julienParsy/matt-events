// src/App.jsx
import React, { useState, useEffect, useContext, lazy, Suspense } from 'react';
import {
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { AuthContext } from './contexts/AuthContext';
import ShopPage from './pages/ShopPage';        
import ScrollToTopButton from "./components/layout/ScrollToTopButton";
import CartPage from './pages/CartPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import MentionsLegalesPage from "./pages/MentionsLegalesPage";
import Footer from './components/layout/Footer';
import NavBar from './components/layout/NavBar';
import Canonical from './components/layout/Seo';
import ScrollToTopOnNavigate from './components/layout/ScrollToTopOnNavigate';
import { ToastContainer } from 'react-toastify';
import './styles/global.css';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from './pages/HomePage';

// Code de l'admin (éditeurs, Firebase, factures…) chargé à part : les visiteurs ne le téléchargent pas
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminCatalogPage = lazy(() => import('./pages/admin/AdminCatalogPage'));
const AdminDemandesPage = lazy(() => import('./pages/admin/AdminDemandesPage'));
const AdminFacturesPage = lazy(() => import('./pages/admin/AdminFacturesPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminLogoSettingsPage = lazy(() => import('./pages/admin/AdminLogoSettingsPage'));


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
            <Route path="/login" element={isAdmin ? <Navigate to="/admin" /> : <LoginPage />} />
            <Route
              path="/admin"
              element={isAdmin ? <AdminCatalogPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/categories"
              element={isAdmin ? <AdminCategoriesPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/utilisateurs"
              element={isAdmin ? <AdminUsersPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/demandes"
              element={isAdmin ? <AdminDemandesPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/factures"
              element={isAdmin ? <AdminFacturesPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/parametres"
              element={isAdmin ? <AdminSettingsPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/logo"
              element={isAdmin ? <AdminLogoSettingsPage /> : <Navigate to="/login" />}
            />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/confidentialite" element={<PrivacyPolicyPage />} />
            <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
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
