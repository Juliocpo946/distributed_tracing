# Distributed Tracing en Arquitectura Monolítica

Implementación del patrón de microservicios **Distributed Tracing** adaptado a una aplicación monolítica Node.js, demostrando cómo aplicar principios de observabilidad distribuida en sistemas no distribuidos.

## Concepto del patrón

### Distributed Tracing en microservicios

En arquitecturas de microservicios, Distributed Tracing permite rastrear una petición completa mientras viaja a través de múltiples servicios independientes. Cada servicio genera spans que se correlacionan mediante trace IDs y parent IDs, creando una vista unificada del flujo de la petición.

### Adaptación a monolito

Este proyecto demuestra cómo aplicar los mismos principios de trazabilidad en un monolito, tratando cada capa de la aplicación (middleware, controlador, operación crítica) como si fuera un "servicio" independiente. Aunque todo corre en el mismo proceso, la instrumentación permite visualizar el flujo interno de la petición con el mismo nivel de detalle que tendría en una arquitectura distribuida.

## Por qué implementar Distributed Tracing en un monolito

### Preparación para migración

- Identificar límites naturales de servicios antes de separar el monolito
- Detectar dependencias entre componentes que podrían ser problemáticas en microservicios
- Medir el impacto de latencias que serían críticas en llamadas de red

### Observabilidad granular

- Identificar operaciones costosas dentro del flujo de la petición
- Visualizar el tiempo exacto de cada operación (DB, bcrypt, JWT)
- Detectar cuellos de botella que no son evidentes en logs tradicionales

### Debugging contextual

- Rastrear el flujo completo de una petición específica
- Correlacionar errores con el contexto de ejecución
- Analizar patrones de fallo en operaciones encadenadas

## Arquitectura de instrumentación

### Jerarquía de trazas

```
HTTP Request (auto-instrumentado)
├── Middleware: verificarJWT
│   └── jwt.verify (manual span)
│
└── Controller: auth.login
    ├── MySQL Query (auto-instrumentado)
    ├── bcrypt.compareSync (manual span)
    └── jwt.sign (manual span)
```

### Tipos de instrumentación

**Auto-instrumentación**
- Peticiones HTTP (express)
- Consultas a base de datos (mysql2)
- Llamadas HTTP salientes

**Instrumentación manual**
- Operaciones criptográficas (bcrypt)
- Generación y verificación de tokens (JWT)
- Lógica de negocio específica

## Implementación técnica

### Inicialización del tracer

**Archivo:** `src/tracer.js`

```javascript
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'auth-api-service',
  }),
  spanProcessors: [
    new BatchSpanProcessor(otlpExporter),  // Envío a Jaeger
    new BatchSpanProcessor(consoleExporter) // Debug local
  ],
  instrumentations: [getNodeAutoInstrumentations()],
});
```

**Principios aplicados:**
- Service name identifica el "servicio" aunque sea monolito
- Múltiples exporters (Jaeger para visualización, consola para desarrollo)
- Auto-instrumentación para capas de infraestructura

### Spans manuales en operaciones críticas

**Archivo:** `src/controllers/auth.controller.js`

```javascript
await tracer.startActiveSpan('bcrypt.compareSync', async (span) => {
    passwordCorrecta = bcrypt.compareSync(password, usuarioEncontrado.password);
    span.setAttribute('user.id', usuarioEncontrado.id);
    span.setAttribute('password.is_correct', passwordCorrecta);
    span.end();
});
```

**Concepto:**
- Cada operación costosa se trata como un "microservicio interno"
- Los atributos personalizados actúan como metadata del servicio
- El span hierarchy simula la comunicación entre servicios

### Context propagation

**Archivo:** `src/middlewares/auth.middleware.js`

```javascript
return tracer.startActiveSpan('verificarJWT', (span) => {
    const token = req.get('Authorization');
    span.setAttribute('token.exists', !!token);
    
    jwt.verify(token, secretJWT, (err, decode) => {
        req.usuario = decode.usuario;
        span.setAttribute('user.id', decode.usuario.id);
        span.end();
        next();
    });
});
```

**Concepto:**
- El middleware actúa como "API Gateway" en microservicios
- El contexto se propaga automáticamente al siguiente span (controlador)
- Similar a propagación de headers (trace-id, span-id) entre servicios

### Manejo de errores con contexto

