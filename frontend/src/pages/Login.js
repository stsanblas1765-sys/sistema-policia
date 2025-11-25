import React, { useState } from 'react';
import { authAPI } from '../services/api';
import '../styles/Login.css';

function Login({ onLoginSuccess }) {
    const [numero_empleado, setNumeroEmpleado] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            console.log('Intentando login con:', numero_empleado);
            
            const response = await authAPI.login(numero_empleado, password);
            console.log('Respuesta del servidor:', response.data);
            
            const { token, usuario } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('usuario', JSON.stringify(usuario));

            console.log('✅ Login exitoso:', usuario.nombre);
            onLoginSuccess(usuario);
            
        } catch (err) {
            console.error('❌ Error en login:', err);
            setError(err.response?.data?.mensaje || 'Error al iniciar sesión. Verifica tus credenciales.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <div className="logo">🚔</div>
                    <h1>Sistema Policial</h1>
                    <p>Rastreo de Unidades en Tiempo Real</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Número de Empleado</label>
                        <input
                            type="text"
                            value={numero_empleado}
                            onChange={(e) => setNumeroEmpleado(e.target.value)}
                            placeholder="Ej: SUP001 o PAT001"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ingresa tu contraseña"
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    <button type="submit" disabled={cargando} className="btn-login">
                        {cargando ? '⏳ Iniciando sesión...' : '🔐 Iniciar Sesión'}
                    </button>
                </form>

                <div className="login-footer">
                    <div className="credentials-demo">
                        <p><strong>👤 Credenciales de prueba:</strong></p>
                        <div className="demo-users">
                            <div className="demo-user">
                                <span className="badge supervisor">Supervisor</span>
                                <p>Usuario: <strong>SUP001</strong></p>
                                <p>Contraseña: <strong>password123</strong></p>
                            </div>
                            <div className="demo-user">
                                <span className="badge patrulla">Patrulla</span>
                                <p>Usuario: <strong>PAT001</strong></p>
                                <p>Contraseña: <strong>password123</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;