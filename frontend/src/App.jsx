// src/App.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { AuthContext } from './contexts/AuthContext';
import ShopPage from './pages/ShopPage';        
import Login from './components/Modal/Login';
import ScrollToTopButton from "./components/ScrollToTopButton";
import AdminPanel from './pages/admin/AdminPanel';
import AdminDemandes from './pages/admin/Demandes';
import AdminUsers from './pages/admin/AdminUsers';
import CartPage from './pages/CartPage';
import AboutSection from './pages/AboutSection';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import MentionsLegales from "./pages/MentionsLegales";
import ResetPassword from './pages/ResetPassword';
import AdminCategories from './pages/admin/Categories';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLogoSettings from './pages/admin/AdminLogoSettings';
import Footer from './components/Footer';
import NavBar from './components/NavBar';
import Canonical from './components/Canonical';
import { ToastContainer } from 'react-toastify';
import './styles/Global.css';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from './pages/HomePage';
import AdminDevisFacture from './pages/admin/AdminDevisFacture';


function App() {
  const { user, logout } = useContext(AuthContext);
  const isAdmin = user && user.role === 'admin';


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
            <Route path="/admin/demande/:id/devis" element={<AdminDevisFacture />} />

          </Routes>
            <ScrollToTopButton />
        </main>
        <footer>
          <Footer />
        </footer>
      </div>
    </>
  );
}

export default App;
