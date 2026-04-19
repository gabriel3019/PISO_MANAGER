(function () {
  // Inyectar CSS del menú
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '../css/menu-lateral.css';
  document.head.appendChild(link);

  const pages = {
    inicio:      { title: 'Inicio',         file: '../html/homeUser.html' },
    gastos:      { title: 'Gastos Comunes', file: '../html/gastos.html' },
    tareas:      { title: 'Tareas',         file: '../html/tareasUser.html' },
    calendario:  { title: 'Calendario',     file: '../html/calendario.html' },
    piso:        { title: 'Mi Piso',        file: '../html/piso.html' },
    compañeros:  { title: 'Compañeros',     file: '../html/compañeros.html' },
    incidencias: { title: 'Incidencias',    file: '../html/incidenciasUser.html' },
    ajustes:     { title: 'Ajustes',        file: '../html/ajustes.html' },
  };

  // Crear el Sidebar
  const nav = document.createElement('nav');
  nav.className = 'sidebar';
  nav.innerHTML = `
    <div class="sidebar__user">
      <div class="sidebar__avatar">U1</div>
      <div>
        <p class="sidebar__username">Usuario1</p>
        <p class="sidebar__role">Panel de inicio</p>
      </div>
    </div>
    <div class="sidebar__group">
      <p class="sidebar__group-label">Principal</p>
      <ul class="sidebar__list">
        <li><a href="./html/homeUser.html" class="sidebar__link" data-page="inicio"><img src="../css/icons/house.svg"> Inicio</a></li>
        <li><a href="#gastos" class="sidebar__link" data-page="gastos"><img src="../css/icons/euro.svg"> Gastos Comunes<span class="sidebar__badge">3</span></a></li>
        <li><a href="./html/tareasUser.html" class="sidebar__link" data-page="tareas"><img src="../css/icons/#check.svg"> Tareas<span class="sidebar__badge">5</span></a></li>
        <li><a href="#calendario" class="sidebar__link" data-page="calendario"><img src="../css/icons/calendar.svg"> Calendario</a></li>
      </ul>
    </div>
    <div class="sidebar__group">
      <p class="sidebar__group-label">Piso</p>
      <ul class="sidebar__list">
        <li><a href="#piso" class="sidebar__link" data-page="piso"><img src="../css/icons/house.svg"> Mi Piso</a></li>
        <li><a href="#compañeros" class="sidebar__link" data-page="compañeros"><img src="../css/icons/users.svg"> Compañeros</a></li>
        <li><a href="#incidencias" class="sidebar__link sidebar__link--active" data-page="incidencias"><img src="../css/icons/circle-alert.svg"> Incidencias<span class="sidebar__badge">2</span></a></li>
      </ul>
    </div>
    <div class="sidebar__group">
      <p class="sidebar__group-label">Cuenta</p>
      <ul class="sidebar__list">
        <li><a href="#ajustes" class="sidebar__link" data-page="ajustes"><img src="../css/icons/settings.svg"> Ajustes</a></li>
      </ul>
    </div>
    <div class="sidebar__footer">
      <a href="#" class="sidebar__logout"><img src="../css/icons/log-out.svg"> Cerrar sesión</a>
    </div>
  `;

  // Contenedor donde se cargará el contenido dinámico
  const mainContent = document.createElement('div');
  mainContent.id = 'dynamic-container';
  mainContent.style.cssText = 'flex:1; overflow-y: auto;';

  // Mapa de funciones de inicialización por página
  const pageInits = {
    incidencias: () => {
      if (typeof initIncidencias === 'function') initIncidencias();
    },
    // Añade aquí otras páginas cuando tengan su propio init:
    // tareas: () => { if (typeof initTareas === 'function') initTareas(); },
  };

  function loadPage(pageKey) {
    const page = pages[pageKey];
    if (!page) return;

    fetch(page.file)
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.getElementById('page-body');

        mainContent.innerHTML = `
          <div class="page-content">
            ${body ? body.innerHTML : '<p style="color:orange;">⚠️ Error: El archivo cargado no tiene un id="page-body"</p>'}
          </div>
        `;

        // Cargar el script de la página si existe y luego inicializar
        loadPageScript(pageKey);
      })
      .catch(() => {
        mainContent.innerHTML = `<p>⚠️ No se pudo cargar el archivo: ${page.file}</p>`;
      });
  }

  function loadPageScript(pageKey) {
    // Eliminar script anterior de página si existía
    const old = document.getElementById('page-script');
    if (old) old.remove();

    const scriptMap = {
      incidencias: '../js/incidencias.js',
      // tareas: '../js/tareas.js',
    };

    const src = scriptMap[pageKey];
    if (!src) return;

    const script = document.createElement('script');
    script.id = 'page-script';
    script.src = src;
    script.onload = () => {
      // Una vez cargado el script, llamar a su función de init
      if (pageInits[pageKey]) pageInits[pageKey]();
    };
    document.body.appendChild(script);
  }

  // Eventos de click en el menú
  nav.querySelectorAll('.sidebar__link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      nav.querySelectorAll('.sidebar__link').forEach(l => l.classList.remove('sidebar__link--active'));
      this.classList.add('sidebar__link--active');
      loadPage(this.dataset.page);
    });
  });

  // Inicialización del layout
  document.body.style.display = 'flex';
  document.body.style.minHeight = '100vh';
  document.body.style.margin = '0';
  document.body.innerHTML = '';
  document.body.appendChild(nav);
  document.body.appendChild(mainContent);

  // Cargar incidencias por defecto
  loadPage('incidencias');

})();