# SIGR · Front (Vue 3 + Vite)

Página web del SIGR. Funciona con la API de [`../api`](../api/README.md) o, si la API no está corriendo, en **modo local** (datos en el navegador).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas de los servicios (node --test)
npm run build      # compilación en dist/
npm run preview    # sirve dist/
```

- La dirección de la API está en una sola constante: `API_URL` en `src/api.js` (por defecto `http://localhost:3200/api`).
- Al cargar, la página comprueba la API (1,5 s de espera). La etiqueta de arriba indica «API conectada» o «Modo local (sin API)». Si arranca la API después, recargue la página.
- Los formularios de menú y reservas tienen atributos `data-testid` (por ejemplo `plato-nombre`, `reserva-enviar`, `error-hora`) pensados para las pruebas automatizadas con Selenium.
