// Módulos de facturación y de cierre de caja con reporte de ventas diario.
import { siguienteId, fechaLocal } from "../db/storage.js";
import { IMPUESTO_CONSUMO } from "../db/seed.js";

export const METODOS_PAGO = ["efectivo", "tarjeta", "transferencia"];

export function facturarPedido(db, pedidoId, metodoPago) {
  const p = db.pedidos.find((x) => x.id === pedidoId);
  if (!p) throw new Error("Pedido no encontrado");
  if (p.estado !== "entregado") throw new Error("Solo se facturan pedidos entregados");
  if (p.facturaId) throw new Error("El pedido ya está facturado");
  if (!METODOS_PAGO.includes(metodoPago)) throw new Error("Método de pago no válido");
  const fecha = new Date().toISOString();
  const dia = fechaLocal();
  if (db.cierresCaja.some((c) => c.fecha === dia)) throw new Error("La caja de hoy ya está cerrada");
  const base = p.total;
  const impuesto = Math.round(base * IMPUESTO_CONSUMO);
  const id = siguienteId(db, "factura");
  const factura = {
    id,
    numero: `FV-${String(id).padStart(5, "0")}`,
    pedidoId,
    lineas: p.lineas,
    base,
    impuesto,
    total: base + impuesto,
    metodoPago,
    fecha,
    dia,
  };
  db.facturas.push(factura);
  p.facturaId = id;
  return factura;
}

export function reporteDiario(db, fecha) {
  const facturas = db.facturas.filter((f) => f.dia === fecha);
  const porMetodo = Object.fromEntries(METODOS_PAGO.map((m) => [m, 0]));
  const porPlato = {};
  for (const f of facturas) {
    porMetodo[f.metodoPago] += f.total;
    for (const l of f.lineas) {
      porPlato[l.nombre] ??= { nombre: l.nombre, cantidad: 0, valor: 0 };
      porPlato[l.nombre].cantidad += l.cantidad;
      porPlato[l.nombre].valor += l.subtotal;
    }
  }
  const pedidosDelDia = db.pedidos.filter((p) => p.dia === fecha);
  return {
    fecha,
    numFacturas: facturas.length,
    base: facturas.reduce((s, f) => s + f.base, 0),
    impuesto: facturas.reduce((s, f) => s + f.impuesto, 0),
    total: facturas.reduce((s, f) => s + f.total, 0),
    porMetodo,
    platosMasVendidos: Object.values(porPlato).sort((a, b) => b.cantidad - a.cantidad),
    pedidosSinFacturar: pedidosDelDia.filter((p) => !p.facturaId && p.estado !== "cancelado").length,
    pedidosCancelados: pedidosDelDia.filter((p) => p.estado === "cancelado").length,
  };
}

export function cerrarCaja(db, fecha, usuarioId, efectivoContado) {
  if (db.cierresCaja.some((c) => c.fecha === fecha)) throw new Error("La caja de esa fecha ya fue cerrada");
  const reporte = reporteDiario(db, fecha);
  const contado = Number(efectivoContado) || 0;
  const cierre = {
    id: siguienteId(db, "cierre"),
    fecha,
    usuarioId,
    reporte,
    efectivoEsperado: reporte.porMetodo.efectivo,
    efectivoContado: contado,
    diferencia: contado - reporte.porMetodo.efectivo,
    registrado: new Date().toISOString(),
  };
  db.cierresCaja.push(cierre);
  return cierre;
}

export const pesos = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
