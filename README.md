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

## Partes del proyecto

El repositorio tiene dos aplicaciones independientes, cada una con su propio `package.json`:

| Carpeta | Qué es | Puerto |
|---|---|---|
| [`api/`](api/README.md) | API REST (Node.js + Express): menú, categorías, reservas y pedidos | 3200 |
| [`frontend/`](frontend/README.md) | Página web (Vue 3 + Vite) | 5173 |

## Clonar y ejecutar

```bash
git clone https://github.com/JulianJJ5/SIGR-API.git
cd SIGR-API
npm run instalar        # npm install en api/ y en frontend/
```

Luego, en **dos terminales**:

```bash
npm run api             # terminal 1: API en http://localhost:3200/api
npm run front           # terminal 2: página en http://localhost:5173
```

Primero la API y después la página (o recargue la página): al abrir, la página comprueba si la API responde. Si responde, arriba dice «API conectada» y el menú y las reservas se guardan en la API; si no, dice «Modo local (sin API)» y todo se guarda en el navegador.

Otros comandos (desde la raíz):

```bash
npm test                # pruebas de la API y del front
npm run build           # compila el front en frontend/dist/
```

Con el front compilado, la API también sirve la página en http://localhost:3200.

Cada parte se puede usar sola entrando a su carpeta (`cd api && npm start`, `cd frontend && npm run dev`). Rutas, códigos y formato de errores de la API: [api/README.md](api/README.md).

Versión publicada del front (sin API, si se activa GitHub Pages en el repositorio): https://julianjj5.github.io/SIGR-API/

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
├── package.json             scripts de conveniencia (instalar, api, front, test, build)
├── api/                     API REST
│   ├── package.json         express y cors
│   ├── src/
│   │   ├── index.js         arranque del servidor (puerto 3200)
│   │   ├── app.js           rutas y manejo de errores
│   │   ├── validacion.js    validación de los datos de entrada
│   │   └── negocio/         reglas de negocio (menú, reservas, pedidos) y datos iniciales
│   └── tests/               pruebas de integración de la API
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
