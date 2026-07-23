// --- CARRITO LITE UNIFICADO PARA PÁGINAS INSTITUCIONALES ---
// Compatible con index/categoria/checkout: mismas claves y campos (precio + aliases).

const CLAVE_CARRITO = 'eltaller_carrito';
const CLAVE_CARRITO_ALT = 'carrito_items';

function obtenerCarritoLite() {
  try {
    const raw =
      localStorage.getItem(CLAVE_CARRITO) ||
      localStorage.getItem(CLAVE_CARRITO_ALT) ||
      localStorage.getItem('carrito');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function guardarCarritoLite(carrito) {
  try {
    const json = JSON.stringify(carrito);
    localStorage.setItem(CLAVE_CARRITO, json);
    localStorage.setItem(CLAVE_CARRITO_ALT, json);
  } catch (e) {
    console.error('No se pudo guardar el carrito:', e);
  }
  actualizarContadorCarritoLite();
  renderizarModalCarritoLite();
}

function agregarAlCarritoLite(producto) {
  let carrito = obtenerCarritoLite();

  // Normalizamos para coincidir con la tienda principal
  const precio = Number(producto.valor ?? producto.precio ?? 0) || 0;
  const itemNormalizado = {
    id: producto.id || producto.codigo,
    titulo: producto.titulo || producto.nombre,
    precio: precio,
    valor: precio,
    img: producto.img || producto.imagen || producto.imagen_url || 'eltaller.png',
    tipo: producto.tipo || 'general',
    cantidad: Number(producto.cantidad) || 1
  };

  const index = carrito.findIndex((item) => String(item.id) === String(itemNormalizado.id));

  if (index > -1) {
    carrito[index].cantidad += itemNormalizado.cantidad;
  } else {
    carrito.push(itemNormalizado);
  }

  guardarCarritoLite(carrito);

  if (window.ElTallerMotion) {
    window.ElTallerMotion.toast('¡Producto agregado al carrito!', 'success');
  } else if (typeof mostrarNotificacionCarrito === 'function') {
    mostrarNotificacionCarrito('¡Producto agregado al carrito!');
  } else {
    alert('¡Producto agregado al carrito!');
  }
}

function actualizarContadorCarritoLite() {
  const carrito = obtenerCarritoLite();
  const totalItems = carrito.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);

  if (window.ElTallerMotion) {
    window.ElTallerMotion.updateCartBadge(totalItems);
    return;
  }

  const contadores = document.querySelectorAll('#carrito-contador, .carrito-contador-badge, #cart-count');
  contadores.forEach((el) => {
    el.innerText = totalItems;
    el.classList.toggle('hidden', totalItems === 0);
  });
}

function formatoPesoLite(n) {
  return '$' + Number(n || 0).toLocaleString('es-AR');
}

function precioItemLite(item) {
  return Number(item.precio ?? item.valor ?? 0) || 0;
}

function renderizarModalCarritoLite() {
  const carrito = obtenerCarritoLite();
  const itemsEl = document.getElementById('items-carrito');
  if (!itemsEl) return;
  const esc = window.escapeHtml || ((v) => String(v ?? ''));
  const imgSafe = (v) => (window.safeUrl ? window.safeUrl(v, 'eltaller.png') : (v || 'eltaller.png'));

  if (carrito.length === 0) {
    itemsEl.innerHTML = '<p class="text-gray-400 text-center py-6">El carrito está vacío.</p>';
  } else {
    itemsEl.innerHTML = carrito
      .map((item) => {
        const precio = precioItemLite(item);
        const idAttr = esc(String(item.id));
        return `
        <div class="et-row-enter flex gap-3 items-center border-b border-gray-100 pb-3">
          <img src="${esc(imgSafe(item.img || item.imagen))}" alt="" class="w-14 h-14 object-cover rounded-lg bg-gray-100">
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-gray-900 truncate">${esc(item.titulo || item.nombre || 'Producto')}</p>
            <p class="text-xs text-gray-500 mt-0.5">${formatoPesoLite(precio)}</p>
            <div class="flex items-center gap-2 mt-1.5">
              <button type="button" onclick="cambiarCantidad('${idAttr.replace(/'/g, '')}', -1)" class="w-6 h-6 rounded border text-xs">−</button>
              <span class="text-xs font-bold">${esc(item.cantidad)}</span>
              <button type="button" onclick="cambiarCantidad('${idAttr.replace(/'/g, '')}', 1)" class="w-6 h-6 rounded border text-xs">+</button>
            </div>
          </div>
        </div>`;
      })
      .join('');
  }

  const subtotal = carrito.reduce((acc, p) => acc + precioItemLite(p) * (Number(p.cantidad) || 0), 0);
  const elSub = document.getElementById('cart-subtotal');
  const elDesc = document.getElementById('cart-descuento');
  const elTot = document.getElementById('cart-total');
  if (elSub) elSub.textContent = formatoPesoLite(subtotal);
  if (elDesc) elDesc.textContent = '-' + formatoPesoLite(0);
  if (elTot) elTot.textContent = formatoPesoLite(subtotal);
}

function toggleCarrito() {
  if (window.ElTallerMotion) {
    window.ElTallerMotion.toggleCartDrawer();
    return;
  }
  document.getElementById('modal-carrito')?.classList.toggle('hidden');
}

function cambiarCantidad(id, cambio) {
  let carrito = obtenerCarritoLite();
  const item = carrito.find((i) => String(i.id) === String(id));
  if (!item) return;

  item.cantidad = (Number(item.cantidad) || 0) + Number(cambio);
  if (item.cantidad <= 0) {
    carrito = carrito.filter((i) => String(i.id) !== String(id));
  }

  guardarCarritoLite(carrito);
}

function irAlCheckout() {
  const carrito = obtenerCarritoLite();
  if (carrito.length === 0) {
    alert('Agregá al menos un producto al carrito antes de continuar.');
    return;
  }
  window.location.href = 'checkout.html';
}

function validarYAplicarCupon() {
  alert('Los cupones se aplican desde el catálogo o el checkout.');
}

// Ejecutar al cargar la página institucional
document.addEventListener('DOMContentLoaded', () => {
  actualizarContadorCarritoLite();
  renderizarModalCarritoLite();
});

window.obtenerCarritoLite = obtenerCarritoLite;
window.guardarCarritoLite = guardarCarritoLite;
window.agregarAlCarritoLite = agregarAlCarritoLite;
window.actualizarContadorCarritoLite = actualizarContadorCarritoLite;
window.toggleCarrito = toggleCarrito;
window.cambiarCantidad = cambiarCantidad;
window.irAlCheckout = irAlCheckout;
window.validarYAplicarCupon = validarYAplicarCupon;
