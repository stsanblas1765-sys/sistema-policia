const jwt = require('jsonwebtoken');
const pool = require('../config/database');

exports.login = async (req, res) => {
    try {
        const { numero_empleado, password } = req.body;
        
        console.log('📋 Intento de login:', numero_empleado);
        
        // Validar que vengan los datos
        if (!numero_empleado || !password) {
            return res.status(400).json({ 
                mensaje: 'Número de empleado y contraseña son requeridos' 
            });
        }
        
        // Buscar usuario
        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE numero_empleado = ? AND activo = true',
            [numero_empleado]
        );
        
        if (usuarios.length === 0) {
            console.log('❌ Usuario no encontrado:', numero_empleado);
            return res.status(401).json({ 
                mensaje: 'Credenciales inválidas' 
            });
        }
        
        const usuario = usuarios[0];
        
        // Verificar password (por ahora simple, luego usaremos bcrypt)
        if (password !== usuario.password) {
            console.log('❌ Contraseña incorrecta');
            return res.status(401).json({ 
                mensaje: 'Credenciales inválidas' 
            });
        }
        
        // Crear sesión en la base de datos
        await pool.query(
            'INSERT INTO sesiones (usuario_id, activa) VALUES (?, true)',
            [usuario.id]
        );
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                numero_empleado: usuario.numero_empleado,
                rol: usuario.rol,
                nombre: usuario.nombre
            },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );
        
        console.log('✅ Login exitoso:', usuario.nombre);
        
        res.json({
            success: true,
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                numero_empleado: usuario.numero_empleado,
                rol: usuario.rol,
                unidad_asignada: usuario.unidad_asignada,
                foto_url: usuario.foto_url
            }
        });
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ 
            mensaje: 'Error en el servidor',
            error: error.message 
        });
    }
};

exports.logout = async (req, res) => {
    try {
        await pool.query(
            'UPDATE sesiones SET fin_sesion = NOW(), activa = false WHERE usuario_id = ? AND activa = true',
            [req.usuario.id]
        );
        
        console.log('✅ Logout exitoso:', req.usuario.nombre);
        
        res.json({ 
            success: true,
            mensaje: 'Sesión cerrada exitosamente' 
        });
        
    } catch (error) {
        console.error('❌ Error en logout:', error);
        res.status(500).json({ 
            mensaje: 'Error en el servidor',
            error: error.message 
        });
    }
};

exports.verificarToken = async (req, res) => {
    try {
        const [usuarios] = await pool.query(
            'SELECT id, nombre, numero_empleado, rol, unidad_asignada, foto_url FROM usuarios WHERE id = ? AND activo = true',
            [req.usuario.id]
        );
        
        if (usuarios.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario no encontrado' });
        }
        
        res.json({
            success: true,
            usuario: usuarios[0]
        });
        
    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};