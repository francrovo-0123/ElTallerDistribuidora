/* Footer institucional — El Taller Distribuidora */
(function () {
  function htmlFooter() {
    return `
<!-- FOOTER INSTITUCIONAL - EL TALLER DISTRIBUIDORA -->
<footer class="bg-[#1A2218] text-gray-300 font-sans pt-12 pb-6 border-t border-gray-800">
  <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 justify-between items-start">

    <!-- COLUMNA 1: INFORMACIÓN ÚTIL -->
    <div class="space-y-3">
      <h3 class="text-white text-xs font-black uppercase tracking-widest border-l-2 border-[#3D5239] pl-3">
        Información útil
      </h3>
      <ul class="space-y-2 text-xs font-medium">
        <li><a href="sobre-nosotros.html" class="hover:text-white transition">Sobre Nosotros</a></li>
        <li><a href="trabaja-con-nosotros.html" class="hover:text-white transition">Trabajá con nosotros</a></li>
        <li><a href="nuestros-productos.html" class="hover:text-white transition">Nuestros Productos</a></li>
        <li><a href="preguntas-frecuentes.html" class="hover:text-white transition">Preguntas Frecuentes</a></li>
        <li><a href="politicas-de-cambios.html" class="hover:text-white transition">Políticas de cambios</a></li>
        <li><a href="contacto.html" class="hover:text-white transition">Contacto</a></li>
        <li><a href="garantia.html" class="hover:text-white transition">Garantía</a></li>
      </ul>
    </div>

    <!-- COLUMNA 2: CONTACTANOS -->
    <div class="space-y-3">
      <h3 class="text-white text-xs font-black uppercase tracking-widest border-l-2 border-[#3D5239] pl-3">
        Contactanos
      </h3>
      <ul class="space-y-2 text-xs font-medium">
        <li class="flex items-center gap-2">
          <i class="fa-brands fa-whatsapp text-emerald-500"></i>
          <a href="https://wa.me/5492236872975" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">54 9 2236872975</a>
        </li>
        <li class="flex items-center gap-2">
          <i class="fa-solid fa-phone text-gray-400"></i>
          <span>Teléfono: (223) 687 - 2975</span>
        </li>
        <li class="flex items-center gap-2">
          <i class="fa-solid fa-envelope text-gray-400"></i>
          <a href="mailto:eltallerdistribuidora@gmail.com" class="hover:text-white transition">eltallerdistribuidora@gmail.com</a>
        </li>
        <li class="flex items-start gap-2">
          <i class="fa-solid fa-location-dot text-gray-400 mt-0.5"></i>
          <span>Miramar, Buenos Aires</span>
        </li>
      </ul>
    </div>

    <!-- COLUMNA 3: REDES SOCIALES -->
    <div class="space-y-3 flex flex-col md:items-end">
      <h3 class="text-white text-xs font-black uppercase tracking-widest md:text-right">
        Seguinos
      </h3>
      <div class="flex items-center gap-4 pt-1">
        <a href="https://www.instagram.com/eltaller.distribuidora/" target="_blank" rel="noopener noreferrer" class="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-[#3D5239] transition" aria-label="Instagram">
          <i class="fa-brands fa-instagram text-sm"></i>
        </a>
        <a href="#" class="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-[#3D5239] transition" aria-label="Facebook">
          <i class="fa-brands fa-facebook-f text-sm"></i>
        </a>
        <a href="#" class="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-[#3D5239] transition" aria-label="YouTube">
          <i class="fa-brands fa-youtube text-sm"></i>
        </a>
        <a href="#" class="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-[#3D5239] transition" aria-label="TikTok">
          <i class="fa-brands fa-tiktok text-sm"></i>
        </a>
      </div>
    </div>

  </div>

  <!-- BARRA INFERIOR / LEGALES -->
  <div class="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-gray-800/80 flex flex-col lg:flex-row items-center justify-between gap-4 text-[11px] text-gray-400">
    <div>
      <p>Copyright El Taller Distribuidora - 2026. Todos los derechos reservados.</p>
    </div>

    <div class="flex items-center gap-4 text-gray-500 font-medium">
      <a href="privacidad.html" class="hover:text-white transition">Privacidad</a>
      <a href="terminos.html" class="hover:text-white transition">Términos</a>
    </div>
  </div>
</footer>`;
  }

  function htmlWhatsAppFlotante() {
    return `
<a href="https://wa.me/5492236872975?text=Hola%2C%20quiero%20hacer%20una%20consulta%20sobre%20El%20Taller."
   target="_blank"
   rel="noopener noreferrer"
   id="btn-whatsapp-flotante"
   aria-label="Escribir por WhatsApp"
   class="fixed bottom-6 right-6 z-[60] w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#1B4332] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(27,67,50,0.45)] et-press hover:scale-105 hover:bg-[#2D6A4F] transition-transform duration-280 ease-premium">
  <i class="fa-brands fa-whatsapp text-[1.75rem] leading-none"></i>
</a>`;
  }

  function montarFooter() {
    const mount = document.getElementById('site-footer');
    if (!mount) return;
    mount.outerHTML = htmlFooter();

    if (!document.getElementById('btn-whatsapp-flotante')) {
      document.body.insertAdjacentHTML('beforeend', htmlWhatsAppFlotante());
    }
  }

  montarFooter();
})();
