const bcrypt = require('bcrypt');
const { SALTOS_BCRYPT } = process.env;
const pool = require ('../configs/db.config')
const create = async (req, res) => {
    try {
        const usuario = {
            nombre: req.body.nombre,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, parseInt(SALTOS_BCRYPT)),
            createdAt: new Date(),
            updatedAt: null,
            deleted: false,
            deletedAt: null
        };

        const [rows, fields] = await pool.execute('INSERT INTO Usuarios (nombre, email, password, createdAt, updatedAt, deleted, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?)', [usuario.nombre, usuario.email, usuario.password, usuario.createdAt, usuario.updatedAt, usuario.deleted, usuario.deletedAt]);


        return res.status(201).json({
            mensaje: "Usuario creado exitosamente!"
        });
    } catch (error) {
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
