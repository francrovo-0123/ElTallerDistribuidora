// Configuración (supabase-config.js + security.js deben cargarse antes)
const SUPABASE_URL = (window.ELTALLER_SUPABASE && window.ELTALLER_SUPABASE.url) || 'https://fmtgtznlidnhoxkffvmh.supabase.co';
const SUPABASE_KEY = (window.ELTALLER_SUPABASE && window.ELTALLER_SUPABASE.anonKey) || '';
const db = window.db || supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.db = db;

const esc = (v) => (window.escapeHtml ? window.escapeHtml(v) : String(v ?? ''));
const safeImg = (v) => (window.safeUrl ? window.safeUrl(v, 'https://via.placeholder.com/50') : (v || 'https://via.placeholder.com/50'));

// TU NÚMERO DE WHATSAPP (código de país sin el + ni guiones)
const TELEFONO_VENDEDOR = '5492236872975';

/** Carrito local: solo id / cantidad / talle (lo demás lo resuelve el back) */
let carrito = [];
/** Solo código de cupón; tipo/valor vienen del servidor */
let codigoCupon = null;
/** Último preview oficial del servidor (precios, totales, stock) */
let previewServidor = null;

let metodoSeleccionado = 'transferencia';
let pasoActual = 1;
let datosEntrega = null;

