import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/PantallaPatrulla.css';

const socket = io('https://sistema-policia-api.onrender.com');

function PantallaPatrulla() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [estado, setEstado] = useState('Inicializando...');
  const [ubicacionActual, setUbicacionActual] = useState(null);
  const [rastreando, setRastreando] = useState(true);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    // Verificar si hay usuario logueado
    const usuarioGuardado = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');

    if (!usuarioGuardado || !token) {
      navigate('/');
      return;
    }

    const user = JSON.parse(usuarioGuardado);
    
    // Verificar que sea patrulla
    if (user.rol !== 'patrulla') {
      alert('Esta pantalla es solo para oficiales de patrulla');
      navigate('/mapa');
      return;
    }

    setUsuario(user);
    iniciarRastreo();

    return () => {
      detenerRastreo();
    };
  }, [navigate]);

  const iniciarRastreo = () => {
    if (!navigator.geolocation) {
      setEstado('❌ Tu navegador no soporta geolocalización');
      return;
    }

    setEstado('🔄 Solicitando permisos de ubicación...');

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        
        setUbicacionActual({
          latitud: latitude,
          longitud: longitude,
          velocidad: speed || 0
        });

        // Enviar ubicación al backend
        enviarUbicacion(latitude, longitude, speed || 0);
        
        setEstado('✅ Compartiendo ubicación en tiempo real');
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        setEstado(`❌ Error: ${error.message}`);
      },
      options
    );

    setWatchId(id);
  };

  const enviarUbicacion = async (latitud, longitud, velocidad) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No hay token disponible');
        setEstado('❌ Sesión expirada, vuelve a iniciar sesión');
        setTimeout(() => navigate('/'), 3000);
        return;
      }
      
      const response = await fetch('https://sistema-policia-api.onrender.com/api/ubicaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitud,
          longitud,
          velocidad
        })
      });

      if (response.status === 401) {
        console.error('Token inválido o expirado');
        setEstado('❌ Sesión expirada, vuelve a iniciar sesión');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (response.ok) {
        // Emitir por Socket.IO para tiempo real
        socket.emit('actualizarUbicacion', {
          latitud,
          longitud,
          velocidad
        });
      }
    } catch (error) {
      console.error('Error al enviar ubicación:', error);
      setEstado(`❌ Error de conexión: ${error.message}`);
    }
  };

  const detenerRastreo = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setRastreando(false);
      setEstado('⏸️ Rastreo pausado');
    }
  };

  const reanudarRastreo = () => {
    setRastreando(true);
    iniciarRastreo();
  };

  const cerrarSesion = () => {
    detenerRastreo();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    // Recargar la página para ir al login
    window.location.href = '/';
  };

  if (!usuario) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="patrulla-container">
      <div className="patrulla-header">
        <h1>🚔 Sistema de Rastreo Policial</h1>
        <div className="usuario-info">
          <p><strong>{usuario.nombre}</strong></p>
          <p>{usuario.unidad_asignada}</p>
        </div>
      </div>

      <div className="patrulla-content">
        <div className="estado-card">
          <h2>Estado del Rastreo</h2>
          <p className="estado-texto">{estado}</p>
          
          {ubicacionActual && (
            <div className="ubicacion-info">
              <p><strong>📍 Ubicación actual:</strong></p>
              <p>Lat: {ubicacionActual.latitud.toFixed(6)}</p>
              <p>Lng: {ubicacionActual.longitud.toFixed(6)}</p>
              <p>Velocidad: {(ubicacionActual.velocidad * 3.6).toFixed(2)} km/h</p>
            </div>
          )}
        </div>

        <div className="controles">
          {rastreando ? (
            <button onClick={detenerRastreo} className="btn-pausar">
              ⏸️ Pausar Rastreo
            </button>
          ) : (
            <button onClick={reanudarRastreo} className="btn-reanudar">
              ▶️ Reanudar Rastreo
            </button>
          )}
          
          <button onClick={cerrarSesion} className="btn-cerrar">
            🚪 Cerrar Sesión
          </button>
        </div>

        <div className="instrucciones">
          <h3>📱 Instrucciones:</h3>
          <ul>
            <li>Mantén esta pantalla abierta mientras estés de servicio</li>
            <li>Tu ubicación se comparte automáticamente cada pocos segundos</li>
            <li>Asegúrate de tener el GPS activado</li>
            <li>No cierres el navegador</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PantallaPatrulla;