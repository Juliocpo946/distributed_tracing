const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SECRET_JWT } = process.env;
const pool = require ('../configs/db.config')

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await pool.execute('SELECT * FROM Usuarios WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(200).json({
                message: "Email o contraseña incorrecta"
            });
        }

        const usuarioEncontrado = rows[0];

        const passwordCorrecta = bcrypt.compareSync(password, usuarioEncontrado.password);
        if (!passwordCorrecta) {
            return res.status(200).json({
                message: "Email o contraseña incorrecta"
            });
        }

        const payload = {
            usuario: {
                id: usuarioEncontrado.id 
            }
        };

        const token = jwt.sign(payload, SECRET_JWT, { expiresIn: '1h' });

        return res.status(200).json({
            message: "Acceso concedido",
            token
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error al intentar loguearse",
            error: error.message
        });
    }
};

module.exports = {
    login
};