function formatearPrecio(valor) {
  return `$ ${Number(valor).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Payload mínimo que viaja al back */
function itemsParaBackend(lista) {
  return (lista || []).map(item => ({
    id: item.id ?? null,
    cantidad: Math.max(1, Number(item.cantidad) || 1),
    talle: item.talle || null
  })).filter(i => i.id != null && String(i.id).trim() !== '');
}

function codigoCuponActual() {
  if (codigoCupon) return String(codigoCupon).trim().toUpperCase() || null;
  try {
    const raw = localStorage.getItem('eltaller_cupon');
    if (!raw) return null;
    // Soporta string plano o { codigo }
    if (raw.startsWith('{')) {
      const obj = JSON.parse(raw);
      return obj?.codigo ? String(obj.codigo).trim().toUpperCase() : null;
    }
    return String(raw).trim().toUpperCase() || null;
  } catch (_) {
    return null;
  }
}

/**
 * Toda la validación de montos/stock/cupón ocurre en el back (preview_pedido).
 * El front solo pinta lo que responde el servidor.
 */
async function refrescarDesdeServidor() {
  const items = itemsParaBackend(carrito);
  if (!items.length) {
    previewServidor = null;
    renderizarResumen();
    return null;
  }

  const { data, error } = await db.rpc('preview_pedido', {
    p_items: items,
    p_codigo_cupon: codigoCuponActual()
  });

  if (error) {
    console.error('preview_pedido:', error);
    previewServidor = { ok: false, error: error.message || 'No se pudo calcular el pedido.' };
    renderizarResumen();
    return previewServidor;
  }

  previewServidor = data;

  // Si el cupón falló, lo sacamos del estado local (los precios igual se muestran)
  if (data && !data.ok && /CUPON_INVALIDO/i.test(data.error || '')) {
    codigoCupon = null;
    localStorage.removeItem('eltaller_cupon');
    const input = document.getElementById('cupon-codigo') || document.getElementById('input-cupon');
    if (input) input.value = '';
    mostrarMensajeCupon(
      (data.error || '').replace(/^CUPON_INVALIDO:\s*/i, '') || 'Cupón inválido.',
      'text-red-600'
    );
    // Re-preview sin cupón para mostrar montos correctos
    const { data: data2 } = await db.rpc('preview_pedido', {
      p_items: items,
      p_codigo_cupon: null
    });
    if (data2?.ok) previewServidor = data2;
  } else if (data?.ok && data.cupon?.codigo) {
    codigoCupon = String(data.cupon.codigo);
    localStorage.setItem('eltaller_cupon', codigoCupon);
  }

  // Sincronizar carrito local con títulos/precios del servidor (solo para UI)
  if (previewServidor?.items?.length) {
    carrito = previewServidor.items.map(it => ({
      id: it.id,
      cantidad: it.cantidad,
      talle: it.talle || null,
      titulo: it.titulo,
      precio: it.precio,
      img: it.img || null
    }));
    try {
      localStorage.setItem('eltaller_carrito', JSON.stringify(
        carrito.map(({ id, cantidad, talle }) => ({ id, cantidad, talle }))
      ));
      localStorage.setItem('carrito_items', localStorage.getItem('eltaller_carrito'));
    } catch (_) {}
  }

  renderizarResumen();
  return previewServidor;
}

function renderizarResumen() {
  const lista = document.getElementById('resumen-items-lista');
  if (!lista) return;

  const items = previewServidor?.items?.length
    ? previewServidor.items
    : carrito;

  if (!items.length) {
    lista.innerHTML = `<p class="text-xs text-gray-400 text-center py-4">No hay productos en el carrito.</p>`;
  } else {
    lista.innerHTML = items.map(item => `
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-3 min-w-0">
          <img src="${esc(safeImg(item.img))}"
               alt="${esc(item.titulo || 'Producto')}"
               class="w-12 h-12 object-cover rounded bg-gray-100 flex-shrink-0">
          <div class="min-w-0">
            <p class="font-bold text-gray-900 truncate">${esc(item.titulo || 'Producto')}</p>
            <p class="text-gray-400 text-[11px]">Cant. ${esc(item.cantidad)}${item.talle ? ` · Talle ${esc(item.talle)}` : ''}</p>
          </div>
        </div>
        <span class="font-bold text-gray-900 whitespace-nowrap ml-2">${formatearPrecio(Number(item.precio || 0) * Number(item.cantidad || 1))}</span>
      </div>
    `).join('');
  }

  actualizarTotalesUI();
}

function actualizarTotalesUI() {
  const ok = previewServidor?.ok;
  const subtotal = ok ? Number(previewServidor.subtotal) || 0 : 0;
  const descuento = ok ? Number(previewServidor.descuento) || 0 : 0;
  const total = ok ? Number(previewServidor.total) || 0 : 0;

  const elSubtotal = document.getElementById('resumen-subtotal');
  if (elSubtotal) {
    elSubtotal.innerText = ok
      ? `$ ${subtotal.toLocaleString('es-AR')},00`
      : '—';
  }

  const filaDesc = document.getElementById('fila-descuento-cupon');
  if (filaDesc) {
    filaDesc.style.display = descuento > 0 ? 'flex' : 'none';
    const montoDesc = document.getElementById('monto-descuento-cupon');
    if (montoDesc) {
      montoDesc.innerText = `-$ ${descuento.toLocaleString('es-AR')},00`;
    }
  }

  const elEnvio = document.getElementById('resumen-envio');
  if (elEnvio) elEnvio.innerText = 'A coordinar';

  const elTotal = document.getElementById('resumen-total');
  if (elTotal) {
    elTotal.innerText = ok
      ? `$ ${total.toLocaleString('es-AR')},00`
      : '—';
  }

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setText('monto-transferencia-nuevo', ok ? formatearPrecio(total) : '—');
  const montoViejo = document.getElementById('monto-transferencia-viejo');
  if (montoViejo) montoViejo.classList.add('hidden');

  setText('conf-total', ok ? formatearPrecio(total) : '—');
  setText('conf-metodo', 'Transferencia Bancaria');

  if (previewServidor && !previewServidor.ok && previewServidor.error
      && !/CUPON_INVALIDO/i.test(previewServidor.error)) {
    const msg = document.getElementById('msg-cupon');
    // aviso de stock en resumen si no hay otro lugar
    console.warn(previewServidor.error);
  }
}

function recalcularTotalesConCupon() {
  return refrescarDesdeServidor();
}

function setStepper(paso) {
  for (let i = 1; i <= 3; i++) {
    const num = document.getElementById(`step-num-${i}`);
    const label = document.getElementById(`step-label-${i}`);
    if (!num || !label) continue;
    if (i <= paso) {
      num.className = 'w-6 h-6 rounded-full bg-black text-white flex items-center justify-center';
      label.className = 'text-black font-black';
    } else {
      num.className = 'w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-gray-400';
      label.className = 'text-gray-400';
    }
  }
}

function irAlPaso(paso) {
  if (paso > 1 && !datosEntrega) {
    alert('Completá primero los datos de entrega.');
    return;
  }

  pasoActual = paso;
  setStepper(paso);

  const contenido1 = document.getElementById('contenido-paso-1');
  const resumen1 = document.getElementById('resumen-paso-1');
  const btnEditar = document.getElementById('btn-editar-entrega');
  const bloque2 = document.getElementById('bloque-paso-2');
  const contenido2 = document.getElementById('contenido-paso-2');
  const bloque3 = document.getElementById('bloque-paso-3');
  const contenido3 = document.getElementById('contenido-paso-3');
  const paso2Badge = document.getElementById('paso2-badge');
  const paso2Titulo = document.getElementById('paso2-titulo');
  const paso3Badge = document.getElementById('paso3-badge');
  const paso3Titulo = document.getElementById('paso3-titulo');

  [bloque2, bloque3].forEach((el) => {
    if (el) el.classList.add('transition-opacity', 'duration-280', 'ease-premium');
  });

  function markEnter(el) {
    if (!el) return;
    el.classList.remove('et-section-enter');
    void el.offsetWidth;
    el.classList.add('et-section-enter');
  }

  if (paso === 1) {
    contenido1?.classList.remove('hidden');
    resumen1?.classList.add('hidden');
    btnEditar?.classList.add('hidden');
    markEnter(contenido1);
  } else if (datosEntrega) {
    contenido1?.classList.add('hidden');
    resumen1?.classList.remove('hidden');
    btnEditar?.classList.remove('hidden');
  }

  if (paso === 2) {
    bloque2?.classList.remove('opacity-50', 'pointer-events-none');
    contenido2?.classList.remove('hidden');
    markEnter(contenido2);
    if (paso2Badge) {
      paso2Badge.className = 'w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center et-state-flash';
      paso2Badge.innerText = '2';
    }
    if (paso2Titulo) paso2Titulo.className = 'font-extrabold text-sm tracking-wider uppercase text-gray-900';
  } else if (paso > 2) {
    bloque2?.classList.remove('opacity-50', 'pointer-events-none');
    contenido2?.classList.add('hidden');
    if (paso2Badge) {
      paso2Badge.className = 'w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center';
    }
    if (paso2Titulo) paso2Titulo.className = 'font-extrabold text-sm tracking-wider uppercase text-gray-900';
  } else {
    bloque2?.classList.add('opacity-50', 'pointer-events-none');
    contenido2?.classList.add('hidden');
    if (paso2Badge) {
      paso2Badge.className = 'w-6 h-6 rounded-full border border-gray-400 text-gray-500 text-xs font-bold flex items-center justify-center';
    }
    if (paso2Titulo) paso2Titulo.className = 'font-extrabold text-sm tracking-wider uppercase text-gray-500';
  }

  if (paso === 3) {
    bloque3?.classList.remove('opacity-50', 'pointer-events-none');
    contenido3?.classList.remove('hidden');
    markEnter(contenido3);
    if (paso3Badge) {
      paso3Badge.className = 'w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center et-state-flash';
    }
    if (paso3Titulo) paso3Titulo.className = 'font-extrabold text-sm tracking-wider uppercase text-gray-900';
    actualizarConfirmacion();
  } else {
    bloque3?.classList.add('opacity-50', 'pointer-events-none');
    contenido3?.classList.add('hidden');
    if (paso3Badge) {
      paso3Badge.className = 'w-6 h-6 rounded-full border border-gray-400 text-gray-500 text-xs font-bold flex items-center justify-center';
    }
    if (paso3Titulo) paso3Titulo.className = 'font-extrabold text-sm tracking-wider uppercase text-gray-500';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  refrescarDesdeServidor();
}

function guardarEntrega(e) {
  if (e) e.preventDefault();

  const trunc = (v, n) => (window.ElTallerSecurity ? window.ElTallerSecurity.truncate(v, n) : String(v || '').slice(0, n));
  const nombre = trunc(document.getElementById('cliente-nombre')?.value.trim(), 120);
  const telefono = trunc(document.getElementById('cliente-telefono')?.value.trim(), 40);
  const email = trunc(document.getElementById('cliente-email')?.value.trim(), 254);
  const direccion = trunc(document.getElementById('cliente-direccion')?.value.trim(), 400);
  const notas = trunc(document.getElementById('cliente-notas')?.value.trim(), 500);

  if (!nombre || !telefono || !direccion) {
    alert('Completá los campos obligatorios.');
    return;
  }

  if (email && window.ElTallerSecurity && !window.ElTallerSecurity.isValidEmail(email)) {
    alert('Ingresá un email válido o dejalo vacío.');
    return;
  }

  datosEntrega = { nombre, telefono, email, direccion, notas };

  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.innerText = v || '';
  };
  setText('resumen-nombre', nombre);
  setText('resumen-telefono', telefono);
  setText('resumen-direccion', direccion);
  setText('resumen-email', email || '');

  const emailUser = document.getElementById('checkout-email-user');
  if (emailUser) emailUser.innerText = email || nombre;

  try {
    localStorage.setItem('eltaller_checkout_entrega', JSON.stringify(datosEntrega));
    localStorage.setItem('datos_entrega_cliente', JSON.stringify(datosEntrega));
  } catch (_) {}

  irAlPaso(2);
}

function actualizarConfirmacion() {
  if (!datosEntrega) return;
  const confNombre = document.getElementById('conf-nombre');
  const confDir = document.getElementById('conf-direccion');
  if (confNombre) confNombre.innerText = datosEntrega.nombre || '';
  if (confDir) confDir.innerText = datosEntrega.direccion || '';
  actualizarTotalesUI();
}

window.aplicarCupon = async function () {
  const codigoInput = (document.getElementById('cupon-codigo') || document.getElementById('input-cupon'))?.value.trim().toUpperCase();

  if (!codigoInput) {
    mostrarMensajeCupon('Por favor, ingresá un código de cupón.', 'text-red-600');
    return;
  }

  codigoCupon = codigoInput;
  localStorage.setItem('eltaller_cupon', codigoCupon);

  const preview = await refrescarDesdeServidor();
  if (preview?.ok && preview.cupon?.codigo) {
    mostrarMensajeCupon(`¡Cupón "${preview.cupon.codigo}" aplicado con éxito!`, 'text-green-600 font-bold');
  } else if (preview && !preview.ok) {
    // refrescarDesdeServidor ya limpia cupón inválido
    if (!/CUPON_INVALIDO/i.test(preview.error || '')) {
      mostrarMensajeCupon(preview.error || 'No se pudo aplicar el cupón.', 'text-red-600');
    }
  }
};

async function validarYAplicarCupon() {
  return aplicarCupon();
}

function mostrarMensajeCupon(texto, claseColor) {
  const msg = document.getElementById('msg-cupon');
  if (!msg) return;
  msg.className = `text-[11px] mt-1.5 ${claseColor}`;
  msg.innerText = texto;
  msg.classList.remove('hidden');
}

function guardarEstadoLocal() {
  try {
    localStorage.setItem(
      'eltaller_carrito',
      JSON.stringify(itemsParaBackend(carrito))
    );
    localStorage.setItem('carrito_items', localStorage.getItem('eltaller_carrito'));
    localStorage.setItem('eltaller_cupon', codigoCuponActual() || '');
  } catch (_) {}
}

// Compra: el front solo manda ids + datos de entrega; el back valida todo
async function completarPedidoYWhatsApp() {
  const itemsCarrito = itemsParaBackend(
    (carrito && carrito.length)
      ? carrito
      : (JSON.parse(localStorage.getItem('eltaller_carrito') || localStorage.getItem('carrito_items') || '[]') || [])
  );

  const datosCliente = datosEntrega
    || JSON.parse(localStorage.getItem('eltaller_checkout_entrega') || localStorage.getItem('datos_entrega_cliente') || 'null');

  if (!datosCliente || !datosCliente.nombre) {
    alert('Completá primero los datos de entrega.');
    irAlPaso(1);
    return;
  }

  if (!itemsCarrito.length) {
    alert('Tu carrito está vacío.');
    window.location.href = 'index.html';
    return;
  }

  const btn = document.getElementById('btn-continuar-whatsapp') || document.getElementById('btn-confirmar-pedido');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Procesando...';
  }

  metodoSeleccionado = 'transferencia';

  const direccionCompleta = [
    datosCliente.direccion,
    datosCliente.localidad,
    datosCliente.cp ? `(${datosCliente.cp})` : '',
    datosCliente.provincia
  ].filter(Boolean).join(', ') || datosCliente.direccion;

  try {
    // Revalidar en servidor antes de confirmar (UX; la autoridad real es crear_pedido)
    const preview = await refrescarDesdeServidor();
    if (!preview?.ok) {
      alert(
        preview?.error
          ? `No se puede completar el pedido.\n\n${String(preview.error).replace(/^STOCK_INSUFICIENTE:\s*/i, '').replace(/^CUPON_INVALIDO:\s*/i, '')}`
          : 'No se puede completar el pedido. Revisá el carrito.'
      );
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-brands fa-whatsapp text-base text-green-400"></i> CONTINUAR A CONFIRMACIÓN';
      }
      return;
    }

    const { data: { session } } = await db.auth.getSession();
    const clienteEmail = session?.user?.email
      || (datosCliente.email && String(datosCliente.email).trim())
      || 'Invitado';
    const userId = session?.user?.id || null;

    const payload = {
      cliente_nombre: datosCliente.nombre,
      cliente_telefono: datosCliente.telefono,
      cliente_direccion: direccionCompleta,
      cliente_email: clienteEmail,
      user_id: userId,
      items: itemsCarrito
    };

    const { data: nuevoPedido, error } = await db.rpc('crear_pedido_con_stock', {
      p_pedido: payload,
      p_codigo_cupon: codigoCuponActual()
    });

    if (error) {
      console.error('Error al guardar pedido:', error);
      const detalle = error.message || error.code || 'error desconocido';
      const sinStock = /STOCK_INSUFICIENTE/i.test(detalle);
      const cuponBad = /CUPON_INVALIDO/i.test(detalle);
      alert(
        sinStock
          ? `No hay stock suficiente para completar tu pedido.\n\n${detalle.replace(/^STOCK_INSUFICIENTE:\s*/i, '')}\n\nActualizá el carrito e intentá de nuevo.`
          : cuponBad
            ? 'El cupón ya no es válido. Sacalo o probá otro e intentá de nuevo.'
            : `Hubo un problema al procesar tu pedido.\n\nDetalle: ${detalle}`
      );
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-brands fa-whatsapp text-base text-green-400"></i> CONTINUAR A CONFIRMACIÓN';
      }
      await refrescarDesdeServidor();
      return;
    }

    carrito = [];
    codigoCupon = null;
    previewServidor = null;
    localStorage.removeItem('eltaller_carrito');
    localStorage.removeItem('carrito_items');
    localStorage.removeItem('eltaller_cupon');
    localStorage.removeItem('eltaller_checkout_entrega');
    localStorage.removeItem('datos_entrega_cliente');

    const idPedido = nuevoPedido?.id || '—';
    const totalMsg = Number(nuevoPedido?.total) || 0;
    const itemsMsg = Array.isArray(nuevoPedido?.items) ? nuevoPedido.items : [];
    const subtotalMsg = itemsMsg.reduce(
      (acc, it) => acc + (Number(it.precio) || 0) * (Number(it.cantidad) || 1),
      0
    );

    let listaProductosMensaje = '';
    itemsMsg.forEach(item => {
      const tit = String(item.titulo || 'Producto').replace(/[*_`]/g, '');
      const tal = String(item.talle || 'Único').replace(/[*_`]/g, '');
      listaProductosMensaje += `• *${tit}* (Talle ${tal}) x${Number(item.cantidad) || 1}\n`;
    });

    const limpio = (v) => String(v || '').replace(/[*_`]/g, '').slice(0, 200);
    const mensajeWhatsApp =
