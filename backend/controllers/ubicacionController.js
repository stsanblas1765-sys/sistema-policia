const pool = require('../config/database');

exports.guardarUbicacion = async (req, res) => {
    try {
        const { latitud, longitud, velocidad } = req.body;
        const usuario_id = req.usuario.id;
        
        // Validar datos
        if (!latitud || !longitud) {
            return res.status(400).json({ 
                mensaje: 'Latitud y longitud son requeridas' 
            });
        }
        
        // Guardar ubicación
        await pool.query(
            'INSERT INTO ubicaciones (usuario_id, latitud, longitud, velocidad) VALUES (?, ?, ?, ?)',
            [usuario_id, latitud, longitud, velocidad || 0]
        );
        
        console.log(`📍 Ubicación guardada: ${req.usuario.nombre} (${latitud}, ${longitud})`);
        
        res.json({ 
            success: true,
            mensaje: 'Ubicación guardada correctamente' 
        });
        
    } catch (error) {
        console.error('Error guardando ubicación:', error);
        res.status(500).json({ 
            mensaje: 'Error guardando ubicación',
            error: error.message 
        });
    }
};

exports.obtenerUbicacionesActivas = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id,
                u.nombre,
                u.numero_empleado,
                u.foto_url,
                u.unidad_asignada,
                ub.latitud,
                ub.longitud,
                ub.velocidad,
                ub.timestamp,
                s.inicio_sesion
            FROM usuarios u
            INNER JOIN sesiones s ON u.id = s.usuario_id
            INNER JOIN ubicaciones ub ON u.id = ub.usuario_id
            WHERE s.activa = true 
            AND u.rol = 'patrulla'
            AND ub.id IN (
                SELECT MAX(id) 
                FROM ubicaciones 
                GROUP BY usuario_id
            )
            AND ub.timestamp > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
            ORDER BY ub.timestamp DESC
        `;
        
        const [ubicaciones] = await pool.query(query);
        
        console.log(`📊 Unidades activas encontradas: ${ubicaciones.length}`);
        
        res.json({
            success: true,
            cantidad: ubicaciones.length,
            unidades: ubicaciones
        });
        
    } catch (error) {
        console.error('Error obteniendo ubicaciones:', error);
        res.status(500).json({ 
            mensaje: 'Error obteniendo ubicaciones',
            error: error.message 
        });
    }
};

exports.obtenerRutaUnidad = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const { fecha_inicio, fecha_fin, horas } = req.query;
        
        let query = `
            SELECT latitud, longitud, velocidad, timestamp
            FROM ubicaciones
            WHERE usuario_id = ?
        `;
        
        const params = [usuario_id];
        
        if (fecha_inicio && fecha_fin) {
            query += ' AND timestamp BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        } else if (horas) {
            query += ' AND timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR)';
            params.push(parseInt(horas));
        } else {
            // Por defecto últimas 24 horas
            query += ' AND timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)';
        }
        
        query += ' ORDER BY timestamp ASC';
        
        const [ruta] = await pool.query(query, params);
        
        console.log(`🗺️ Ruta obtenida para usuario ${usuario_id}: ${ruta.length} puntos`);
        
        res.json({
            success: true,
            cantidad: ruta.length,
            ruta: ruta
        });
        
    } catch (error) {
        console.error('Error obteniendo ruta:', error);
        res.status(500).json({ 
            mensaje: 'Error obteniendo ruta',
            error: error.message 
        });
    }
};

exports.obtenerEstadisticas = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_puntos,
                MIN(timestamp) as primera_ubicacion,
                MAX(timestamp) as ultima_ubicacion,
                AVG(velocidad) as velocidad_promedio,
                MAX(velocidad) as velocidad_maxima
            FROM ubicaciones
            WHERE usuario_id = ?
            AND timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `, [usuario_id]);
        
        res.json({
            success: true,
            estadisticas: stats[0]
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ 
            mensaje: 'Error obteniendo estadísticas',
            error: error.message 
        });
    }
};