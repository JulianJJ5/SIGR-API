# API REST del SIGR (v1.2.0)

API en Node.js con Express. Guarda los datos **en memoria**: al reiniciar el servidor vuelven los datos iniciales (8 platos, 4 categorías y 5 mesas; sin reservas ni pedidos).

## Ejecutar

```bash
npm install
npm run api          # http://localhost:3200/api
```

- **CORS activado:** la página en desarrollo (`npm run dev`, puerto 5173) puede llamar a la API.
- **Página compilada:** si existe `dist/` (`npm run build`), la API también sirve la página en `http://localhost:3200`.
- **Dirección de la API en la página:** está en una sola constante, `API_URL` de `src/api.js`.
- **Sin API:** si la API no responde, la página trabaja en modo local y lo indica en la barra superior.

## Rutas

| Método | Ruta | Qué hace | Códigos |
|---|---|---|---|
| GET | `/api/menu` | Categorías y platos: `{ categorias, platos }` | 200 |
| POST | `/api/menu` | Crea un plato | 201, 400 |
| PUT | `/api/menu/:id` | Edita un plato | 200, 400, 404 |
| DELETE | `/api/menu/:id` | Elimina un plato | 200, 404 |
| POST | `/api/categorias` | Crea una categoría | 201, 400, 409 |
| PUT | `/api/categorias/:id` | Renombra una categoría | 200, 400, 404 |
| DELETE | `/api/categorias/:id` | Elimina una categoría sin platos | 200, 404, 409 |
| GET | `/api/reservas?fecha=AAAA-MM-DD` | Lista de reservas (filtro opcional) | 200 |
| POST | `/api/reservas` | Crea una reserva y asigna la mesa más pequeña libre | 201, 400, 409 |
| PATCH | `/api/reservas/:id` | Cambia el estado: `pendiente`, `confirmada` o `cancelada` | 200, 400, 404, 409 |
| GET | `/api/pedidos?estado=…` | Lista de pedidos (filtro opcional) | 200 |
| GET | `/api/pedidos/:id` | Un pedido | 200, 404 |
| POST | `/api/pedidos` | Crea un pedido | 201, 400, 409 |
| PATCH | `/api/pedidos/:id` | Cambia el estado al siguiente del flujo o a `cancelado` | 200, 400, 404, 409 |
| POST | `/api/reset` | Vuelve a los datos iniciales (solo para pruebas) | 200 |

## Cuerpos de ejemplo

```json
POST /api/menu       { "nombre": "Sancocho", "precio": 25000, "categoriaId": 2, "descripcion": "De gallina", "disponible": true }
POST /api/reservas   { "nombreCliente": "Familia Pérez", "telefono": "3001234567", "fecha": "2026-11-20", "hora": "19:00", "personas": 4 }
POST /api/pedidos    { "items": [{ "platoId": 3, "cantidad": 2 }], "mesaId": 2, "observaciones": "Sin cebolla" }
PATCH /api/pedidos/1 { "estado": "en preparación" }
```

## Errores

Todos los errores responden en JSON con el mismo formato:

```json
{ "error": "Los datos no son válidos", "campos": { "precio": "El precio debe ser mayor que 0" } }
```

| Código | Cuándo |
|---|---|
| 400 | Datos no válidos (campo por campo en `campos`) o cuerpo que no es JSON |
| 404 | El recurso o la ruta no existe |
| 409 | Conflicto con el estado actual: no hay mesa libre en esa franja, plato no disponible, salto de estado en un pedido, categoría con platos o nombre repetido |

## Reglas que valida

Son las mismas del SIGR:
- **Platos:** precio mayor que 0 y categoría existente.
- **Reservas:** de 12:00 a 22:00, con la última a las 21:00; sin fechas pasadas. Cada reserva ocupa la mesa 2 horas y se asigna la mesa más pequeña libre.
- **Pedidos:** siguen el flujo `recibido → en preparación → listo → entregado`, sin saltos.

## Pruebas

`npm test` ejecuta las pruebas de la lógica y las de la API (`tests/api.test.js`), que levantan el servidor en un puerto libre.
