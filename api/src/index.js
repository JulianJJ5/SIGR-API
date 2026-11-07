// Arranca la API del SIGR: npm run api
import { crearApp } from "./app.js";

const PUERTO = Number(process.env.PORT) || 3200;

crearApp().listen(PUERTO, () => {
  console.log(`API del SIGR en http://localhost:${PUERTO}/api`);
});
