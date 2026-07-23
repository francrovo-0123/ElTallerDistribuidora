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

  const LINK_BASE = 'hover:text-black transition py-1';
  const LINK_ACTIVO =
    'border-2 border-[#3D5239] bg-[#3D5239]/5 rounded px-3 py-1 text-[#3D5239]';
  const MOBILE_BASE = 'block py-2 px-3 rounded hover:bg-gray-50';
  const MOBILE_ACTIVO =
    'block py-2 px-3 rounded bg-[#3D5239]/10 text-[#3D5239] font-extrabold';

  function slugActual() {
    // Detecta el archivo actual (ej: "camioneros.html" → "camioneros")
    const archivo = (window.location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    return !archivo || archivo === 'index' ? 'index' : archivo;
  }

  function renderNavLinks(activo, variante) {
    return NAV_ITEMS.map((item) => {
      const isActivo = item.slug === activo;
      if (variante === 'mobile') {
        return `<a href="${item.href}" class="${isActivo ? MOBILE_ACTIVO : MOBILE_BASE}">${item.label}</a>`;
      }
      return `<a href="${item.href}" class="${isActivo ? LINK_ACTIVO : LINK_BASE}">${item.label}</a>`;
    }).join('\n        ');
  }

  function htmlNavbar() {
    const activo = slugActual();
    return `
<!-- BARRA DE NAVEGACIÓN LIMPIA Y OPTIMIZADA -->
<header class="bg-white border-b border-gray-200 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-6">

    <!-- 1. LOGO -->
    <a href="index.html" class="flex items-center shrink-0 group" aria-label="El Taller Distribuidora">
      <img src="eltaller.png" alt="El Taller Distribuidora"
           class="h-16 w-16 md:h-20 md:w-20 object-contain group-hover:scale-105 transition-transform duration-300">
    </a>

    <!-- 2. LINKS DE CATEGORÍAS (Escritorio) -->
    <nav class="hidden xl:flex items-center gap-6 text-[11px] font-black uppercase tracking-widest text-gray-700">
      ${renderNavLinks(activo, 'desktop')}
    </nav>

    <!-- 3. ACCESORIOS DERECHA: Buscador, Carrito, Usuario / Admin -->
    <div class="flex items-center gap-3">

      <!-- BARRA DE BÚSQUEDA -->
      <div class="relative hidden md:block w-40 lg:w-52">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          <i class="fa-solid fa-magnifying-glass text-xs"></i>
        </span>
        <input type="text" id="input-busqueda" oninput="buscarProductosHeader(this.value)" placeholder="Buscar..."
          class="w-full bg-gray-50 border border-gray-200 rounded-full pl-9 pr-3 py-1.5 text-xs font-semibold text-gray-800 focus:bg-white focus:border-[#3D5239] outline-none transition shadow-inner">
      </div>

      <!-- BOTÓN PANEL ADMIN (Solo visible si sos admin) -->
      <div id="link-admin-header" class="hidden">
        <a href="admin.html" class="bg-[#3D5239] text-white rounded-full text-xs hover:bg-[#2c3d29] transition shadow-sm flex items-center justify-center w-11 h-11" title="Panel de Administración">
          <i class="fa-solid fa-gauge-high text-xs"></i>
        </a>
      </div>

      <!-- BOTÓN USUARIO / LOGIN -->
      <button type="button" id="btn-iniciar-sesion" onclick="abrirModalAuth()" class="flex items-center justify-center gap-2 w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full hover:bg-gray-100 transition text-gray-700 text-xs font-black uppercase tracking-wider">
        <i class="fa-solid fa-user text-sm"></i>
        <span class="hidden sm:inline">Iniciar sesión</span>
      </button>

      <!-- MENÚ CUENTA (cliente o admin) -->
      <div id="menu-cuenta-wrap" class="relative hidden">
        <button type="button" id="btn-menu-cuenta" onclick="toggleMenuCuenta(event)"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition text-gray-700 text-xs font-black uppercase tracking-wider"
          aria-expanded="false" aria-haspopup="true">
          <i class="fa-solid fa-user text-sm"></i>
          <span class="hidden sm:inline max-w-[140px] truncate" id="btn-menu-cuenta-label">Mi cuenta</span>
          <i class="fa-solid fa-chevron-down text-[9px] text-gray-400"></i>
        </button>

        <div id="dropdown-cuenta" class="et-nav-panel hidden absolute right-0 mt-2 w-64 bg-white shadow-lg border border-gray-100 z-[70] overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100">
            <p id="cuenta-email" class="text-sm text-gray-500 truncate">—</p>
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

      <!-- BOTÓN CARRITO -->
      <button onclick="abrirCarrito()" class="relative p-2 rounded-full hover:bg-gray-100 transition flex items-center justify-center w-11 h-11">
        <svg class="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
        </svg>
        <span id="carrito-contador" class="absolute -top-1 -right-1 bg-[#3D5239] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          0
        </span>
      </button>

      <!-- MENÚ MÓVIL (Hamburguesa) -->
      <button onclick="toggleMenuMobile()" class="xl:hidden w-11 h-11 p-0 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center">
        <i class="fa-solid fa-bars text-base"></i>
      </button>

    </div>
  </div>

  <!-- MENÚ MÓVIL DESPLEGABLE (Categorías para celulares) -->
  <div id="menu-mobile" class="et-nav-panel hidden xl:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-2 text-xs font-black uppercase tracking-widest text-gray-700">
        ${renderNavLinks(activo, 'mobile')}
        <button type="button" id="btn-iniciar-sesion-mobile" onclick="abrirModalAuth(); toggleMenuMobile();"
          class="w-full text-left block py-2 px-3 rounded hover:bg-gray-50 border-t border-gray-100 mt-2 pt-3">
          <i class="fa-solid fa-user mr-1.5"></i> Iniciar sesión
        </button>
        <div id="menu-cuenta-mobile" class="hidden border-t border-gray-100 mt-2 pt-3 space-y-1">
          <p id="cuenta-email-mobile" class="px-3 py-1 text-[11px] text-gray-400 font-medium normal-case tracking-normal truncate">—</p>
          <div id="nav-cuenta-cliente-mobile" class="space-y-1">
            <a href="mi-cuenta.html" class="block py-2 px-3 rounded hover:bg-gray-50">Resumen</a>
            <a href="mi-cuenta.html#perfil" class="block py-2 px-3 rounded hover:bg-gray-50">Mi perfil</a>
            <a href="mi-cuenta.html#pedidos" class="block py-2 px-3 rounded hover:bg-gray-50">Mis pedidos</a>
            <a href="mi-cuenta.html#configuracion" class="block py-2 px-3 rounded hover:bg-gray-50">Configuración</a>
          </div>
          <button type="button" onclick="cerrarSesionCliente(); toggleMenuMobile();"
            class="w-full text-left block py-2 px-3 rounded hover:bg-red-50 text-[#8B2E2E] normal-case tracking-normal font-bold">
            Cerrar sesión
          </button>
        </div>
  </div>
</header>

<!-- MODAL DE AUTENTICACIÓN (LOGIN / REGISTRO) -->
  <div id="auth-modal" class="et-modal hidden fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
  <div class="et-modal-panel bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden relative scale-95 opacity-0" onclick="event.stopPropagation()">

    <!-- Botón Cerrar (X) -->
    <button type="button" onclick="cerrarModalAuth()" class="absolute top-4 right-4 text-gray-400 hover:text-black transition p-1">
      <i class="fa-solid fa-xmark text-lg"></i>
    </button>

    <div class="p-8">

      <!-- LOGO / ENCABEZADO -->
      <div class="text-center mb-6">
        <img src="eltaller.png" alt="El Taller" class="w-16 h-16 mx-auto mb-2 object-contain">
        <h2 id="auth-titulo" class="text-sm font-black text-gray-900 uppercase tracking-widest">Iniciar Sesión</h2>
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
          class="w-full bg-[#3D5239] text-white rounded-xl py-3 text-xs font-black uppercase tracking-widest hover:bg-[#2c3d29] transition shadow-md active:scale-95 mt-2">
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

  window.toggleMenuMobile = function toggleMenuMobile() {
    const menu = document.getElementById('menu-mobile');
    if (!menu) return;
    const abriendo = menu.classList.contains('hidden') || !menu.classList.contains('is-open');
    if (abriendo) {
      menu.classList.remove('hidden');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => menu.classList.add('is-open'));
      });
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => menu.classList.add('hidden'), (window.ElTallerMotion && window.ElTallerMotion.DUR) || 280);
    }
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
    const btnMobile = document.getElementById('btn-iniciar-sesion-mobile');
    if (btn) btn.classList.toggle('hidden', !visible);
    if (btnMobile) btnMobile.classList.toggle('hidden', !visible);
  }

  function nombreDesdeUsuario(user) {
    if (!user) return '';
    const meta = user.user_metadata || {};
    return (meta.full_name || meta.nombre || '').trim();
  }

  function mostrarMenuCuenta(visible, email, esAdmin, nombreCliente) {
    const wrap = document.getElementById('menu-cuenta-wrap');
    const mobile = document.getElementById('menu-cuenta-mobile');
    const emailEl = document.getElementById('cuenta-email');
    const emailMobile = document.getElementById('cuenta-email-mobile');
    const label = document.getElementById('btn-menu-cuenta-label');
    const navCliente = document.getElementById('nav-cuenta-cliente');
    const navClienteMobile = document.getElementById('nav-cuenta-cliente-mobile');

    if (wrap) wrap.classList.toggle('hidden', !visible);
    if (mobile) mobile.classList.toggle('hidden', !visible);

    // Links de cliente (Resumen, etc.) solo para clientes
    if (navCliente) navCliente.classList.toggle('hidden', !!esAdmin);
    if (navClienteMobile) navClienteMobile.classList.toggle('hidden', !!esAdmin);

    if (email || esAdmin || nombreCliente) {
      const nombreCuenta = esAdmin
        ? 'ELTALLERADMIN'
        : (nombreCliente || email.split('@')[0] || 'Mi cuenta');

      if (emailEl) emailEl.innerText = esAdmin ? 'ELTALLERADMIN' : (email || nombreCuenta);
      if (emailMobile) emailMobile.innerText = esAdmin ? 'ELTALLERADMIN' : (email || nombreCuenta);
      if (label) {
        const texto = nombreCuenta.toUpperCase();
        label.innerText = texto.length > 18 && !esAdmin
          ? texto.slice(0, 18) + '…'
          : texto;
      }
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