```javascript
const parentSpan = api.trace.getActiveSpan();

try {
    // Operaciones
} catch (error) {
    parentSpan?.recordException(error);
    parentSpan?.setStatus({ 
        code: api.SpanStatusCode.ERROR, 
        message: error.message 
    });
}
```

**Concepto:**
- Los errores se registran en el span activo con stack trace completo
- El status del span marca el "servicio" como fallido
- Jaeger puede filtrar traces con errores (equivalente a circuit breaker patterns)

## Comparación: Microservicios vs Monolito

### En microservicios reales

```
[API Gateway] → HTTP → [Auth Service] → HTTP → [User Service] → DB
     span1              span2              span3           span4
```

Cada flecha HTTP representa latencia de red y serialización.

### En este monolito instrumentado

```
[Middleware] → Memory → [Controller] → Memory → [DB Layer] → DB
     span1                  span2                 span3       span4
```

Las "llamadas entre servicios" son invocaciones de funciones en memoria, pero la instrumentación simula la misma visibilidad.

## Casos de uso

### Identificar operación lenta

**Sin tracing:**
```
Request took 850ms
```

**Con tracing:**
```
HTTP Request: 850ms
├── verificarJWT: 12ms
│   └── jwt.verify: 10ms
└── auth.login: 835ms
    ├── MySQL Query: 45ms
    ├── bcrypt.compareSync: 780ms  ← CUELLO DE BOTELLA
    └── jwt.sign: 8ms
```

### Analizar cascada de errores

Si bcrypt falla, el span muestra:
- Exception completa con stack trace
- Contexto: user.id, user.email
- Timestamp exacto del fallo
- Spans hijo que nunca se ejecutaron

### Planificar extracción de servicios

Las operaciones más lentas o con mayor acoplamiento son candidatas para convertirse en microservicios:
- `bcrypt.compareSync` (780ms) → Auth Microservice
- `MySQL Queries` → User Repository Service

## Configuración de Jaeger

### Despliegue

```yaml
jaeger:
  image: jaegertracing/all-in-one:latest
  ports:
    - "6831:6831/udp"  # Agent (Jaeger Thrift)
    - "16686:16686"    # UI
    - "4318:4318"      # OTLP HTTP
```

### Análisis de traces

**Buscar traces por operación:**
1. Service: `auth-api-service`
2. Operation: `POST /auth/login`
3. Tags: `http.status_code=200`

**Filtros útiles:**
- `error=true`: Solo traces con errores
- `duration>500ms`: Operaciones lentas
- `user.id=123`: Todas las operaciones de un usuario específico

## Métricas observables

### Duración de operaciones

```
bcrypt.hashSync:     ~650ms (creación usuario)
bcrypt.compareSync:  ~780ms (login)
jwt.sign:            ~8ms
jwt.verify:          ~10ms
MySQL INSERT:        ~45ms
MySQL SELECT:        ~30ms
```

### Detección de anomalías

- bcrypt > 1000ms: Posible ataque de timing
- jwt.verify falla consecutivamente: Intento de fuerza bruta
- MySQL > 200ms: Query no optimizado o índice faltante

## Limitaciones del patrón en monolito

### No simula latencia de red

En microservicios, cada salto HTTP añade ~10-50ms. El monolito tiene latencia cero entre "servicios".

### Shared resources

Todos los componentes comparten:
- Pool de conexiones DB
- Memoria
- Event loop de Node.js

Un componente lento afecta a todos, a diferencia de microservicios aislados.

### Single point of failure

Si el proceso cae, todo el "sistema" cae. No hay resiliencia de microservicios independientes.

## Migración a microservicios

Este proyecto facilita la transición:

1. **Identificar límites:** Los spans manuales marcan candidatos a servicios
2. **Medir impacto:** Añadir latencia simulada (50ms) a cada span para proyectar rendimiento
3. **Extraer servicio:** El código ya está estructurado con trazabilidad
4. **Mantener observabilidad:** La configuración de OpenTelemetry se mantiene igual

## Instalación y ejecución

```bash
# Levantar stack completo
docker-compose up --build

# Aplicación: http://localhost:3000
# Jaeger UI: http://localhost:16686
```

### Variables de entorno requeridas

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318
DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=database_name
PORT=3000
SECRET_JWT=secret_key
SALTOS_BCRYPT=10
```
