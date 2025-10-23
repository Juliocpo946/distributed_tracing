const bcrypt = require('bcrypt');
const { SALTOS_BCRYPT } = process.env;
const pool = require ('../configs/db.config')

const api = require('@opentelemetry/api');
const tracer = api.trace.getTracer('usuarios.controller');

const create = async (req, res) => {
    const parentSpan = api.trace.getActiveSpan();
    parentSpan?.setAttribute('controller', 'usuarios');
    parentSpan?.setAttribute('action', 'create');

    try {
        let hashedPassword;
        
        await tracer.startActiveSpan('bcrypt.hashSync', (span) => {
            span.setAttribute('bcrypt.saltos', parseInt(SALTOS_BCRYPT));
            hashedPassword = bcrypt.hashSync(req.body.password, parseInt(SALTOS_BCRYPT));
            span.end();
        });

        const usuario = {
            nombre: req.body.nombre,
            email: req.body.email,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: null,
            deleted: false,
            deletedAt: null
        };
        parentSpan?.setAttribute('user.email', usuario.email);


        const [rows, fields] = await pool.execute('INSERT INTO Usuarios (nombre, email, password, createdAt, updatedAt, deleted, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?)', [usuario.nombre, usuario.email, usuario.password, usuario.createdAt, usuario.updatedAt, usuario.deleted, usuario.deletedAt]);

        return res.status(201).json({
            mensaje: "Usuario creado exitosamente!"
        });
    } catch (error) {
        parentSpan?.recordException(error);
        parentSpan?.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });

        console.error('Error al crear el usuario:', error);
        return res.status(500).json({
            mensaje: "No se pudo crear el usuario",
            error: error.message
        });
    }
};

module.exports = {
    create
};