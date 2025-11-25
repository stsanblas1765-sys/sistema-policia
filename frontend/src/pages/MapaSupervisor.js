import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';
import { ubicacionAPI, authAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';
import '../styles/MapaSupervisor.css';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icono personalizado para patrullas
const iconoPatrulla = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Componente para centrar el mapa
function CentrarMapa({ posicion }) {
    const map = useMap();
    useEffect(() => {
        if (posicion) {
            map.setView(posicion, 13);
        }
    }, [posicion, map]);
    return null;
}

function MapaSupervisor({ usuario, onLogout }) {
    const [unidades, setUnidades] = useState([]);
    const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
    const [rutaSeleccionada, setRutaSeleccionada] = useState([]);
    const [socket, setSocket] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [centroMapa, setCentroMapa] = useState(null);

    // Posición inicial del mapa (Monterrey, México)
    const posicionInicial = [25.6866, -100.3161];

    useEffect(() => {
        cargarUnidades();

        // Conectar Socket.IO
        const newSocket = io('http://localhost:3000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ Conectado al servidor en tiempo real');
            newSocket.emit('supervisorConectado', { 
                nombre: usuario.nombre,
                id: usuario.id 
            });
        });

        newSocket.on('ubicacionActualizada', (data) => {
            console.log('📍 Ubicación actualizada:', data);
            cargarUnidades();
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Desconectado del servidor');
        });

        // Actualizar cada 15 segundos
        const interval = setInterval(cargarUnidades, 15000);

        return () => {
            if (newSocket) newSocket.close();
            clearInterval(interval);
        };
    }, []);

    const cargarUnidades = async () => {
        try {
            const response = await ubicacionAPI.obtenerUbicacionesActivas();
            console.log('📊 Unidades cargadas:', response.data);
            
            if (response.data.success) {
                setUnidades(response.data.unidades);
                
                // Centrar en la primera unidad si existe
                if (response.data.unidades.length > 0 && !centroMapa) {
                    const primera = response.data.unidades[0];
                    setCentroMapa([primera.latitud, primera.longitud]);
                }
            }
            
            setCargando(false);
        } catch (error) {
            console.error('❌ Error cargando unidades:', error);
            setCargando(false);
        }
    };

    const seleccionarUnidad = async (unidad) => {
        console.log('🎯 Unidad seleccionada:', unidad);
        setUnidadSeleccionada(unidad);
        setCentroMapa([unidad.latitud, unidad.longitud]);
        
        try {
            const response = await ubicacionAPI.obtenerRutaUnidad(unidad.id, { horas: 24 });
            console.log('🗺️ Ruta obtenida:', response.data);
            
            if (response.data.success && response.data.ruta.length > 0) {
                const ruta = response.data.ruta.map(punto => [
                    parseFloat(punto.latitud), 
                    parseFloat(punto.longitud)
                ]);
                setRutaSeleccionada(ruta);
            } else {
                setRutaSeleccionada([]);
            }
        } catch (error) {
            console.error('❌ Error cargando ruta:', error);
            setRutaSeleccionada([]);
        }
    };

    const cerrarSesion = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            if (socket) socket.close();
            onLogout();
        }
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="mapa-supervisor-container">
            {/* Header */}
            <div className="header">
                <div className="header-left">
                    <h1>🚔 Panel de Supervisión</h1>
                    <span className="unidades-count">
                        {unidades.length} unidad{unidades.length !== 1 ? 'es' : ''} activa{unidades.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="usuario-info">
                    <span className="usuario-nombre">👤 {usuario.nombre}</span>
                    <span className="usuario-rol">{usuario.rol}</span>
                    <button onClick={cerrarSesion} className="btn-logout">
                        🚪 Cerrar Sesión
                    </button>
                </div>
            </div>

            <div className="contenido">
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="sidebar-header">
                        <h2>Unidades Activas</h2>
                        <button onClick={cargarUnidades} className="btn-refresh" title="Actualizar">
                            🔄
                        </button>
                    </div>
                    
                    {cargando ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            <p>Cargando unidades...</p>
                        </div>
                    ) : unidades.length === 0 ? (
                        <div className="no-unidades">
                            <div className="no-unidades-icon">📡</div>
                            <p><strong>No hay unidades activas</strong></p>
                            <small>
                                Las unidades aparecerán aquí cuando los oficiales 
                                inicien sesión desde la aplicación móvil y comiencen 
                                a transmitir su ubicación.
                            </small>
                        </div>
                    ) : (
                        <div className="lista-unidades">
                            {unidades.map((unidad) => (
                                <div
                                    key={unidad.id}
                                    className={`unidad-card ${unidadSeleccionada?.id === unidad.id ? 'seleccionada' : ''}`}
                                    onClick={() => seleccionarUnidad(unidad)}
                                >
                                    <div className="unidad-header">
                                        <h3>{unidad.unidad_asignada || 'Sin unidad'}</h3>
                                        <span className="estado-activo" title="En línea">●</span>
                                    </div>
                                    <div className="unidad-body">
                                        <p className="unidad-nombre">
                                            <strong>{unidad.nombre}</strong>
                                        </p>
                                        <p className="unidad-info">
                                            <span>👮</span> {unidad.numero_empleado}
                                        </p>
                                        <p className="unidad-info">
                                            <span>🕐</span> {formatearFecha(unidad.inicio_sesion)}
                                        </p>
                                        <p className="unidad-info">
                                            <span>📍</span> {unidad.latitud.toFixed(6)}, {unidad.longitud.toFixed(6)}
                                        </p>
                                        {unidad.velocidad > 0 && (
                                            <p className="unidad-info">
                                                <span>🚗</span> {unidad.velocidad.toFixed(1)} km/h
                                            </p>
                                        )}
                                    </div>
                                    <button className="btn-ver-ruta">
                                        Ver ruta completa →
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mapa */}
                <div className="mapa-contenedor">
                    <MapContainer
                        center={centroMapa || posicionInicial}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {centroMapa && <CentrarMapa posicion={centroMapa} />}

                        {unidades.map((unidad) => (
                            <Marker
                                key={unidad.id}
                                position={[parseFloat(unidad.latitud), parseFloat(unidad.longitud)]}
                                icon={iconoPatrulla}
                            >
                                <Popup>
                                    <div className="popup-info">
                                        <h3>{unidad.unidad_asignada}</h3>
                                        <p><strong>{unidad.nombre}</strong></p>
                                        <p>👮 {unidad.numero_empleado}</p>
                                        <p>🕐 {formatearFecha(unidad.timestamp)}</p>
                                        {unidad.velocidad > 0 && (
                                            <p>🚗 {unidad.velocidad.toFixed(1)} km/h</p>
                                        )}
                                        <button 
                                            onClick={() => seleccionarUnidad(unidad)}
                                            className="btn-popup"
                                        >
                                            Ver Ruta Completa
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {rutaSeleccionada.length > 0 && (
                            <Polyline
                                positions={rutaSeleccionada}
                                color="#e74c3c"
                                weight={3}
                                opacity={0.7}
                            />
                        )}
                    </MapContainer>

                    {unidadSeleccionada && rutaSeleccionada.length > 0 && (
                        <div className="info-ruta">
                            <p>
                                📍 Mostrando ruta de <strong>{unidadSeleccionada.nombre}</strong>
                                {' '}({rutaSeleccionada.length} puntos)
                            </p>
                            <button 
                                onClick={() => {
                                    setUnidadSeleccionada(null);
                                    setRutaSeleccionada([]);
                                }}
                                className="btn-cerrar-ruta"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MapaSupervisor;