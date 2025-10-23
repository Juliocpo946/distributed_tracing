const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SECRET_JWT } = process.env;
const pool = require ('../configs/db.config')

const api = require('@opentelemetry/api');
const tracer = api.trace.getTracer('auth.controller');

const login = async (req, res) => {
    const parentSpan = api.trace.getActiveSpan();
    
    parentSpan?.setAttribute('controller', 'auth');
    parentSpan?.setAttribute('action', 'login');

    try {
        const { email, password } = req.body;
        parentSpan?.setAttribute('user.email', email);


        const [rows] = await pool.execute('SELECT * FROM Usuarios WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(200).json({
                message: "Email o contraseña incorrecta"
            });
        }

        const usuarioEncontrado = rows[0];

        let passwordCorrecta;
        await tracer.startActiveSpan('bcrypt.compareSync', async (span) => {
            passwordCorrecta = bcrypt.compareSync(password, usuarioEncontrado.password);
            span.setAttribute('user.id', usuarioEncontrado.id);
            span.setAttribute('password.is_correct', passwordCorrecta);
            span.end();
        });


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

        let token;
        await tracer.startActiveSpan('jwt.sign', (span) => {
            span.setAttribute('user.id', usuarioEncontrado.id);
            token = jwt.sign(payload, SECRET_JWT, { expiresIn: '1h' });
            span.end();
        });
        
        return res.status(200).json({
            message: "Acceso concedido",
            token
        });
    } catch (error) {
        parentSpan?.recordException(error);
        parentSpan?.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });

        return res.status(500).json({
            message: "Error al intentar loguearse",
            error: error.message
        });
    }
};

module.exports = {
    login
};