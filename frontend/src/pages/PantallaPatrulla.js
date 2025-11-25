import React from 'react';
import { authAPI } from '../services/api';
import '../styles/PantallaPatrulla.css';

function PantallaPatrulla({ usuario, onLogout }) {
    const cerrarSesion = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            onLogout();
        }
    };

    return (
        <div className="pantalla-patrulla">
            <div className="mensaje-container">
                <div className="icono-movil">📱</div>
                <h1>Aplicación Móvil Requerida</h1>
                <p className="descripcion">
                    Hola <strong>{usuario.nombre}</strong>, como oficial de patrulla 
                    debes usar la aplicación móvil para reportar tu ubicación.
                </p>
                
                <div className="info-box">
                    <h3>📲 Instrucciones:</h3>
                    <ol>
                        <li>Descarga la app móvil en tu dispositivo</li>
                        <li>Inicia sesión con tus credenciales</li>
                        <li>Activa el GPS de tu dispositivo</li>
                        <li>La app enviará tu ubicación automáticamente</li>
                    </ol>
                </div>

                <div className="usuario-info">
                    <p><strong>Tu información:</strong></p>
                    <p>👮 {usuario.numero_empleado}</p>
                    <p>🚔 {usuario.unidad_asignada || 'Sin unidad asignada'}</p>
                </div>

                <button onClick={cerrarSesion} className="btn-logout">
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}

export default PantallaPatrulla;