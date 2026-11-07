// Fotos de los platos: Pexels (licencia libre), ver docs/CREDITOS_IMAGENES.md.
// Datos iniciales de la línea base (se cargan la primera vez que se abre la app).
// Las contraseñas van en texto plano a propósito: es un prototipo académico, no un sistema en producción.

export const IMPUESTO_CONSUMO = 0.08; // impuesto al consumo de restaurantes (8 %)

export function datosIniciales() {
  return {
    version: 1,
    usuarios: [
      { id: 1, nombre: "Administrador", usuario: "admin", clave: "admin123", rol: "administrador", activo: true },
      { id: 2, nombre: "Laura Gómez", usuario: "mesero", clave: "mesero123", rol: "mesero", activo: true },
      { id: 3, nombre: "Carlos Ruiz", usuario: "cliente", clave: "cliente123", rol: "cliente", activo: true },
    ],
    categorias: [
      { id: 1, nombre: "Entradas" },
      { id: 2, nombre: "Platos fuertes" },
      { id: 3, nombre: "Bebidas" },
      { id: 4, nombre: "Postres" },
    ],
    platos: [
      { id: 1, nombre: "Empanadas (3 und.)", descripcion: "Con ají de la casa", precio: 9000, categoriaId: 1, disponible: true, imagen: "/img/empanadas.jpg" },
      { id: 2, nombre: "Patacones con hogao", descripcion: "Plátano verde frito", precio: 11000, categoriaId: 1, disponible: true, imagen: "/img/patacones.jpg" },
      { id: 3, nombre: "Bandeja paisa", descripcion: "Fríjoles, arroz, carne, chicharrón, huevo y aguacate", precio: 32000, categoriaId: 2, disponible: true, imagen: "/img/bandeja-paisa.jpg" },
      { id: 4, nombre: "Ajiaco santafereño", descripcion: "Con pollo, alcaparras y crema", precio: 28000, categoriaId: 2, disponible: true, imagen: "/img/ajiaco.jpg" },
      { id: 5, nombre: "Pechuga a la plancha", descripcion: "Con ensalada y papas", precio: 26000, categoriaId: 2, disponible: true, imagen: "/img/pechuga.jpg" },
      { id: 6, nombre: "Limonada de coco", descripcion: "", precio: 9500, categoriaId: 3, disponible: true, imagen: "/img/limonada.jpg" },
      { id: 7, nombre: "Jugo natural", descripcion: "Mora, lulo o maracuyá", precio: 7000, categoriaId: 3, disponible: true, imagen: "/img/jugo.jpg" },
      { id: 8, nombre: "Postre de natas", descripcion: "", precio: 8500, categoriaId: 4, disponible: true, imagen: "/img/postre.jpg" },
    ],
    mesas: [
      { id: 1, numero: 1, capacidad: 2 },
      { id: 2, numero: 2, capacidad: 4 },
      { id: 3, numero: 3, capacidad: 4 },
      { id: 4, numero: 4, capacidad: 6 },
      { id: 5, numero: 5, capacidad: 8 },
    ],
    pedidos: [],
    reservas: [],
    facturas: [],
    cierresCaja: [],
    contadores: { pedido: 0, reserva: 0, factura: 0, cierre: 0, usuario: 3, categoria: 4, plato: 8 },
  };
}