`¡Hola! Realicé el pedido *#${idPedido}* en la tienda 🛒

📋 *DETALLE DEL PEDIDO:*
${listaProductosMensaje}
💰 *SUBTOTAL:* $${subtotalMsg.toLocaleString('es-AR')}
🚚 *ENVÍO:* A coordinar
💰 *TOTAL A TRANSFERIR:* $${totalMsg.toLocaleString('es-AR')}

📍 *DATOS DE ENVÍO:*
• *Nombre:* ${limpio(datosCliente.nombre)}
• *Dirección:* ${limpio(direccionCompleta)}
• *Teléfono:* ${limpio(datosCliente.telefono)}

Adjunto a este mensaje el comprobante de transferencia. ¡Muchas gracias!`;

    const urlWhatsApp = `https://wa.me/${TELEFONO_VENDEDOR}?text=${encodeURIComponent(mensajeWhatsApp)}`;
    try {
      sessionStorage.setItem('eltaller_wa_url', urlWhatsApp);
    } catch (_) {}
    window.open(urlWhatsApp, '_blank');
    window.location.href = 'gracias.html';

  } catch (err) {
    console.error('Error inesperado:', err);
    alert('Hubo un problema al procesar tu pedido. Intentalo de nuevo.');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-brands fa-whatsapp text-base text-green-400"></i> CONTINUAR A CONFIRMACIÓN';
    }
  }
}

