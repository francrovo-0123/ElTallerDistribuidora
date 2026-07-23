// Configuración Supabase (un solo cliente por página)
const SUPABASE_URL = (window.ELTALLER_SUPABASE && window.ELTALLER_SUPABASE.url) || 'https://fmtgtznlidnhoxkffvmh.supabase.co';
const SUPABASE_KEY = (window.ELTALLER_SUPABASE && window.ELTALLER_SUPABASE.anonKey) || '';
const db = window.db || supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.db = db;

const CAT_LINK_BASE = 'cat-link hover:text-black transition py-1 px-2';
const CAT_LINK_ACTIVO = 'cat-link border-2 border-black rounded px-3 py-1 text-black font-extrabold shadow-sm';

const NAV_ITEMS = [
  { slug: 'index', href: 'index.html', label: 'INICIO' },
  { slug: 'exclusivos', href: 'exclusivos.html', label: 'EXCLUSIVOS' },
  { slug: 'torpedos', href: 'torpedos.html', label: 'TORPEDOS' },
  { slug: 'camioneros', href: 'camioneros.html', label: 'CAMIONEROS' },
  { slug: 'imperiales', href: 'imperiales.html', label: 'IMPERIALES' },
  { slug: 'bombillas', href: 'bombillas.html', label: 'BOMBILLAS' },
  { slug: 'accesorios', href: 'accesorios.html', label: 'ACCESORIOS' },
  { slug: 'termos', href: 'termos.html', label: 'TERMOS' },
  { slug: 'regalos-empresariales', href: 'regalos-empresariales.html', label: 'REGALOS EMPRESARIALES' }
];

// Categoría según la página (variable en el HTML o nombre del archivo)
const pagina = window.PAGINA_CATEGORIA || null;
const CATEGORIA_ACTUAL = window.CATEGORIA_ACTUAL
  || pagina?.nombre
  || detectarCategoriaPorArchivo();

const ES_EXCLUSIVOS = (pagina?.filtro === 'exclusivos')
  || CATEGORIA_ACTUAL.toLowerCase() === 'exclusivos';

let listaProductosCategoria = [];
let productosLookup = {};
let carrito = [];
let cuponAplicado = null;

function detectarCategoriaPorArchivo() {
  const archivo = (window.location.pathname.split('/').pop() || '').replace('.html', '');
  if (!archivo || archivo === 'index') return 'Camioneros';
  return archivo.charAt(0).toUpperCase() + archivo.slice(1);
}

function slugActivo() {
  if (pagina?.slug) return pagina.slug;
  const archivo = (window.location.pathname.split('/').pop() || '').replace('.html', '');
  return archivo || 'camioneros';
}

function renderNavCategorias() {
  const menu = document.getElementById('menu-categorias');
  if (!menu) return;

  const activo = slugActivo();
  menu.innerHTML = NAV_ITEMS.map(item => `
    <a href="${item.href}" class="${item.slug === activo ? CAT_LINK_ACTIVO : CAT_LINK_BASE}">
      ${item.label}
    </a>
  `).join('');
}

async function cargarProductosPorCategoria() {
  const tituloEl = document.getElementById('titulo-categoria');
  const contadorEl = document.getElementById('contador-productos');

  if (tituloEl) {
    tituloEl.textContent = pagina?.titulo || (ES_EXCLUSIVOS ? 'Exclusivos' : `Mates ${CATEGORIA_ACTUAL}`);
  }

  let query = db.from('productos').select('*');

  if (ES_EXCLUSIVOS) {
    query = query.eq('exclusivo', true);
  } else {
    // Coincidencia flexible por columna categoria
    query = query.ilike('categoria', `%${CATEGORIA_ACTUAL}%`);
  }

  const { data: productos, error } = await query;

  if (error) {
    console.error('Error cargando categoría:', error);
    if (contadorEl) contadorEl.innerText = 'Error al cargar';
    const grilla = document.getElementById('grilla-productos');
    if (grilla) {
      grilla.innerHTML = `<p class="col-span-full text-center text-red-500 py-12 text-xs font-medium">Error al cargar productos.</p>`;
    }
    return;
  }

  listaProductosCategoria = productos || [];
  listaProductosCategoria.forEach(p => {
    if (p && p.id != null) productosLookup[p.id] = p;
  });

  if (contadorEl) {
    const n = listaProductosCategoria.length;
    contadorEl.innerText = n === 1 ? '1 producto encontrado' : `${n} productos encontrados`;
  }

  ordenarProductos();
}

