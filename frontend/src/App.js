import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MapaSupervisor from './pages/MapaSupervisor';
import PantallaPatrulla from './pages/PantallaPatrulla';
import './App.css';

function App() {
  const [usuario, setUsuario] = React.useState(null);

  React.useEffect(() => {
    // Verificar si hay usuario guardado
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  const handleLogin = (user) => {
    setUsuario(user);
    localStorage.setItem('usuario', JSON.stringify(user));
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta de Login */}
          <Route 
            path="/" 
            element={
              usuario ? (
                <Navigate to={usuario.rol === 'supervisor' ? '/mapa' : '/patrulla'} replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />

          {/* Ruta del Mapa (Supervisores) */}
          <Route 
            path="/mapa" 
            element={
              usuario && usuario.rol === 'supervisor' ? (
                <MapaSupervisor usuario={usuario} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Ruta de Patrulla */}
          <Route 
            path="/patrulla" 
            element={
              usuario && usuario.rol === 'patrulla' ? (
                <PantallaPatrulla usuario={usuario} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;