async function procesarPedidoFinal() {
  return completarPedidoYWhatsApp();
}

function cargarDesdeLocalStorage() {
  try {
    const rawCarrito = localStorage.getItem('eltaller_carrito') || localStorage.getItem('carrito_items');
    const parsed = rawCarrito ? JSON.parse(rawCarrito) : [];
    // Normalizar a id/cantidad/talle (ignorar precios viejos del localStorage)
    carrito = (Array.isArray(parsed) ? parsed : []).map(item => ({
      id: item.id,
      cantidad: Math.max(1, Number(item.cantidad) || 1),
      talle: item.talle || null
    })).filter(i => i.id != null);

    codigoCupon = codigoCuponActual();

    const rawEntrega = localStorage.getItem('eltaller_checkout_entrega');
    if (rawEntrega) {
      datosEntrega = JSON.parse(rawEntrega);
      const setVal = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v || '';
      };
      setVal('cliente-nombre', datosEntrega.nombre);
      setVal('cliente-telefono', datosEntrega.telefono);
      setVal('cliente-email', datosEntrega.email);
      setVal('cliente-direccion', datosEntrega.direccion);
      setVal('cliente-notas', datosEntrega.notas);
      if (datosEntrega.email || datosEntrega.nombre) {
        const emailUser = document.getElementById('checkout-email-user');
        if (emailUser) emailUser.innerText = datosEntrega.email || datosEntrega.nombre;
      }
    }

    if (codigoCupon) {
      const input = document.getElementById('cupon-codigo') || document.getElementById('input-cupon');
      if (input) input.value = codigoCupon;
    }
  } catch (e) {
    console.error('Error leyendo localStorage:', e);
    carrito = [];
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  cargarDesdeLocalStorage();

  try {
    const { data: { session } } = await db.auth.getSession();
    const emailInput = document.getElementById('cliente-email');
    if (session?.user?.email && emailInput && !emailInput.value) {
      emailInput.value = session.user.email;
      const emailUser = document.getElementById('checkout-email-user');
      if (emailUser && emailUser.innerText === 'Completá tus datos') {
        emailUser.innerText = session.user.email;
      }
    }
  } catch (_) {}

  if (!carrito.length) {
    alert('Tu carrito está vacío. Volvé a la tienda para agregar productos.');
    window.location.href = 'index.html';
    return;
  }

  await refrescarDesdeServidor();
  irAlPaso(1);
});

// Expose for inline handlers in checkout.html
window.completarPedidoYWhatsApp = completarPedidoYWhatsApp;
window.guardarEntrega = guardarEntrega;
window.irAlPaso = irAlPaso;
window.actualizarTotalesUI = actualizarTotalesUI;
