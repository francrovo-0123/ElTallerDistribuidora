/* Navbar compartida — El Taller Distribuidora */
(function () {
  const NAV_ITEMS = [
    { slug: 'index', href: 'index.html', label: 'Inicio' },
    { slug: 'exclusivos', href: 'exclusivos.html', label: 'Exclusivos' },
    { slug: 'torpedos', href: 'torpedos.html', label: 'Torpedos' },
    { slug: 'camioneros', href: 'camioneros.html', label: 'Camioneros' },
    { slug: 'imperiales', href: 'imperiales.html', label: 'Imperiales' },
    { slug: 'bombillas', href: 'bombillas.html', label: 'Bombillas' },
    { slug: 'accesorios', href: 'accesorios.html', label: 'Accesorios' },
    { slug: 'termos', href: 'termos.html', label: 'Termos' },
    { slug: 'regalos-empresariales', href: 'regalos-empresariales.html', label: 'Regalos' }
  ];

  function slugActual() {
    // Detecta el archivo actual (ej: "camioneros.html" → "camioneros")
    const archivo = (window.location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    return !archivo || archivo === 'index' ? 'index' : archivo;
  }

  function renderNavLinks(activo) {
    return NAV_ITEMS.map((item, i) => {
      const isActivo = item.slug === activo;
      return `<a href="${item.href}" class="et-drawer-link${isActivo ? ' is-active' : ''}" style="--i:${i}">${item.label}</a>`;
    }).join('\n        ');
  }

  function htmlNavbar() {
    const activo = slugActual();
    return `
<!-- BARRA DE NAVEGACIÓN — logo centrado + menú lateral de categorías -->
<header class="et-site-header bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100/80 shadow-[0_1px_0_rgba(61,82,57,0.06)]">
  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-2 min-h-[3.25rem]">

    <!-- 1. HAMBURGUESA (abre categorías) -->
    <div class="flex items-center shrink-0 w-10 sm:w-24">
      <button type="button" id="btn-menu-categorias" onclick="toggleMenuMobile()"
        class="et-btn-icon et-press w-10 h-10 p-0 rounded-lg text-[#3D5239] hover:bg-[#3D5239]/10 transition flex items-center justify-center"
        aria-label="Abrir categorías" aria-expanded="false" aria-controls="menu-categorias-drawer">
        <i class="fa-solid fa-bars text-base" id="icon-menu-categorias"></i>
      </button>
    </div>

    <!-- 2. LOGO CENTRADO (wordmark) -->
    <a href="index.html"
       class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 et-wordmark et-wordmark--md"
       aria-label="El Taller Distribuidora">El taller Distribuidora</a>

    <!-- 3. ACCIONES DERECHA -->
    <div class="flex items-center gap-1.5 sm:gap-2 ml-auto">

      <!-- BARRA DE BÚSQUEDA -->
      <div class="relative hidden md:block w-32 lg:w-40">
        <span class="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
          <i class="fa-solid fa-magnifying-glass text-[10px]"></i>
        </span>
        <input type="text" id="input-busqueda" oninput="buscarProductosHeader(this.value)" placeholder="Buscar..."
          class="w-full bg-gray-50 border border-gray-200 rounded-full pl-8 pr-2.5 py-1.5 text-[11px] font-semibold text-gray-800 focus:bg-white focus:border-[#3D5239] outline-none transition">
      </div>

      <!-- BOTÓN PANEL ADMIN (solo ícono) -->
      <div id="link-admin-header" class="hidden">
        <a href="admin.html" class="et-btn-icon et-press bg-[#3D5239] text-white rounded-full hover:bg-[#2c3d29] transition flex items-center justify-center w-10 h-10" title="Panel de Administración" aria-label="Panel de Administración">
          <i class="fa-solid fa-gauge-high text-xs"></i>
        </a>
      </div>

      <!-- BOTÓN USUARIO / LOGIN -->
      <button type="button" id="btn-iniciar-sesion" onclick="abrirModalAuth()" class="et-btn-soft et-press flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition text-gray-700" aria-label="Iniciar sesión" title="Iniciar sesión">
        <i class="fa-solid fa-user text-sm"></i>
      </button>

      <!-- MENÚ CUENTA (cliente o admin) — ícono en barra; nombre en dropdown -->
      <div id="menu-cuenta-wrap" class="relative hidden">
        <button type="button" id="btn-menu-cuenta" onclick="toggleMenuCuenta(event)"
          class="et-btn-soft et-press flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition text-gray-700"
          aria-expanded="false" aria-haspopup="true" aria-label="Mi cuenta">
          <i class="fa-solid fa-user text-sm"></i>
          <span class="sr-only" id="btn-menu-cuenta-label">Mi cuenta</span>
        </button>

        <div id="dropdown-cuenta" class="et-nav-panel hidden absolute right-0 mt-2 w-64 bg-white shadow-lg border border-gray-100 z-[70] overflow-hidden rounded-xl">
          <div class="px-4 py-3 border-b border-gray-100">
            <p id="cuenta-email" class="text-sm font-semibold text-gray-800 truncate">—</p>
          </div>
          <nav id="nav-cuenta-cliente" class="py-1 text-sm text-gray-800">
            <a href="mi-cuenta.html" class="block px-4 py-2.5 hover:bg-gray-50 transition">Resumen</a>
            <a href="mi-cuenta.html#perfil" class="block px-4 py-2.5 hover:bg-gray-50 transition">Mi perfil</a>
            <a href="mi-cuenta.html#pedidos" class="block px-4 py-2.5 hover:bg-gray-50 transition">Mis pedidos</a>
            <a href="mi-cuenta.html#configuracion" class="block px-4 py-2.5 hover:bg-gray-50 transition">Configuración</a>
          </nav>
          <div class="border-t border-gray-100">
            <button type="button" onclick="cerrarSesionCliente()" class="w-full text-left px-4 py-2.5 text-sm text-[#8B2E2E] hover:bg-red-50 transition">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <!-- BOTÓN CARRITO (badge fuera del botón: .et-btn-icon tiene overflow:hidden) -->
      <div class="relative shrink-0">
        <button type="button" onclick="abrirCarrito()" class="et-btn-icon et-press rounded-full hover:bg-gray-100 transition flex items-center justify-center w-10 h-10" aria-label="Carrito">
          <svg class="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
        </button>
        <span id="carrito-contador" class="pointer-events-none absolute -top-0.5 -right-0.5 z-10 bg-[#3D5239] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm leading-none">
          0
        </span>
      </div>

    </div>
  </div>
</header>

<!-- MENÚ LATERAL DE CATEGORÍAS -->
<div id="menu-categorias-drawer" class="et-nav-drawer fixed inset-0 z-[60] hidden" aria-hidden="true">
  <div class="et-nav-drawer-backdrop absolute inset-0" onclick="cerrarMenuMobile()" aria-hidden="true"></div>
  <nav id="menu-mobile"
       class="et-nav-drawer-panel absolute left-0 top-0 h-full w-[72%] max-w-[300px] text-white flex flex-col"
       aria-label="Categorías">
    <div class="et-drawer-brand flex items-start justify-between gap-3 px-5 pt-7 pb-5">
      <a href="index.html" class="et-wordmark et-wordmark--on-dark et-wordmark--sm et-drawer-wordmark min-w-0 flex-1" aria-label="El Taller Distribuidora">El taller Distribuidora</a>
      <button type="button" onclick="cerrarMenuMobile()" class="et-drawer-close shrink-0" aria-label="Cerrar menú">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <p class="et-drawer-eyebrow px-5 pb-3">Categorías</p>
    <div class="et-drawer-links flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-1">
      ${renderNavLinks(activo)}
    </div>
    <div class="et-drawer-social px-5 py-5">
      <div class="flex items-center justify-center gap-3">
        <a href="https://wa.me/5492236872975" target="_blank" rel="noopener noreferrer"
           class="et-drawer-social-btn" aria-label="WhatsApp">
          <i class="fa-brands fa-whatsapp"></i>
        </a>
        <a href="https://www.instagram.com/eltaller.distribuidora/" target="_blank" rel="noopener noreferrer"
           class="et-drawer-social-btn" aria-label="Instagram">
          <i class="fa-brands fa-instagram"></i>
        </a>
        <a href="#" class="et-drawer-social-btn" aria-label="Facebook">
          <i class="fa-brands fa-facebook-f"></i>
        </a>
        <a href="#" class="et-drawer-social-btn" aria-label="TikTok">
          <i class="fa-brands fa-tiktok"></i>
        </a>
      </div>
    </div>
  </nav>
</div>

<!-- MODAL DE AUTENTICACIÓN (LOGIN / REGISTRO) -->
  <div id="auth-modal" class="et-modal hidden fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
  <div class="et-modal-panel bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden relative scale-95 opacity-0" onclick="event.stopPropagation()">

    <!-- Botón Cerrar (X) -->
    <button type="button" onclick="cerrarModalAuth()" class="absolute top-4 right-4 text-gray-400 hover:text-black transition p-1">
      <i class="fa-solid fa-xmark text-lg"></i>
    </button>

    <div class="p-8">

      <!-- LOGO / ENCABEZADO -->
      <div class="text-center mb-6">
        <span class="et-wordmark et-wordmark--md block text-center" aria-hidden="true">El taller Distribuidora</span>
        <h2 id="auth-titulo" class="text-sm font-black text-gray-900 uppercase tracking-widest mt-4">Iniciar Sesión</h2>
        <p id="auth-subtitulo" class="text-xs text-gray-500 font-medium mt-1">Accedé a tu cuenta en El Taller Distribuidora</p>
      </div>

      <!-- PESTAÑAS DE NAVEGACIÓN (LOGIN / REGISTRO) -->
      <div class="flex border-b border-gray-100 mb-6 text-xs font-black uppercase tracking-wider">
        <button type="button" id="tab-login" onclick="cambiarTabAuth('login')" class="flex-1 pb-3 text-center border-b-2 border-[#3D5239] text-[#3D5239] transition">
          Iniciar Sesión
        </button>
        <button type="button" id="tab-registro" onclick="cambiarTabAuth('registro')" class="flex-1 pb-3 text-center border-b-2 border-transparent text-gray-400 hover:text-gray-700 transition">
          Crear Cuenta
        </button>
      </div>

      <!-- ALERTA DINÁMICA FLOTANTE -->
      <div id="auth-alert" class="hidden mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
        <i id="auth-alert-icon" class="text-sm"></i>
        <span id="auth-alert-msg"></span>
      </div>

      <!-- FORMULARIO UNIFICADO -->
      <form id="form-auth" onsubmit="ejecutarAutenticacion(event)" class="space-y-4">

        <!-- Campo Nombre (Solo visible en Registro) -->
        <div id="contenedor-nombre" class="hidden">
          <label class="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1">Nombre y Apellido</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><i class="fa-solid fa-user text-xs"></i></span>
            <input type="text" id="input-nombre" placeholder="Tu nombre"
              class="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-800 focus:bg-white focus:border-[#3D5239] outline-none transition">
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1">Correo electrónico</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><i class="fa-solid fa-envelope text-xs"></i></span>
            <input type="email" id="input-email" required placeholder="tucorreo@email.com"
              class="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-800 focus:bg-white focus:border-[#3D5239] outline-none transition">
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1">Contraseña</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><i class="fa-solid fa-lock text-xs"></i></span>
            <input type="password" id="input-password" required placeholder="••••••••"
              class="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-800 focus:bg-white focus:border-[#3D5239] outline-none transition">
          </div>
        </div>

        <!-- Botón de Envío -->
        <button type="submit" id="btn-auth-submit"
          class="et-btn et-press w-full bg-[#3D5239] text-white rounded-xl py-3 text-xs font-black uppercase tracking-widest hover:bg-[#2c3d29] transition shadow-md mt-2">
          Ingresar
        </button>

      </form>

    </div>
  </div>
</div>`;
  }

  const SUPABASE_URL = (window.ELTALLER_SUPABASE && window.ELTALLER_SUPABASE.url) || 'https://fmtgtznlidnhoxkffvmh.supabase.co';
  const SUPABASE_KEY = (window.ELTALLER_SUPABASE && window.ELTALLER_SUPABASE.anonKey) || '';
  const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

  let esModoRegistro = false;
  let supabaseLoadPromise = null;

  function crearClienteAuth() {
    if (window.db) return window.db;
    if (typeof supabase === 'undefined') return null;
    // Un solo cliente en toda la página (evita pelear por la sesión en localStorage)
    // Nota: JWT queda en localStorage (SDK Supabase). Mitigá XSS con escapeHtml en renders.
    window.db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
    return window.db;
  }

  function ensureAuthDb() {
    const existente = crearClienteAuth();
    if (existente) return Promise.resolve(existente);

    if (!supabaseLoadPromise) {
      supabaseLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SUPABASE_CDN;
        script.onload = () => {
          const client = crearClienteAuth();
          if (client) resolve(client);
          else reject(new Error('No se pudo inicializar Supabase'));
        };
        script.onerror = () => reject(new Error('No se pudo cargar Supabase'));
        document.head.appendChild(script);
      });
    }
    return supabaseLoadPromise;
  }

  function setMenuDrawerState(abierto) {
    const drawer = document.getElementById('menu-categorias-drawer');
    const btn = document.getElementById('btn-menu-categorias');
    const icon = document.getElementById('icon-menu-categorias');
    if (!drawer) return;

    const dur = 480;

    if (abierto) {
      drawer.classList.remove('hidden');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => drawer.classList.add('is-open'));
      });
      if (btn) btn.setAttribute('aria-expanded', 'true');
      if (icon) icon.className = 'fa-solid fa-xmark text-base';
    } else {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('overflow-hidden');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (icon) icon.className = 'fa-solid fa-bars text-base';
      setTimeout(() => {
        if (!drawer.classList.contains('is-open')) drawer.classList.add('hidden');
      }, dur);
    }
  }

  window.cerrarMenuMobile = function cerrarMenuMobile() {
    setMenuDrawerState(false);
  };

  window.toggleMenuMobile = function toggleMenuMobile() {
    const drawer = document.getElementById('menu-categorias-drawer');
    if (!drawer) return;
    const abierto = drawer.classList.contains('is-open');
    setMenuDrawerState(!abierto);
  };

  window.abrirCarrito = function abrirCarrito() {
    if (typeof window.toggleCarrito === 'function') {
      window.toggleCarrito();
    }
  };

  window.buscarProductosHeader = function buscarProductosHeader(texto) {
    const query = texto.toLowerCase().trim();

    // Si estás en la página principal o una categoría, podés filtrar la grilla actual:
    if (typeof filtrarGrillaPorTexto === 'function') {
      filtrarGrillaPorTexto(query);
    }
  };

  // Solo este correo puede entrar al panel (debe coincidir con is_admin() en SQL)
  const CORREO_ADMIN_OFICIAL = (window.ELTALLER_SUPABASE && window.ELTALLER_SUPABASE.adminEmail) || 'eltalleradmin@gmail.com';

  function esUsuarioAdmin(usuario) {
    if (typeof window.esEmailAdmin === 'function') return window.esEmailAdmin(usuario?.email);
    if (!usuario?.email) return false;
    return usuario.email.toLowerCase() === CORREO_ADMIN_OFICIAL.toLowerCase();
  }

  function mostrarBotonLogin(visible) {
    const btn = document.getElementById('btn-iniciar-sesion');
    if (btn) btn.classList.toggle('hidden', !visible);
  }

  function nombreDesdeUsuario(user) {
    if (!user) return '';
    const meta = user.user_metadata || {};
    return (meta.full_name || meta.nombre || '').trim();
  }

  function mostrarMenuCuenta(visible, email, esAdmin, nombreCliente) {
    const wrap = document.getElementById('menu-cuenta-wrap');
    const emailEl = document.getElementById('cuenta-email');
    const label = document.getElementById('btn-menu-cuenta-label');
    const btnCuenta = document.getElementById('btn-menu-cuenta');
    const navCliente = document.getElementById('nav-cuenta-cliente');

    if (wrap) wrap.classList.toggle('hidden', !visible);

    // Links de cliente (Resumen, etc.) solo para clientes
    if (navCliente) navCliente.classList.toggle('hidden', !!esAdmin);

    if (email || esAdmin || nombreCliente) {
      const nombreCuenta = esAdmin
        ? 'ELTALLERADMIN'
        : (nombreCliente || email.split('@')[0] || 'Mi cuenta');

      if (emailEl) emailEl.innerText = esAdmin ? 'ELTALLERADMIN' : (email || nombreCuenta);
      if (label) label.innerText = nombreCuenta;
      if (btnCuenta) btnCuenta.setAttribute('aria-label', nombreCuenta);
    }

    if (!visible) {
      const dropdown = document.getElementById('dropdown-cuenta');
      if (dropdown) dropdown.classList.add('hidden');
    }
  }

  function mostrarLinkAdmin(visible) {
    const linkAdmin = document.getElementById('link-admin-header');
    if (!linkAdmin) return;
    linkAdmin.classList.toggle('hidden', !visible);
  }

  async function actualizarUISesion() {
    try {
      const db = await ensureAuthDb();
      const { data: { session }, error } = await db.auth.getSession();
      const logueado = !error && !!session?.user;
      const user = session?.user || null;
      const email = user?.email || '';
      const esAdmin = logueado && esUsuarioAdmin(user);
      const nombre = nombreDesdeUsuario(user);

      mostrarBotonLogin(!logueado);
      mostrarMenuCuenta(logueado, email, esAdmin, nombre);
      mostrarLinkAdmin(esAdmin);
    } catch (err) {
      mostrarBotonLogin(true);
      mostrarMenuCuenta(false);
      mostrarLinkAdmin(false);
    }
  }

  async function verificarAccesoAdminHeader() {
    await actualizarUISesion();
  }

  window.toggleMenuCuenta = function toggleMenuCuenta(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('dropdown-cuenta');
    const btn = document.getElementById('btn-menu-cuenta');
    if (!dropdown) return;
    const abierto = dropdown.classList.contains('is-open');
    if (abierto) {
      dropdown.classList.remove('is-open');
      setTimeout(() => dropdown.classList.add('hidden'), (window.ElTallerMotion && window.ElTallerMotion.DUR) || 280);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    } else {
      dropdown.classList.remove('hidden');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => dropdown.classList.add('is-open'));
      });
      if (btn) btn.setAttribute('aria-expanded', 'true');
    }
  };

  window.cerrarMenuCuenta = function cerrarMenuCuenta() {
    const dropdown = document.getElementById('dropdown-cuenta');
    const btn = document.getElementById('btn-menu-cuenta');
    if (dropdown) {
      dropdown.classList.remove('is-open');
      dropdown.classList.add('hidden');
    }
    if (btn) btn.setAttribute('aria-expanded', 'false');
  };

  window.cerrarSesionCliente = async function cerrarSesionCliente() {
    try {
      const authDb = await ensureAuthDb();
      await authDb.auth.signOut();
    } catch (err) {
      // Igual limpiamos UI local
    }
    try { localStorage.removeItem('taller_admin_token'); } catch (_) {}
    window.cerrarMenuCuenta();
    await actualizarUISesion();
    window.location.reload();
  };

  function limpiarAlertasAuth() {
    const alertaDiv = document.getElementById('auth-alert');
    if (alertaDiv) alertaDiv.classList.add('hidden');
  }

  function mostrarAlertaAuth(mensaje, tipo = 'error') {
    const alertaDiv = document.getElementById('auth-alert');
    const icono = document.getElementById('auth-alert-icon');
    const texto = document.getElementById('auth-alert-msg');

    texto.innerText = mensaje;
    alertaDiv.classList.remove('hidden');

    if (tipo === 'error') {
      alertaDiv.className = "mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 bg-red-50 border border-red-200 text-red-700";
      icono.className = "fa-solid fa-circle-exclamation text-red-500 text-sm";
    } else {
      alertaDiv.className = "mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800";
      icono.className = "fa-solid fa-circle-check text-emerald-600 text-sm";
    }
  }

  const TAB_ACTIVA = 'flex-1 pb-3 text-center border-b-2 border-[#3D5239] text-[#3D5239] transition';
  const TAB_INACTIVA = 'flex-1 pb-3 text-center border-b-2 border-transparent text-gray-400 hover:text-gray-700 transition';

  window.abrirModalAuth = function abrirModalAuth(modo) {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    if (modo === 'registro' || modo === 'login') {
      window.cambiarTabAuth(modo);
    }
    const panel = modal.querySelector('.et-modal-panel');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.classList.add('overflow-hidden');
    if (panel && window.ElTallerMotion && !window.ElTallerMotion.reduced) {
      panel.classList.add('scale-95', 'opacity-0');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          panel.classList.remove('scale-95', 'opacity-0');
          panel.classList.add('scale-100', 'opacity-100');
        });
      });
    } else if (panel) {
      panel.classList.remove('scale-95', 'opacity-0');
      panel.classList.add('scale-100', 'opacity-100');
    }
  };

  window.cerrarModalAuth = function cerrarModalAuth() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    const panel = modal.querySelector('.et-modal-panel');
    const finish = () => {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      document.body.classList.remove('overflow-hidden');
    };
    if (panel && window.ElTallerMotion && !window.ElTallerMotion.reduced) {
      panel.classList.remove('scale-100', 'opacity-100');
      panel.classList.add('scale-95', 'opacity-0');
      setTimeout(finish, window.ElTallerMotion.DUR || 280);
    } else {
      finish();
    }
  };

  window.cambiarTabAuth = function cambiarTabAuth(modo) {
    esModoRegistro = modo === 'registro';

    const titulo = document.getElementById('auth-titulo');
    const subtitulo = document.getElementById('auth-subtitulo');
    const contenedorNombre = document.getElementById('contenedor-nombre');
    const inputNombre = document.getElementById('input-nombre');
    const btnSubmit = document.getElementById('btn-auth-submit');
    const tabLogin = document.getElementById('tab-login');
    const tabRegistro = document.getElementById('tab-registro');
    const alerta = document.getElementById('auth-alert');

    if (alerta) alerta.classList.add('hidden');

    if (esModoRegistro) {
      if (titulo) titulo.innerText = 'Crear Cuenta';
      if (subtitulo) subtitulo.innerText = 'Registrate para empezar a comprar en El Taller';
      if (contenedorNombre) contenedorNombre.classList.remove('hidden');
      if (inputNombre) inputNombre.setAttribute('required', 'true');
      if (btnSubmit) btnSubmit.innerText = 'Registrarse';
      if (tabLogin) tabLogin.className = TAB_INACTIVA;
      if (tabRegistro) tabRegistro.className = TAB_ACTIVA;
    } else {
      if (titulo) titulo.innerText = 'Iniciar Sesión';
      if (subtitulo) subtitulo.innerText = 'Accedé a tu cuenta en El Taller Distribuidora';
      if (contenedorNombre) contenedorNombre.classList.add('hidden');
      if (inputNombre) inputNombre.removeAttribute('required');
      if (btnSubmit) btnSubmit.innerText = 'Ingresar';
      if (tabLogin) tabLogin.className = TAB_ACTIVA;
      if (tabRegistro) tabRegistro.className = TAB_INACTIVA;
    }
  };

  // Compatibilidad con llamadas anteriores
  window.cambiarModoAuth = function cambiarModoAuth() {
    window.cambiarTabAuth(esModoRegistro ? 'login' : 'registro');
  };

  window.ejecutarAutenticacion = async function ejecutarAutenticacion(event) {
    event.preventDefault();
    const email = document.getElementById('input-email')?.value.trim() || '';
    const password = document.getElementById('input-password')?.value || '';
    const nombre = document.getElementById('input-nombre')?.value.trim() || '';
    const btn = document.getElementById('btn-auth-submit');
    const modoActualAuth = esModoRegistro ? 'registro' : 'login';

    limpiarAlertasAuth();
    if (btn) {
      btn.innerText = 'Procesando...';
      btn.disabled = true;
    }

    try {
      const authDb = await ensureAuthDb();

      if (modoActualAuth === 'registro') {
        if (!nombre) {
          mostrarAlertaAuth('Ingresá tu nombre y apellido.', 'error');
          if (btn) {
            btn.innerText = 'Registrarse';
            btn.disabled = false;
          }
          return;
        }

        const { error } = await authDb.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: nombre, nombre }
          }
        });

        if (error) {
          mostrarAlertaAuth('Error al registrarse: ' + error.message, 'error');
          if (btn) {
            btn.innerText = 'Registrarse';
            btn.disabled = false;
          }
          return;
        }

        mostrarAlertaAuth('¡Cuenta creada con éxito! Ya podés iniciar sesión.', 'success');
        setTimeout(() => {
          cambiarTabAuth('login');
          if (btn) {
            btn.innerText = 'Ingresar';
            btn.disabled = false;
          }
        }, 1500);
      } else {
        const { data, error } = await authDb.auth.signInWithPassword({ email, password });

        if (error) {
          mostrarAlertaAuth('Correo o contraseña incorrectos.', 'error');
          if (btn) {
            btn.innerText = 'Ingresar';
            btn.disabled = false;
          }
          return;
        }

        const usuarioLogueado = data?.user || data?.session?.user;
        const esAdmin = esUsuarioAdmin(usuarioLogueado) ||
          email.toLowerCase() === CORREO_ADMIN_OFICIAL.toLowerCase();

        // No guardar JWT extra: la sesión de Supabase ya persiste en localStorage.
        try { localStorage.removeItem('taller_admin_token'); } catch (_) {}

        mostrarAlertaAuth('¡Ingresaste con éxito!', 'success');
        mostrarLinkAdmin(esAdmin);
        mostrarBotonLogin(false);
        mostrarMenuCuenta(true, usuarioLogueado?.email || email, esAdmin, nombreDesdeUsuario(usuarioLogueado));

        setTimeout(() => {
          cerrarModalAuth();
          // Solo el admin va al panel; el resto se queda en la tienda
          if (esAdmin) {
            window.location.href = 'admin.html';
          } else {
            window.location.reload();
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Error de autenticación:', err);
      mostrarAlertaAuth('Error al conectar. Revisá tu conexión e intentá de nuevo.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerText = modoActualAuth === 'registro' ? 'Registrarse' : 'Ingresar';
      }
    }
  };

  window.handleAuthSubmit = window.ejecutarAutenticacion;

  function montarNavbar() {
    const mount = document.getElementById('site-navbar');
    if (!mount) return;
    mount.outerHTML = htmlNavbar();

    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) window.cerrarModalAuth();
      });
    }

    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('menu-cuenta-wrap');
      if (wrap && !wrap.contains(e.target)) {
        window.cerrarMenuCuenta();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') window.cerrarMenuMobile();
    });

    // Crear / reutilizar cliente UNA sola vez, después actualizar UI
    crearClienteAuth();
    // Si la página todavía no asignó window.db, lo hacemos ahora;
    // si ya existe (index/categoria), lo reutilizamos.
    Promise.resolve()
      .then(() => ensureAuthDb())
      .then(() => actualizarUISesion())
      .catch(() => {
        mostrarBotonLogin(true);
        mostrarMenuCuenta(false);
        mostrarLinkAdmin(false);
      });

    ensureAuthDb()
      .then((authDb) => {
        authDb.auth.onAuthStateChange(() => {
          actualizarUISesion();
        });
      })
      .catch(() => {});
  }

  // Ejecutar al cargar la página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarNavbar);
  } else {
    montarNavbar();
  }
})();
