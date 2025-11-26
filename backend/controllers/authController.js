const login = async (req, res) => {
    try {
        const { numero_empleado, password } = req.body;

        // Buscar usuario
        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE numero_empleado = ? AND activo = true',
            [numero_empleado]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ 
                success: false, 
                mensaje: 'Credenciales inválidas' 
            });
        }

        const usuario = usuarios[0];

        // Verificar contraseña (sin bcrypt por ahora)
        if (password !== usuario.password) {
            return res.status(401).json({ 
                success: false, 
                mensaje: 'Credenciales inválidas' 
            });
        }

        // Generar token
        const token = jwt.sign(
            { 
                id: usuario.id, 
                numero_empleado: usuario.numero_empleado,
                rol: usuario.rol 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Crear sesión activa
        await pool.query(
            'INSERT INTO sesiones (usuario_id, activa) VALUES (?, true)',
            [usuario.id]
        );

        res.json({
            success: true,
            token,
            usuario: {
                id: usuario.id,
                numero_empleado: usuario.numero_empleado,
                nombre: usuario.nombre,
                rol: usuario.rol,
                unidad_asignada: usuario.unidad_asignada
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error en el servidor' 
        });
    }
};