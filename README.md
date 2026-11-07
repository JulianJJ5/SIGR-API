# SIGR · Sistema Integral de Gestión de Restaurante

Aplicación web para gestionar pedidos, reservas, administración del menú, facturación, control de caja y reportes de ventas de un restaurante. Esta versión (**v1.0.0**) es la **línea base** del proyecto: el primer punto estable sobre el que se controlarán los cambios futuros.

> Prototipo académico (curso Gestión del Software, Unidad 2). No está pensado para producción: los datos se guardan en el navegador y las contraseñas no se cifran.

## Módulos incluidos en la línea base

| Módulo | Qué hace | Archivos principales |
|---|---|---|
| Autenticación y usuarios | Inicio de sesión con tres roles (cliente, mesero, administrador), permisos por rol, alta y desactivación de usuarios | `frontend/src/services/auth.js`, `frontend/src/components/LoginForm.vue`, `frontend/src/views/UsuariosView.vue` |
| Menú digital | CRUD de categorías y platos, disponibilidad, armado del pedido | `frontend/src/services/menu.js`, `frontend/src/views/MenuView.vue` |
| Pedidos | Registro y seguimiento por estados (recibido → en preparación → listo → entregado), cancelación, actualización entre pestañas | `frontend/src/services/pedidos.js`, `frontend/src/views/PedidosView.vue` |
| Reservas | Reservas por fecha y hora con asignación automática de mesa y control de cruces | `frontend/src/services/reservas.js`, `frontend/src/views/ReservasView.vue` |
| Facturación | Factura de venta por pedido entregado, impuesto al consumo del 8 %, método de pago | `frontend/src/services/caja.js`, `frontend/src/views/PedidosView.vue` |
| Caja y reportes | Reporte diario de ventas, platos más vendidos, cierre de caja con arqueo de efectivo, exportación CSV | `frontend/src/services/caja.js`, `frontend/src/views/CajaView.vue` |

## Requisitos

- Node.js 18 o superior y npm.
- Un navegador moderno (Chrome, Edge o Firefox).

## Esta rama: solo el front

Esta rama contiene únicamente la **página web** (carpeta [`frontend/`](frontend/README.md), Vue 3 + Vite). La API está en la rama [`solo-api`](https://github.com/JulianJJ5/SIGR-API/tree/solo-api).

```bash
git clone -b solo-frontend https://github.com/JulianJJ5/SIGR-API.git SIGR-API-frontend
cd SIGR-API-frontend/frontend
npm install
npm run dev             # http://localhost:5173
npm test                # pruebas de los servicios
npm run build           # compilación en frontend/dist/
```

Si la API (rama `solo-api`) está corriendo en `http://localhost:3200/api`, arriba aparece «API conectada» y el menú y las reservas se guardan allí; si no, la página trabaja en «Modo local (sin API)». La dirección está en `API_URL` (`frontend/src/api.js`).

## Usuarios de demostración

| Rol | Usuario | Contraseña | Ve |
|---|---|---|---|
| Administrador | `admin` | `admin123` | Menú (CRUD), pedidos, reservas, caja y reportes, usuarios |
| Mesero | `mesero` | `mesero123` | Menú, pedidos (con mesa), reservas |
| Cliente | `cliente` | `cliente123` | Menú, sus pedidos, sus reservas |

La pantalla de inicio tiene un botón por rol para entrar directamente.

## Estructura de carpetas

```
SIGR-API/
├── frontend/                página web
│   ├── package.json         vue y vite
│   ├── index.html           punto de entrada
│   ├── vite.config.js       configuración de Vite
│   ├── public/img/          fotos de los platos
│   ├── src/
│   │   ├── main.js          arranque de Vue
│   │   ├── App.vue          barra, pestañas por rol, estado de la API y avisos
│   │   ├── api.js           cliente de la API (API_URL)
│   │   ├── store.js         estado global, persistencia y sincronización con la API
│   │   ├── db/              seed.js (datos iniciales) y storage.js (localStorage)
│   │   ├── services/        lógica de negocio pura (auth, menu, pedidos, reservas, caja)
│   │   ├── components/      componentes reutilizables (LoginForm)
│   │   └── views/           una vista por módulo
│   └── tests/               pruebas de los servicios
└── docs/                    base de datos, manual de despliegue y acta de línea base
```

## Convenciones de código

- Nombres de variables, funciones y archivos en español, `camelCase` para funciones y `PascalCase` para componentes `.vue`.
- La lógica de negocio vive en `frontend/src/services/` como funciones puras que reciben la base de datos; las vistas solo llaman a esos servicios mediante `mutar()` de `src/store.js`.
- Ramas: `main` (estable), `develop` (integración) y `feature/<modulo>` para cada módulo.
- Mensajes de commit con prefijo: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.

## Documentación

- [Estructura de la base de datos](docs/BASE_DE_DATOS.md)
- [Manual de despliegue](docs/MANUAL_DESPLIEGUE.md)
- [Acta de línea base](docs/LINEA_BASE.md)
- [Historial de cambios](CHANGELOG.md)
- [Créditos de las imágenes](docs/CREDITOS_IMAGENES.md)

## Licencia

MIT. Ver [LICENSE.txt](LICENSE.txt).
