(function () {

  // Inyecta el CSS del sidebar
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'menu-lateral.css';
  document.head.appendChild(link);

  // Estructura del sidebar
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
        <li><a href="#" class="sidebar__link" data-page="inicio">
          <span class="sidebar__icon">🏠</span> Inicio
        </a></li>
        <li><a href="#" class="sidebar__link" data-page="gastos">
          <span class="sidebar__icon">€</span> Gastos Comunes
          <span class="sidebar__badge">3</span>
        </a></li>
        <li><a href="#" class="sidebar__link" data-page="tareas">
          <span class="sidebar__icon">✔</span> Tareas
          <span class="sidebar__badge">5</span>
        </a></li>
        <li><a href="#" class="sidebar__link" data-page="calendario">
          <span class="sidebar__icon">📅</span> Calendario
        </a></li>
      </ul>
    </div>

    <div class="sidebar__group">
      <p class="sidebar__group-label">Piso</p>
      <ul class="sidebar__list">
        <li><a href="#" class="sidebar__link" data-page="piso">
          <span class="sidebar__icon">🏠</span> Mi Piso
        </a></li>
        <li><a href="#" class="sidebar__link" data-page="compañeros">
          <span class="sidebar__icon">👥</span> Compañeros
        </a></li>
        <li><a href="#" class="sidebar__link sidebar__link--active" data-page="incidencias">
          <span class="sidebar__icon">⚠️</span> Incidencias
          <span class="sidebar__badge">2</span>
        </a></li>
      </ul>
    </div>

    <div class="sidebar__group">
      <p class="sidebar__group-label">Cuenta</p>
      <ul class="sidebar__list">
        <li><a href="#" class="sidebar__link" data-page="ajustes">
          <span class="sidebar__icon">⚙️</span> Ajustes
        </a></li>
      </ul>
    </div>

    <div class="sidebar__footer">
      <a href="#" class="sidebar__logout">
        <span>→</span> Cerrar sesión
      </a>
    </div>
  `;

  // Manejo del link activo
  nav.querySelectorAll('.sidebar__link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      nav.querySelectorAll('.sidebar__link').forEach(function (l) {
        l.classList.remove('sidebar__link--active');
      });
      this.classList.add('sidebar__link--active');
    });
  });

  // Inserta el sidebar y aplica flex al body
  document.body.style.display = 'flex';
  document.body.style.minHeight = '100vh';
  document.body.insertBefore(nav, document.body.firstChild);

})();