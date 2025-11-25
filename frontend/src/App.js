import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import MapaSupervisor from './pages/MapaSupervisor';
import PantallaPatrulla from './pages/PantallaPatrulla';
import './App.css';

function App() {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        // Verificar si hay sesión guardada
        const usuarioGuardado = localStorage.getItem('usuario');
        const token = localStorage.getItem('token');
        
        if (usuarioGuardado && token) {
            try {
                setUsuario(JSON.parse(usuarioGuardado));
            } catch (error) {
                console.error('Error parseando usuario:', error);
                localStorage.removeItem('usuario');
                localStorage.removeItem('token');
            }
        }
        
        setCargando(false);
    }, []);

    const handleLoginSuccess = (user) => {
        console.log('✅ Usuario autenticado:', user);
        setUsuario(user);
    };

    const handleLogout = () => {
        console.log('👋 Cerrando sesión');
        setUsuario(null);
    };

    if (cargando) {
        return (
            <div className="cargando-container">
                <div className="spinner-grande"></div>
                <p>Cargando...</p>
            </div>
        );
    }

    // Si no hay usuario, mostrar login
    if (!usuario) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    // Si es supervisor, mostrar mapa
    if (usuario.rol === 'supervisor') {
        return <MapaSupervisor usuario={usuario} onLogout={handleLogout} />;
    }

    // Si es patrulla, mostrar mensaje de app móvil
    if (usuario.rol === 'patrulla') {
        return <PantallaPatrulla usuario={usuario} onLogout={handleLogout} />;
    }

    // Por si acaso
    return (
        <div className="error-container">
            <h1>Rol no reconocido</h1>
            <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
    );
}

export default App;