function renderizarGrilla(productos) {
  const grilla = document.getElementById('grilla-productos');
  if (!grilla) return;
  grilla.innerHTML = '';

  if (!productos.length) {
    grilla.innerHTML = `<p class="col-span-full text-center text-gray-400 py-12 text-xs font-medium">No hay productos disponibles en esta categoría.</p>`;
    return;
  }

  productos.forEach(prod => {
    const esc = window.escapeHtml || ((v) => String(v ?? ''));
    const imgOk = window.safeUrl
      ? window.safeUrl(prod.img || prod.imagen_url, 'https://via.placeholder.com/300')
      : (prod.img || prod.imagen_url || 'https://via.placeholder.com/300');
    const nombre = esc(prod.titulo || prod.nombre || 'Producto');
    const precio = Number(prod.precio) || 0;
    const sinStock = Number(prod.stock) <= 0;
    const idNum = Number(prod.id);

    const cardHTML = `
      <div class="et-card bg-white rounded-xl border border-gray-200 overflow-hidden group flex flex-col justify-between">
        <a href="producto.html?id=${idNum}" class="relative overflow-hidden aspect-square bg-gray-100 block">
          <img src="${esc(imgOk)}" alt="${nombre}" class="w-full h-full object-cover">
          ${prod.exclusivo ? '<span class="absolute top-3 left-3 bg-taller text-white text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">Exclusivo</span>' : ''}
        </a>

        <div class="p-4 flex flex-col justify-between flex-grow">
          <div>
            <h3 class="font-bold text-gray-900 text-xs line-clamp-2">
              <a href="producto.html?id=${idNum}" class="hover:text-taller-dark transition">${nombre}</a>
            </h3>
          </div>

          <div class="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span class="text-sm font-black text-gray-900">$ ${precio.toLocaleString('es-AR')}</span>
            <button
              type="button"
              onclick="agregarAlCarrito(${idNum})"
              ${sinStock ? 'disabled' : ''}
              class="et-press w-11 h-11 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
              aria-label="Agregar al carrito">
              <i class="fa-solid fa-plus text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    grilla.insertAdjacentHTML('beforeend', cardHTML);
  });

  if (window.ElTallerMotion) {
    window.ElTallerMotion.staggerChildren(grilla, '.et-card');
  }
}

function ordenarProductos() {
  const select = document.getElementById('ordenar-precio');
  const criterio = select ? select.value : 'recientes';
  const inputBusqueda = document.getElementById('input-busqueda')
    || document.getElementById('input-busqueda-desktop')
    || document.getElementById('input-busqueda-mobile');
  const q = (inputBusqueda?.value || '').trim().toLowerCase();
  filtrarGrillaPorTexto(q, criterio);
}

function filtrarGrillaPorTexto(query, criterioOverride) {
  const q = (query || '').toLowerCase().trim();
  const select = document.getElementById('ordenar-precio');
  const criterio = criterioOverride || (select ? select.value : 'recientes');

  let ordenados = [...listaProductosCategoria];

  if (q) {
    ordenados = ordenados.filter((p) => {
      const titulo = (p.titulo || p.nombre || '').toLowerCase();
      const categoria = (p.categoria || '').toLowerCase();
      return titulo.includes(q) || categoria.includes(q);
    });
  }

  if (criterio === 'menor-precio') {
    ordenados.sort((a, b) => Number(a.precio) - Number(b.precio));
  } else if (criterio === 'mayor-precio') {
    ordenados.sort((a, b) => Number(b.precio) - Number(a.precio));
  } else {
    ordenados.sort((a, b) => Number(b.id) - Number(a.id));
  }

  renderizarGrilla(ordenados);

  const contadorEl = document.getElementById('contador-productos');
  if (contadorEl) {
    const n = ordenados.length;
    contadorEl.innerText = n === 1 ? '1 producto encontrado' : `${n} productos encontrados`;
  }
}

// --- Carrito (compartido con index vía localStorage) ---

function agregarAlCarrito(id) {
  const prod = productosLookup[id] || listaProductosCategoria.find(p => p.id === id);
  if (!prod) return;

  const itemEnCarrito = carrito.find(item => item.id === id);
  if (itemEnCarrito) {
    if (itemEnCarrito.cantidad < Number(prod.stock)) {
      itemEnCarrito.cantidad++;
    } else {
      alert('Alcanzaste el límite de stock disponible para este producto.');
    }
  } else {
    carrito.push({
      id: prod.id,
      titulo: prod.titulo || prod.nombre,
      precio: prod.precio,
      cantidad: 1,
      img: prod.img || prod.imagen_url || null
    });
  }

  actualizarCarrito();
  if (window.ElTallerMotion) {
    window.ElTallerMotion.toast('¡Agregado al carrito!', 'success');
  }
}

function guardarCarritoLocal() {
  try {
    localStorage.setItem('eltaller_carrito', JSON.stringify(carrito));
    localStorage.setItem('carrito_items', JSON.stringify(carrito));
    localStorage.setItem(
      'eltaller_cupon',
      cuponAplicado?.codigo
        ? JSON.stringify({ codigo: cuponAplicado.codigo, tipo: cuponAplicado.tipo, valor: cuponAplicado.valor })
        : ''
    );
  } catch (e) {
    console.error('No se pudo guardar el carrito:', e);
  }
}

function cargarCarritoLocal() {
  try {
    const raw = localStorage.getItem('eltaller_carrito');
    carrito = raw ? JSON.parse(raw) : [];
    const rawCupon = localStorage.getItem('eltaller_cupon');
    const guardado = rawCupon ? JSON.parse(rawCupon) : null;
    cuponAplicado = null;
    if (guardado?.codigo) {
      db.rpc('validar_cupon', { p_codigo: String(guardado.codigo) }).then(({ data }) => {
        if (data?.ok) {
          cuponAplicado = { codigo: data.codigo, tipo: data.tipo, valor: Number(data.valor) || 0 };
        } else {
          localStorage.removeItem('eltaller_cupon');
        }
        actualizarTotalesCarrito();
        guardarCarritoLocal();
      }).catch(() => {});
    }
  } catch (e) {
    carrito = [];
    cuponAplicado = null;
  }
}

function irAlCheckout() {
  if (carrito.length === 0) {
    alert('Agregá al menos un producto al carrito antes de continuar.');
    return;
  }
  guardarCarritoLocal();
  window.location.href = 'checkout.html';
}

function cambiarCantidad(id, cambio) {
  const item = carrito.find(i => i.id === id);
  if (!item) return;

  const prod = productosLookup[id] || listaProductosCategoria.find(p => p.id === id);
  item.cantidad += cambio;

  if (item.cantidad <= 0) {
    carrito = carrito.filter(i => i.id !== id);
  } else if (prod && item.cantidad > Number(prod.stock)) {
    item.cantidad = Number(prod.stock);
    alert('Alcanzaste el límite de stock disponible.');
  }

  actualizarCarrito();
}

function actualizarCarrito() {
  const count = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  if (window.ElTallerMotion) {
    window.ElTallerMotion.updateCartBadge(count);
  } else {
    const cartCountEl = document.getElementById('carrito-contador') || document.getElementById('cart-count');
    if (cartCountEl) {
      cartCountEl.innerText = count;
      cartCountEl.classList.toggle('hidden', count === 0);
    }
  }

  actualizarTotalesCarrito();
  guardarCarritoLocal();

  const itemsEl = document.getElementById('items-carrito');
  if (!itemsEl) return;

  if (carrito.length === 0) {
    itemsEl.innerHTML = `<p class="text-gray-400 text-center py-6">El carrito está vacío.</p>`;
  } else {
    const esc = window.escapeHtml || ((v) => String(v ?? ''));
    itemsEl.innerHTML = carrito.map(item => `
      <div class="et-row-enter flex justify-between items-center border-b pb-3">
        <div>
          <p class="font-semibold text-gray-800 text-sm">${esc(item.titulo)}</p>
          <p class="text-xs text-gray-500">$${Number(item.precio).toLocaleString('es-AR')} c/u</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="cambiarCantidad(${Number(item.id)}, -1)" class="et-press w-6 h-6 bg-gray-200 rounded font-bold hover:bg-gray-300 flex items-center justify-center">-</button>
          <span class="text-sm font-bold w-4 text-center">${esc(item.cantidad)}</span>
          <button onclick="cambiarCantidad(${Number(item.id)}, 1)" class="et-press w-6 h-6 bg-gray-200 rounded font-bold hover:bg-gray-300 flex items-center justify-center">+</button>
        </div>
      </div>
    `).join('');
  }
}

function actualizarTotalesCarrito() {
  let subtotal = carrito.reduce((acc, prod) => acc + (prod.precio * prod.cantidad), 0);
  let descuento = 0;

  if (cuponAplicado) {
    if (cuponAplicado.tipo === 'porcentaje') {
      descuento = (subtotal * Number(cuponAplicado.valor)) / 100;
    } else {
      descuento = Number(cuponAplicado.valor);
    }
  }

  const totalFinal = Math.max(0, subtotal - descuento);
  const elSub = document.getElementById('cart-subtotal');
  const elDesc = document.getElementById('cart-descuento');
  const elTotal = document.getElementById('cart-total');

  if (elSub) elSub.innerText = `$${subtotal.toLocaleString('es-AR')}`;
  if (elDesc) elDesc.innerText = `-$${descuento.toLocaleString('es-AR')}`;
  if (elTotal) elTotal.innerText = `$${totalFinal.toLocaleString('es-AR')}`;
}

async function validarYAplicarCupon() {
  const input = document.getElementById('input-cupon');
  const codigo = (input?.value || '').trim().toUpperCase();

  if (!codigo) {
    mostrarMensajeCupon('Por favor ingresá un código.', 'text-red-600');
    return;
  }

  const { data, error } = await db.rpc('validar_cupon', { p_codigo: codigo });

  if (error || !data?.ok) {
    cuponAplicado = null;
    mostrarMensajeCupon(data?.error || 'El código de cupón no es válido.', 'text-red-600');
    actualizarTotalesCarrito();
    return;
  }

  cuponAplicado = {
    codigo: data.codigo,
    tipo: data.tipo,
    valor: Number(data.valor) || 0
  };
  const descTexto = cuponAplicado.tipo === 'porcentaje'
    ? `${cuponAplicado.valor}%`
    : `$${Number(cuponAplicado.valor).toLocaleString('es-AR')}`;
  mostrarMensajeCupon(`¡Genial! Cupón del ${descTexto} aplicado correctamente.`, 'text-green-600 font-bold');
  actualizarTotalesCarrito();
  guardarCarritoLocal();
}

function mostrarMensajeCupon(texto, claseColor) {
  const msg = document.getElementById('msg-cupon');
  if (!msg) return;
  msg.className = `text-[11px] mt-1.5 et-state-flash ${claseColor}`;
  msg.innerText = texto;
  msg.classList.remove('hidden');
}

function toggleCarrito() {
  if (window.ElTallerMotion) {
    window.ElTallerMotion.toggleCartDrawer();
    return;
  }
  document.getElementById('modal-carrito')?.classList.toggle('hidden');
}

function toggleMenuMobile() {
  const menu = document.getElementById('menu-mobile');
  menu.classList.toggle('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavCategorias();
  cargarCarritoLocal();
  actualizarCarrito();
  cargarProductosPorCategoria();
});
