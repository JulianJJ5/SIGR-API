<script setup>
import { ref, reactive, computed } from "vue";
import { db, sesion, mutar, apiDisponible, enviar, ponerEn } from "../store.js";
import { api } from "../api.js";
import { rutaImagen } from "../db/storage.js";
import * as menu from "../services/menu.js";
import { crearPedido } from "../services/pedidos.js";
import { pesos } from "../services/caja.js";

const emit = defineEmits(["ir"]);
const esAdmin = computed(() => sesion.value.rol === "administrador");
const categorias = computed(() => menu.menuPorCategoria(db, !esAdmin.value));

// ----- Carrito para crear pedidos -----
const carrito = reactive({});
const mesaId = ref("");
const observaciones = ref("");
const lineasCarrito = computed(() =>
  Object.entries(carrito)
    .filter(([, c]) => c > 0)
    .map(([id, cantidad]) => {
      const p = db.platos.find((x) => x.id === Number(id));
      return { platoId: p.id, nombre: p.nombre, cantidad, subtotal: p.precio * cantidad };
    })
);
const totalCarrito = computed(() => lineasCarrito.value.reduce((s, l) => s + l.subtotal, 0));
const agregar = (p) => (carrito[p.id] = (carrito[p.id] || 0) + 1);
const quitar = (p) => (carrito[p.id] = Math.max(0, (carrito[p.id] || 0) - 1));

function enviarPedido() {
  const pedido = mutar(
    (d) => crearPedido(d, {
      items: lineasCarrito.value.map(({ platoId, cantidad }) => ({ platoId, cantidad })),
      mesaId: mesaId.value ? Number(mesaId.value) : null,
      usuarioId: sesion.value.id,
      observaciones: observaciones.value,
    }),
    "Pedido enviado a cocina"
  );
  if (pedido) {
    Object.keys(carrito).forEach((k) => delete carrito[k]);
    observaciones.value = "";
    emit("ir", "pedidos");
  }
}

// ----- CRUD (administrador) -----
// Con la API activa, los cambios del menú se envían al servidor con fetch; sin API, se guardan solo en local.
const nuevaCategoria = ref("");
const vacio = { id: null, nombre: "", descripcion: "", precio: "", categoriaId: "", disponible: true, imagen: "" };
const formPlato = reactive({ ...vacio });
const errores = ref({});
function limpiarPlato() { Object.assign(formPlato, vacio); errores.value = {}; }
function editar(p) { Object.assign(formPlato, { ...p }); errores.value = {}; window.scrollTo({ top: 0, behavior: "smooth" }); }

const cuerpoPlato = () => ({
  nombre: formPlato.nombre,
  descripcion: formPlato.descripcion,
  precio: formPlato.precio === "" ? null : Number(formPlato.precio),
  categoriaId: formPlato.categoriaId === "" ? null : Number(formPlato.categoriaId),
  disponible: formPlato.disponible,
  imagen: formPlato.imagen,
});

async function guardarPlato() {
  if (!apiDisponible.value) {
    const ok = formPlato.id
      ? mutar((d) => menu.editarPlato(d, formPlato.id, formPlato), "Plato actualizado (modo local)")
      : mutar((d) => menu.crearPlato(d, formPlato), "Plato creado (modo local)");
    if (ok) limpiarPlato();
    return;
  }
  const r = formPlato.id
    ? await enviar(() => api("PUT", `/menu/${formPlato.id}`, cuerpoPlato()), (d, p) => ponerEn(d.platos, p), "Plato actualizado")
    : await enviar(() => api("POST", "/menu", cuerpoPlato()), (d, p) => ponerEn(d.platos, p), "Plato creado");
  errores.value = r.campos;
  if (r.ok) limpiarPlato();
}

async function eliminarPlato(p) {
  if (!apiDisponible.value) return mutar((d) => menu.eliminarPlato(d, p.id), "Plato eliminado (modo local)");
  await enviar(() => api("DELETE", `/menu/${p.id}`), (d) => { d.platos = d.platos.filter((x) => x.id !== p.id); }, "Plato eliminado");
}

async function crearCategoria() {
  if (!apiDisponible.value) {
    if (mutar((d) => menu.crearCategoria(d, nuevaCategoria.value), "Categoría creada (modo local)")) nuevaCategoria.value = "";
    return;
  }
  const r = await enviar(() => api("POST", "/categorias", { nombre: nuevaCategoria.value }), (d, c) => ponerEn(d.categorias, c), "Categoría creada");
  if (r.ok) nuevaCategoria.value = "";
}

async function renombrar(c) {
  const nombre = prompt("Nuevo nombre de la categoría", c.nombre);
  if (!nombre) return;
  if (!apiDisponible.value) return mutar((d) => menu.editarCategoria(d, c.id, nombre), "Categoría actualizada (modo local)");
  await enviar(() => api("PUT", `/categorias/${c.id}`, { nombre }), (d, cat) => ponerEn(d.categorias, cat), "Categoría actualizada");
}

async function eliminarCategoria(c) {
  if (!apiDisponible.value) return mutar((d) => menu.eliminarCategoria(d, c.id), "Categoría eliminada (modo local)");
  await enviar(() => api("DELETE", `/categorias/${c.id}`), (d) => { d.categorias = d.categorias.filter((x) => x.id !== c.id); }, "Categoría eliminada");
}
</script>

