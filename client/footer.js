/* Footer institucional — El Taller Distribuidora */
(function () {
  function htmlFooter() {
    return `
<!-- FOOTER INSTITUCIONAL - EL TALLER DISTRIBUIDORA -->
<footer class="bg-[#2c3d29] text-white pt-12 pb-8 border-t border-[#3D5239]">
  <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-10 mb-10">

    <!-- Columna 1: Logo / Marca -->
    <div class="flex flex-col items-start space-y-4 min-w-0">
      <a href="index.html" class="et-wordmark et-wordmark--on-dark et-wordmark--lg et-footer-wordmark group" aria-label="El Taller Distribuidora">El taller Distribuidora</a>
      <p class="text-sm text-gray-300 leading-relaxed font-medium">
        Distribuidora y fábrica. Calidad y confianza para tu negocio y hogar en Miramar y la zona.
      </p>
    </div>

    <!-- Columna 2: Sobre nosotros / Legales -->
    <div class="space-y-4">
      <h3 class="text-sm font-black uppercase tracking-widest text-white border-b border-white/20 pb-2.5 inline-block">Sobre nosotros</h3>
      <ul class="space-y-2.5 text-sm font-medium text-gray-300">
        <li><a href="sobre-nosotros.html" class="hover:text-white transition">Quiénes somos</a></li>
        <li><a href="privacidad.html" class="hover:text-white transition">Política de Privacidad</a></li>
        <li><a href="terminos.html" class="hover:text-white transition">Términos y Condiciones</a></li>
        <li><a href="preguntas-frecuentes.html" class="hover:text-white transition">Ayuda / Soporte</a></li>
      </ul>
    </div>

    <!-- Columna 3: Categorías -->
    <div class="space-y-4">
      <h3 class="text-sm font-black uppercase tracking-widest text-white border-b border-white/20 pb-2.5 inline-block">Categorías</h3>
      <ul class="space-y-2.5 text-sm font-medium text-gray-300">
        <li><a href="nuestros-productos.html" class="hover:text-white transition">Catálogo General</a></li>
        <li><a href="regalos-empresariales.html" class="hover:text-white transition">Regalos Empresariales</a></li>
        <li><a href="exclusivos.html" class="hover:text-white transition">Exclusivos</a></li>
        <li><a href="termos.html" class="hover:text-white transition">Termos</a></li>
      </ul>
    </div>

    <!-- Columna 4: Contacto y Redes -->
    <div class="space-y-4">
      <h3 class="text-sm font-black uppercase tracking-widest text-white border-b border-white/20 pb-2.5 inline-block">Contacto</h3>
      <p class="text-sm text-gray-300 font-medium leading-relaxed">Contactanos por WhatsApp o nuestras redes oficiales.</p>
      <ul class="space-y-2.5 text-sm font-medium text-gray-300">
        <li>
          <a href="https://wa.me/5492236872975" target="_blank" rel="noopener noreferrer" class="hover:text-white transition inline-flex items-center gap-2.5">
            <i class="fa-brands fa-whatsapp text-base text-emerald-400"></i>
            54 9 2236872975
          </a>
        </li>
        <li>
          <a href="mailto:eltallerdistribuidora@gmail.com" class="hover:text-white transition inline-flex items-center gap-2.5">
            <i class="fa-solid fa-envelope text-base text-gray-400"></i>
            eltallerdistribuidora@gmail.com
          </a>
        </li>
      </ul>
      <div class="flex items-center gap-3 pt-1">
        <a href="https://www.instagram.com/eltaller.distribuidora/" target="_blank" rel="noopener noreferrer"
           class="et-btn-icon et-press w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white"
           aria-label="Instagram">
          <i class="fa-brands fa-instagram text-base"></i>
        </a>
        <a href="#" class="et-btn-icon et-press w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white" aria-label="Facebook">
          <i class="fa-brands fa-facebook-f text-base"></i>
        </a>
        <a href="#" class="et-btn-icon et-press w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white" aria-label="TikTok">
          <i class="fa-brands fa-tiktok text-base"></i>
        </a>
      </div>
    </div>

  </div>

  <!-- Barra inferior de Copyright -->
  <div class="border-t border-white/10 pt-5 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
    Copyright 2026 - El Taller Distribuidora. Todos los derechos reservados.
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
   class="fixed bottom-6 right-6 z-[60] w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#1B4332] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(27,67,50,0.45)] et-btn-icon et-press hover:bg-[#2D6A4F] transition-colors duration-280 ease-premium">
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
