const jwt = require('jsonwebtoken');
const secretJWT = process.env.SECRET_JWT;

const api = require('@opentelemetry/api');
const tracer = api.trace.getTracer('auth.middleware');

const verificarJWT = (req, res, next) => {
    return tracer.startActiveSpan('verificarJWT', (span) => {
        try {
            const token = req.get('Authorization');
            span.setAttribute('token.exists', !!token);

            if (!token) {
                span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'No token provided' });
                span.end();
                return res.status(401).json({ message: "No se proveyó token" });
            }

            jwt.verify(token, secretJWT, (err, decode) => {
                if (err) {
                    span.recordException(err);
                    span.setStatus({ code: api.SpanStatusCode.ERROR, message: err.message });
                    span.end();
                    return res.status(401).json({
                        message: "error al validar token",
                        error: err.message
                    });
                }

                req.usuario = decode.usuario;
                span.setAttribute('user.id', decode.usuario.id);
                span.setStatus({ code: api.SpanStatusCode.OK });
                span.end();
                next();
            });

        } catch (error) {
            span.recordException(error);
            span.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
            span.end();
            return res.status(401).json({
                message: "error al validar token",
                error: error.message
            });
        }
    });
}

module.exports = {
    verificarJWT
}