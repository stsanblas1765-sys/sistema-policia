const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ 
            mensaje: 'Token no proporcionado',
            error: 'NO_TOKEN'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            mensaje: 'Token inválido o expirado',
            error: 'INVALID_TOKEN'
        });
    }
};

const verificarSupervisor = (req, res, next) => {
    if (req.usuario.rol !== 'supervisor') {
        return res.status(403).json({ 
            mensaje: 'Acceso denegado. Solo supervisores',
            error: 'NOT_SUPERVISOR'
        });
    }
    next();
};

module.exports = { verificarToken, verificarSupervisor };