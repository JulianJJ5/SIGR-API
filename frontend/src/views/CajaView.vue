<script setup>
import { ref, computed } from "vue";
import { db, sesion, mutar } from "../store.js";
import { reporteDiario, cerrarCaja, pesos } from "../services/caja.js";
import { fechaLocal } from "../db/storage.js";

const fecha = ref(fechaLocal());
const efectivo = ref("");
const reporte = computed(() => reporteDiario(db, fecha.value));
const cierre = computed(() => db.cierresCaja.find((c) => c.fecha === fecha.value));
const facturasDia = computed(() => db.facturas.filter((f) => f.dia === fecha.value));

function cerrar() {
  if (reporte.value.pedidosSinFacturar && !confirm(`Hay ${reporte.value.pedidosSinFacturar} pedido(s) sin facturar. ¿Cerrar la caja de todos modos?`)) return;
  if (mutar((d) => cerrarCaja(d, fecha.value, sesion.value.id, efectivo.value), "Caja cerrada")) efectivo.value = "";
}

function exportarCSV() {
  const filas = [["Factura", "Fecha", "Pedido", "Método", "Base", "Impuesto", "Total"],
    ...facturasDia.value.map((f) => [f.numero, f.fecha, f.pedidoId, f.metodoPago, f.base, f.impuesto, f.total])];
  const blob = new Blob([filas.map((r) => r.join(";")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `ventas_${fecha.value}.csv`;
  a.click();
}
</script>

<template>
  <div class="fila entre">
    <h2>Caja y reporte de ventas</h2>
    <label class="fila">Fecha <input v-model="fecha" type="date" /></label>
  </div>

  <div class="indicadores">
    <div class="tarjeta"><div class="nota">Facturas</div><strong>{{ reporte.numFacturas }}</strong></div>
    <div class="tarjeta"><div class="nota">Subtotal</div><strong>{{ pesos(reporte.base) }}</strong></div>
    <div class="tarjeta"><div class="nota">Impuesto</div><strong>{{ pesos(reporte.impuesto) }}</strong></div>
    <div class="tarjeta"><div class="nota">Total vendido</div><strong>{{ pesos(reporte.total) }}</strong></div>
  </div>

  <div class="dos-columnas">
    <section class="tarjeta">
      <h3>Ventas por método de pago</h3>
      <div v-for="(v, m) in reporte.porMetodo" :key="m" class="fila entre"><span>{{ m }}</span><span>{{ pesos(v) }}</span></div>
      <h3>Platos más vendidos</h3>
      <p v-if="!reporte.platosMasVendidos.length" class="nota">Sin ventas en esta fecha.</p>
      <table v-else>
        <thead><tr><th>Plato</th><th>Cant.</th><th>Valor</th></tr></thead>
        <tbody><tr v-for="p in reporte.platosMasVendidos" :key="p.nombre"><td>{{ p.nombre }}</td><td>{{ p.cantidad }}</td><td>{{ pesos(p.valor) }}</td></tr></tbody>
      </table>
      <p class="nota">Pedidos sin facturar: {{ reporte.pedidosSinFacturar }} · cancelados: {{ reporte.pedidosCancelados }}</p>
      <button class="secundario" :disabled="!facturasDia.length" @click="exportarCSV">Exportar ventas (CSV)</button>
    </section>

    <section class="tarjeta">
      <h3>Cierre de caja</h3>
      <template v-if="cierre">
        <p>Caja cerrada el {{ new Date(cierre.registrado).toLocaleString("es-CO") }}</p>
        <div class="fila entre"><span>Efectivo esperado</span><span>{{ pesos(cierre.efectivoEsperado) }}</span></div>
        <div class="fila entre"><span>Efectivo contado</span><span>{{ pesos(cierre.efectivoContado) }}</span></div>
        <div class="fila entre total"><span>Diferencia</span><span :class="{ negativo: cierre.diferencia < 0 }">{{ pesos(cierre.diferencia) }}</span></div>
      </template>
      <form v-else class="rejilla" @submit.prevent="cerrar">
        <div class="fila entre"><span>Efectivo esperado</span><span>{{ pesos(reporte.porMetodo.efectivo) }}</span></div>
        <label>Efectivo contado en caja <input v-model="efectivo" type="number" min="0" required /></label>
        <button type="submit">Cerrar caja del día</button>
      </form>
      <h3>Historial de cierres</h3>
      <p v-if="!db.cierresCaja.length" class="nota">Aún no hay cierres.</p>
      <div v-for="c in [...db.cierresCaja].reverse()" :key="c.id" class="fila entre">
        <span>{{ c.fecha }}</span><span>{{ pesos(c.reporte.total) }}</span>
      </div>
    </section>
  </div>
</template>