<template>
  <div class="hero" :style="{ backgroundImage: `url(${rutaImagen('/img/hero.jpg')})` }">
    <div>
      <h2>Sabores de la casa</h2>
      <p>{{ esAdmin ? "Administre el menú: platos, precios, fotos y disponibilidad." : "Elija sus platos y envíe el pedido directo a la cocina." }}</p>
    </div>
  </div>
  <div class="dos-columnas">
    <section>
      <div v-if="esAdmin" class="tarjeta">
        <h3>{{ formPlato.id ? "Editar plato" : "Nuevo plato" }}</h3>
        <form class="rejilla" novalidate data-testid="form-plato" @submit.prevent="guardarPlato">
          <label>Nombre <input v-model="formPlato.nombre" name="nombre" data-testid="plato-nombre" required />
            <small v-if="errores.nombre" class="error-campo" data-testid="error-nombre">{{ errores.nombre }}</small></label>
          <label>Precio (COP) <input v-model="formPlato.precio" name="precio" type="number" min="1" data-testid="plato-precio" required />
            <small v-if="errores.precio" class="error-campo" data-testid="error-precio">{{ errores.precio }}</small></label>
          <label>Categoría
            <select v-model.number="formPlato.categoriaId" name="categoriaId" data-testid="plato-categoria" required>
              <option value="" disabled>Seleccione…</option>
              <option v-for="c in db.categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
            <small v-if="errores.categoriaId" class="error-campo" data-testid="error-categoriaId">{{ errores.categoriaId }}</small>
          </label>
          <label>Descripción <input v-model="formPlato.descripcion" name="descripcion" data-testid="plato-descripcion" /></label>
          <label>Imagen (URL o ruta /img/…) <input v-model="formPlato.imagen" placeholder="/img/empanadas.jpg" /></label>
          <label class="check"><input v-model="formPlato.disponible" type="checkbox" /> Disponible</label>
          <div class="fila">
            <button type="submit" data-testid="plato-guardar">{{ formPlato.id ? "Guardar cambios" : "Crear plato" }}</button>
            <button v-if="formPlato.id" type="button" class="secundario" @click="limpiarPlato">Cancelar</button>
          </div>
        </form>
        <h3>Categorías</h3>
        <form class="fila" @submit.prevent="crearCategoria">
          <input v-model="nuevaCategoria" placeholder="Nueva categoría" data-testid="categoria-nombre" />
          <button type="submit">Agregar</button>
        </form>
      </div>

      <div v-for="c in categorias" :key="c.id" class="tarjeta">
        <div class="fila entre">
          <h3>{{ c.nombre }}</h3>
          <div v-if="esAdmin" class="fila">
            <button class="mini secundario" @click="renombrar(c)">Renombrar</button>
            <button class="mini peligro" @click="eliminarCategoria(c)">Eliminar</button>
          </div>
        </div>
        <p v-if="!c.platos.length" class="nota">Sin platos.</p>
        <div v-for="p in c.platos" :key="p.id" class="plato" :class="{ apagado: !p.disponible }" :data-testid="`plato-${p.id}`">
          <img v-if="p.imagen" class="miniatura" :src="rutaImagen(p.imagen)" :alt="p.nombre" loading="lazy" />
          <div v-else class="miniatura vacia">🍽️</div>
          <div class="info-plato">
            <strong>{{ p.nombre }}</strong> <span v-if="!p.disponible" class="etiqueta">no disponible</span>
            <div class="nota">{{ p.descripcion }}</div>
          </div>
          <div class="fila">
            <span class="precio">{{ pesos(p.precio) }}</span>
            <template v-if="esAdmin">
              <button class="mini secundario" @click="editar(p)">Editar</button>
              <button class="mini peligro" @click="eliminarPlato(p)">Eliminar</button>
            </template>
            <template v-else>
              <button class="mini secundario" @click="quitar(p)">−</button>
              <span class="cantidad">{{ carrito[p.id] || 0 }}</span>
              <button class="mini" @click="agregar(p)">+</button>
            </template>
          </div>
        </div>
      </div>
    </section>

    <aside v-if="!esAdmin" class="tarjeta carrito">
      <h3>Pedido actual</h3>
      <p v-if="!lineasCarrito.length" class="nota">Agregue platos con el botón +.</p>
      <div v-for="l in lineasCarrito" :key="l.platoId" class="fila entre">
        <span>{{ l.cantidad }} × {{ l.nombre }}</span><span>{{ pesos(l.subtotal) }}</span>
      </div>
      <hr />
      <div class="fila entre total"><span>Total</span><span>{{ pesos(totalCarrito) }}</span></div>
      <label v-if="sesion.rol === 'mesero'">Mesa
        <select v-model="mesaId">
          <option value="">Para llevar</option>
          <option v-for="m in db.mesas" :key="m.id" :value="m.id">Mesa {{ m.numero }} ({{ m.capacidad }} pers.)</option>
        </select>
      </label>
      <label>Observaciones <input v-model="observaciones" placeholder="Sin cebolla, etc." /></label>
      <button :disabled="!lineasCarrito.length" @click="enviarPedido">Enviar pedido</button>
    </aside>
  </div>
</template>
