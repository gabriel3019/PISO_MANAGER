const API_URL = "/PISO_MANAGER/src/php/calendario.php";

const monthTitle = document.getElementById("month-title");
const pageTitle = document.getElementById("page-title");
const calendarGrid = document.getElementById("calendar-grid");
const eventsList = document.getElementById("events-list");
const calendarViewSelect = document.getElementById("calendar-view");

const repeatFields = document.getElementById("repeat-fields");
const taskRepeatInput = document.getElementById("task-repeat");
const repeatOptions = document.getElementById("repeat-options");

const eventWarning = document.getElementById("event-warning");
const modalAdd = document.getElementById("modal-add");
const modalDetails = document.getElementById("modal-details");

const addEventForm = document.getElementById("add-event-form");
const eventTitleInput = document.getElementById("event-title");
const eventTypeInput = document.getElementById("event-type");
const eventDateInput = document.getElementById("event-date");
const eventTimeInput = document.getElementById("event-time");

const generalFields = document.getElementById("general-fields");
const peopleFields = document.getElementById("people-fields");
const timeFields = document.getElementById("time-fields");
const eventPeopleInputs = document.querySelectorAll('input[name="event-people"]');

const detailDayLabel = document.getElementById("detail-day-label");
const detailPersonLabel = document.getElementById("detail-person-label");
const detailTimeBox = document.getElementById("detail-time-box");

const detailBadge = document.getElementById("detail-badge");
const detailTitle = document.getElementById("detail-title");
const detailType = document.getElementById("detail-type");
const detailDay = document.getElementById("detail-day");
const detailTime = document.getElementById("detail-time");
const detailPerson = document.getElementById("detail-person");
const detailStatus = document.getElementById("detail-status");

const resolveIncidenciaBtn = document.getElementById("resolve-incidencia-btn");
const completeTaskBtn = document.getElementById("complete-task-btn");

const modalDay = document.getElementById("modal-day");
const dayModalTitle = document.getElementById("day-modal-title");
const dayEventsList = document.getElementById("day-events-list");

const repeatWeeksInput = document.getElementById("repeat-end");
const repeatTypeInput = document.getElementById("repeat-type");
const customRepeatBox = document.getElementById("custom-repeat-box");
const repeatIntervalInput = document.getElementById("repeat-interval");
const repeatFrequencyInput = document.getElementById("repeat-frequency");
const customWeekDays = document.getElementById("custom-week-days");

const repeatEndInput = document.getElementById("repeat-end");
const repeatEndCustomBox = document.getElementById("repeat-end-custom-box");
const repeatEndDateInput = document.getElementById("repeat-end-date");

const btnToday = document.getElementById("btn-today");
const btnSearch = document.getElementById("btn-search");
const modalSearch = document.getElementById("modal-search");
const closeSearchModal = document.getElementById("close-search-modal");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");

const repeatStep = document.getElementById("repeat-step");
const nextRepeatBtn = document.getElementById("next-repeat");
const backRepeatBtn = document.getElementById("back-repeat");
const saveEventBtn = document.getElementById("save-event");

const deleteEventBtn = document.getElementById("delete-event-btn");
const modalDeleteRepeat = document.getElementById("modal-delete-repeat");
const closeDeleteRepeatBtn = document.getElementById("close-delete-repeat");
const deleteOnlyOneBtn = document.getElementById("delete-only-one");
const deleteFutureTasksBtn = document.getElementById("delete-future-tasks");

const modalDeleteConfirm = document.getElementById("modal-delete-confirm");
const closeDeleteConfirmBtn = document.getElementById("close-delete-confirm");
const cancelDeleteConfirmBtn = document.getElementById("cancel-delete-confirm");
const confirmDeleteEventBtn = document.getElementById("confirm-delete-event");
const deleteConfirmText = document.getElementById("delete-confirm-text");

const usuarioActual =
    JSON.parse(
        sessionStorage.getItem("usuario")
    );

function cargarUsuario() {

    document.getElementById(
        "nombreUsuario"
    ).textContent =
        usuarioActual?.nombre || "";

}

nextRepeatBtn.addEventListener("click", () => {
    generalFields.classList.add("hidden");
    peopleFields.classList.add("hidden");
    repeatFields.classList.add("hidden");

    repeatStep.classList.remove("hidden");
    repeatOptions.classList.remove("hidden");

    nextRepeatBtn.classList.add("hidden");
    backRepeatBtn.classList.remove("hidden");
    saveEventBtn.classList.remove("hidden");
});

backRepeatBtn.addEventListener("click", () => {
    repeatStep.classList.add("hidden");

    generalFields.classList.remove("hidden");
    peopleFields.classList.remove("hidden");
    repeatFields.classList.remove("hidden");

    nextRepeatBtn.classList.remove("hidden");
    backRepeatBtn.classList.add("hidden");
    saveEventBtn.classList.add("hidden");
});

let repeatDayInputs = document.querySelectorAll('input[name="repeat-days"]');
let currentDate = new Date();
let selectedEvent = null;
let eventos = [];
let currentView = "month";
calendarViewSelect.value = "month";

const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const typeNames = {
    incidencia: "Incidencia",
    tarea: "Tarea",
    evento: "Evento"
};

function openModal(modal) {
    modal.classList.remove("hidden");
}

function closeModal(modal) {
    modal.classList.add("hidden");
}

function clearWarning() {
    eventWarning.textContent = "";
    eventWarning.classList.remove("show");
}

function formatDateText(fecha) {
    const [anio, mes, dia] = fecha.split("-");
    return `${parseInt(dia)} de ${monthNames[parseInt(mes, 10) - 1]} de ${anio}`;
}

function formatRangeText(inicio, fin) {
    if (!inicio && !fin) return "-";
    if (inicio && !fin) return `${formatDateText(inicio)} - sin fecha de fin`;
    if (!inicio && fin) return formatDateText(fin);

    if (inicio === fin) {
        return formatDateText(inicio);
    }

    return `${formatDateText(inicio)} - ${formatDateText(fin)}`;
}

function dateIsBetween(date, start, end) {
    return date >= start && date <= end;
}

function getMonthRange(year, month) {
    const monthString = String(month + 1).padStart(2, "0");
    const firstDay = `${year}-${monthString}-01`;
    const lastDayNumber = new Date(year, month + 1, 0).getDate();
    const lastDay = `${year}-${monthString}-${String(lastDayNumber).padStart(2, "0")}`;
    return { firstDay, lastDay };
}

function openDayModal(fecha, eventosDelDia) {
    dayModalTitle.textContent = `Eventos del ${formatDateText(fecha)}`;
    dayEventsList.innerHTML = "";

    if (eventosDelDia.length === 0) {
        dayEventsList.innerHTML = "<p>No hay eventos este día.</p>";
    } else {
        eventosDelDia.forEach((evento) => {
            const card = document.createElement("div");
            card.className = `day-event-card ${evento.tipo}`;

            card.innerHTML = `
                <div class="day-event-title">${evento.titulo}</div>
                <div class="day-event-meta">
                    ${typeNames[evento.tipo]} ${evento.hora ? "· " + evento.hora : ""}
                </div>
            `;

            card.addEventListener("click", (e) => {
                e.stopPropagation();
                closeModal(modalDay);
                selectedEvent = evento;
                showEventDetails(evento);
            });

            dayEventsList.appendChild(card);
        });
    }

    openModal(modalDay);
}

async function cargarEventos() {
    try {
        const response = await fetch(`${API_URL}?action=obtener&id_piso=1`);
        const texto = await response.text();

        console.log("Respuesta cruda del PHP:", texto);

        const data = JSON.parse(texto);

        if (data.success) {
            eventos = data.eventos;
        } else {
            console.error("Error:", data.message);
            eventos = [];
        }
    } catch (error) {
        console.error("Error al cargar eventos:", error);
        eventos = [];
    }

    renderCalendar(currentDate);
}

async function guardarEventoEnBD(evento) {
    try {
        const response = await fetch(`${API_URL}?action=crear`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(evento)
        });

        const data = await response.json();

        if (data.success) {
            closeModal(modalAdd);
            await cargarEventos();
        } else {
            eventWarning.textContent = data.message || "No se pudo guardar el evento.";
            eventWarning.classList.add("show");
        }
    } catch (error) {
        console.error("Error al guardar evento:", error);
        eventWarning.textContent = "Error de conexión con el servidor.";
        eventWarning.classList.add("show");
    }
}

async function actualizarEstadoEvento(id_evento, estado) {
    try {
        const response = await fetch(`${API_URL}?action=actualizar_estado`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id_evento, estado })
        });

        const data = await response.json();

        if (data.success) {
            closeModal(modalDetails);
            await cargarEventos();
        } else {
            console.error(data.message);
        }
    } catch (error) {
        console.error("Error al actualizar estado:", error);
    }
}

async function eliminarEvento(id_evento) {
    try {
        const response = await fetch(`${API_URL}?action=eliminar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id_evento })
        });

        const data = await response.json();

        if (data.success) {

            closeModal(modalDetails);
            closeModal(modalDeleteRepeat);
            closeModal(modalDeleteConfirm);

            await cargarEventos();

        } else {
            alert(data.message || "No se pudo eliminar.");
        }

    } catch (error) {
        console.error("Error al eliminar:", error);
    }
}

async function eliminarTareasFuturas(evento) {
    try {
        const response = await fetch(`${API_URL}?action=eliminar_futuras`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                titulo: evento.titulo,
                tipo: evento.tipo,
                fecha: evento.fecha
            })
        });

        const data = await response.json();

        if (data.success) {
            closeModal(modalDetails);
            closeModal(modalDeleteRepeat);
            closeModal(modalDeleteConfirm);
            await cargarEventos();
        } else {
            alert(data.message || "No se pudieron eliminar las tareas futuras.");
        }
    } catch (error) {
        console.error("Error al eliminar futuras:", error);
    }
}

function incidenciaVisibleEnMes(incidencia, year, month) {
    if (incidencia.estado === "resuelta") return false;

    const { firstDay, lastDay } = getMonthRange(year, month);

    const fechaInicio = incidencia.fechaInicio || incidencia.fecha;
    const fechaFin = incidencia.fechaFin || fechaInicio;

    return fechaInicio <= lastDay && fechaFin >= firstDay;
}

function getEventMainDate(evento) {
    return evento.fechaInicio || evento.fecha;
}

function getVisibleEventsForDate(fullDate) {
    return eventos.filter((evento) => {
        if (evento.tipo === "tarea" && evento.estado === "completada") return false;

        if (evento.tipo === "incidencia") {
            if (evento.estado === "resuelta") return false;

            const fechaInicio = evento.fechaInicio || evento.fecha;
            const fechaFin = evento.fechaFin || fechaInicio;

            return fullDate >= fechaInicio && fullDate <= fechaFin;
        }

        return evento.fecha === fullDate;
    });
}

function paintEventsInDay(dayBox, fullDate, maxEvents = 1) {
    const eventosDelDia = getVisibleEventsForDate(fullDate);
    const eventsContainer = document.createElement("div");
    eventsContainer.classList.add("day-events");

    eventosDelDia.slice(0, maxEvents).forEach((evento) => {
        let icono = "";

        if (evento.tipo === "evento" && evento.personas && evento.personas.length > 0) icono = " 👥";
        if (evento.tipo === "tarea" && evento.personas && evento.personas.length > 0) icono = evento.personas.length === 1 ? " 👤" : " 👥";
        if (evento.tipo === "incidencia") icono = " ⚠️";

        const completedClass = evento.tipo === "tarea" && evento.estado === "completada" ? "completed-task" : "";
        const eventDiv = document.createElement("div");
        eventDiv.className = `event ${evento.tipo} ${completedClass}`;

        eventDiv.innerHTML = `
            <span class="event-text">${evento.titulo}</span>
            <span class="event-icon">${icono}</span>
        `;

        eventDiv.addEventListener("click", (e) => {
            e.stopPropagation();
            selectedEvent = evento;
            showEventDetails(evento);
        });

        eventsContainer.appendChild(eventDiv);
    });

    if (eventosDelDia.length > maxEvents) {
        const moreDiv = document.createElement("div");
        moreDiv.classList.add("more-events");
        moreDiv.textContent = `+${eventosDelDia.length - maxEvents} más`;

        moreDiv.addEventListener("click", (e) => {
            e.stopPropagation();
            openDayModal(fullDate, eventosDelDia);
        });

        eventsContainer.appendChild(moreDiv);
    }

    dayBox.appendChild(eventsContainer);
    dayBox.addEventListener("click", () => openDayModal(fullDate, eventosDelDia));
}

function renderCalendar(date) {
    calendarGrid.innerHTML = "";
    calendarGrid.className = "calendar-grid";

    if (currentView === "day") {
        renderDayCalendar(date);
    } else if (currentView === "week") {
        renderWeekCalendar(date);
    } else if (currentView === "year") {
        renderYearCalendar(date);
    } else {
        renderMonthCalendar(date);
    }

    renderUpcomingEvents();
}

function renderMonthCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const tituloActual = `${monthNames[month]} de ${year}`;

    if (monthTitle) {
        monthTitle.textContent = tituloActual;
    }

    pageTitle.textContent = tituloActual;

    calendarGrid.classList.add("month-view");

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const totalDays = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startDay - 1; i >= 0; i--) {
        const dayBox = document.createElement("div");
        dayBox.className = "calendar-day other-month";
        dayBox.innerHTML = `<div class="calendar-day-number">${prevMonthLastDay - i}</div>`;
        calendarGrid.appendChild(dayBox);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayBox = document.createElement("div");
        dayBox.className = "calendar-day";

        const dayString = String(day).padStart(2, "0");
        const monthString = String(month + 1).padStart(2, "0");
        const fullDate = `${year}-${monthString}-${dayString}`;

        dayBox.innerHTML = `<div class="calendar-day-number">${day}</div>`;
        paintEventsInDay(dayBox, fullDate, 1);
        calendarGrid.appendChild(dayBox);
    }

    const totalCells = calendarGrid.children.length;
    const remaining = 42 - totalCells;

    for (let i = 1; i <= remaining; i++) {
        const dayBox = document.createElement("div");
        dayBox.className = "calendar-day other-month";
        dayBox.innerHTML = `<div class="calendar-day-number">${i}</div>`;
        calendarGrid.appendChild(dayBox);
    }
}

function renderWeekCalendar(date) {
    document.querySelector(".calendar-weekdays")?.classList.add("hidden");

    calendarGrid.innerHTML = "";
    calendarGrid.className = "calendar-grid week-view";

    const baseDate = new Date(date);
    const weekDay = baseDate.getDay() === 0 ? 6 : baseDate.getDay() - 1;

    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - weekDay);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    pageTitle.textContent =
        `Semana del ${monday.getDate()} de ${monthNames[monday.getMonth()]} al ${sunday.getDate()} de ${monthNames[sunday.getMonth()]} de ${sunday.getFullYear()}`;

    const diasSemana = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

    const weekHeader = document.createElement("div");
    weekHeader.className = "week-header-row";

    weekHeader.appendChild(document.createElement("div"));

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + i);

        const dayHeader = document.createElement("div");
        dayHeader.className = "week-day-header";
        dayHeader.innerHTML = `
            <span>${diasSemana[i]}</span>
            <strong>${dayDate.getDate()}</strong>
        `;

        weekHeader.appendChild(dayHeader);
    }

    calendarGrid.appendChild(weekHeader);

    for (let hour = 0; hour < 24; hour++) {
        const row = document.createElement("div");
        row.className = "week-hour-row";

        const hourLabel = document.createElement("div");
        hourLabel.className = "week-hour-label";
        hourLabel.textContent = `${String(hour).padStart(2, "0")}:00`;

        row.appendChild(hourLabel);

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + i);

            const fullDate = formatearFecha(dayDate);

            const cell = document.createElement("div");
            cell.className = "week-hour-cell";

            getVisibleEventsForDate(fullDate)
                .filter(evento =>
                    evento.hora &&
                    evento.hora.startsWith(String(hour).padStart(2, "0"))
                )
                .forEach(evento => {
                    const eventDiv = document.createElement("div");
                    eventDiv.className = `week-hour-event ${evento.tipo}`;
                    eventDiv.textContent = evento.titulo;

                    eventDiv.addEventListener("click", () => {
                        selectedEvent = evento;
                        showEventDetails(evento);
                    });

                    cell.appendChild(eventDiv);
                });

            row.appendChild(cell);
        }

        calendarGrid.appendChild(row);
    }
}

function renderDayCalendar(date) {
    calendarGrid.innerHTML = "";
    calendarGrid.className = "calendar-grid day-view";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const fullDate = `${year}-${month}-${day}`;

    const tituloActual = `Hoy · ${day} de ${monthNames[date.getMonth()]} de ${year}`;

    const diaSemanaActual = date.getDay() === 0 ? 6 : date.getDay() - 1;

    const diasSemana = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

    pageTitle.textContent = tituloActual;

    const eventosDelDia = getVisibleEventsForDate(fullDate);

    /* ===== AÑADIR ESTO ===== */

    const weekdaysRow = document.createElement("div");
    weekdaysRow.className = "day-weekdays-row";

    diasSemana.forEach((dia, index) => {

        const diaEl = document.createElement("div");
        diaEl.className = "day-weekday";

        if (index === diaSemanaActual) {
            diaEl.classList.add("active-day");
        }

        diaEl.textContent = dia;

        weekdaysRow.appendChild(diaEl);
    });

    calendarGrid.appendChild(weekdaysRow);

    /* ===== FIN ===== */

    for (let hour = 0; hour < 24; hour++) {

        const hourText = `${String(hour).padStart(2, "0")}:00`;

        const hourRow = document.createElement("div");
        hourRow.className = "day-hour-row";

        const hourLabel = document.createElement("div");
        hourLabel.className = "day-hour-label";
        hourLabel.textContent = hourText;

        const hourContent = document.createElement("div");
        hourContent.className = "day-hour-content";

        eventosDelDia
            .filter(evento =>
                evento.hora &&
                evento.hora.startsWith(String(hour).padStart(2, "0"))
            )
            .forEach(evento => {

                const eventDiv = document.createElement("div");
                eventDiv.className = `day-hour-event ${evento.tipo}`;

                eventDiv.textContent =
                    `${evento.hora} · ${evento.titulo}`;

                eventDiv.addEventListener("click", () => {
                    selectedEvent = evento;
                    showEventDetails(evento);
                });

                hourContent.appendChild(eventDiv);
            });

        hourRow.appendChild(hourLabel);
        hourRow.appendChild(hourContent);

        calendarGrid.appendChild(hourRow);
    }
}

function renderYearCalendar() {

    calendarGrid.innerHTML = "";

    const tituloActual = `Año ${currentDate.getFullYear()}`;

    if (monthTitle) {
        monthTitle.textContent = tituloActual;
    }

    pageTitle.textContent = tituloActual;
    const yearContainer = document.createElement("div");
    yearContainer.className = "year-view";

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril",
        "Mayo", "Junio", "Julio", "Agosto",
        "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    meses.forEach((mes, index) => {

        const monthCard = document.createElement("div");
        monthCard.className = "year-month-card";

        const firstDay = new Date(currentDate.getFullYear(), index, 1);
        const lastDay = new Date(currentDate.getFullYear(), index + 1, 0);

        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        const totalDays = lastDay.getDate();

        let daysHTML = "";

        // Espacios vacíos antes del día 1
        for (let i = 0; i < startDay; i++) {
            daysHTML += `<div class="year-day empty"></div>`;
        }

        // Días del mes
        for (let day = 1; day <= totalDays; day++) {

            const fechaCompleta =
                `${currentDate.getFullYear()}-${String(index + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            const tieneEvento = eventos.some(evento => {

                if (evento.tipo === "incidencia") {

                    if (evento.estado === "resuelta") return false;

                    const fechaFin = evento.fechaFin || evento.fechaInicio;

                    return fechaCompleta >= evento.fechaInicio &&
                        fechaCompleta <= fechaFin;
                }

                return evento.fecha === fechaCompleta;
            });

            daysHTML += `
                <div class="year-day ${tieneEvento ? "has-event" : ""}">
                    ${day}
                </div>
            `;
        }

        monthCard.innerHTML = `
            <h3>${mes}</h3>

            <div class="year-days-grid">
                ${daysHTML}
            </div>
        `;

        yearContainer.appendChild(monthCard);
    });

    calendarGrid.appendChild(yearContainer);
}

function renderUpcomingEvents() {
    eventsList.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const eventosMes = eventos.filter((evento) => {

        if (evento.tipo === "tarea" && evento.estado === "completada") return false;

        if (evento.tipo === "incidencia") {
            return incidenciaVisibleEnMes(evento, year, month);
        }

        const [anio, mes] = evento.fecha.split("-").map(Number);
        return anio === year && (mes - 1) === month;
    });

    if (eventosMes.length === 0) {
        eventsList.innerHTML = "<p>No hay eventos este mes.</p>";
        return;
    }

    eventosMes
        .sort((a, b) => {
            const fechaA =
                a.tipo === "incidencia"
                    ? (a.fechaInicio || a.fecha)
                    : `${a.fecha}T${a.hora || "00:00"}`;

            const fechaB =
                b.tipo === "incidencia"
                    ? (b.fechaInicio || b.fecha)
                    : `${b.fecha}T${b.hora || "00:00"}`;

            return fechaA.localeCompare(fechaB);
        })
        .forEach((evento) => {
            const item = document.createElement("div");
            item.className = `next-event ${evento.tipo === "tarea" && evento.estado === "completada" ? "completed-task" : ""}`;

            let meta = "";
            if (evento.tipo === "incidencia") {
                const fechaInicio = evento.fechaInicio || evento.fecha;

                const textoFecha = evento.fechaFin
                    ? formatRangeText(fechaInicio, evento.fechaFin)
                    : formatDateText(fechaInicio);

                meta = `${typeNames[evento.tipo]} · ${textoFecha}`;
            } else if (evento.tipo === "tarea") {
                const personasTexto = evento.personas && evento.personas.length > 0
                    ? ` · ${evento.personas.join(", ")}`
                    : evento.persona
                        ? ` · ${evento.persona}`
                        : "";

                meta = `${typeNames[evento.tipo]} · ${formatDateText(evento.fecha)}${personasTexto}`;
            } else {
                const personasTexto = evento.personas && evento.personas.length > 0
                    ? ` · ${evento.personas.join(", ")}`
                    : "";

                meta = `${typeNames[evento.tipo]} · ${formatDateText(evento.fecha)} · ${evento.hora}${personasTexto}`;

            }

            item.innerHTML = `
        <div class="next-event-title">${evento.titulo}</div>
        <div class="next-event-meta">${meta}</div>
      `;

            item.addEventListener("click", () => {
                selectedEvent = evento;
                showEventDetails(evento);
            });

            eventsList.appendChild(item);
        });
}

function addEventClickListeners() {
    const eventElements = document.querySelectorAll(".event");

    eventElements.forEach((eventElement) => {
        eventElement.addEventListener("click", (e) => {
            e.stopPropagation();

            const evento = {
                id_evento: parseInt(eventElement.dataset.id, 10),
                titulo: eventElement.dataset.title,
                tipo: eventElement.dataset.type,
                fecha: eventElement.dataset.date,
                fechaInicio: eventElement.dataset.start,
                fechaFin: eventElement.dataset.end,
                hora: eventElement.dataset.time,
                persona: eventElement.dataset.person,
                personas: JSON.parse(eventElement.dataset.people || "[]"),
                estado: eventElement.dataset.status
            };

            selectedEvent = evento;
            showEventDetails(evento);
        });
    });
}
function showEventDetails(evento) {
    selectedEvent = evento;

    detailBadge.className = `detail-badge ${evento.tipo}`;
    detailBadge.textContent = typeNames[evento.tipo];

    detailTitle.textContent = evento.titulo;
    detailType.textContent = typeNames[evento.tipo];

    resolveIncidenciaBtn.classList.add("hidden");
    completeTaskBtn.classList.add("hidden");
    completeTaskBtn.classList.remove("btn-warning");
    completeTaskBtn.classList.add("btn-success");

    detailTimeBox.classList.remove("hidden");
    detailDayLabel.textContent = "Fecha / rango";
    detailPersonLabel.textContent = "Personas asignadas";

    if (evento.tipo === "incidencia") {
        detailDayLabel.textContent = "Fecha / rango";
        const fechaInicio = evento.fechaInicio || evento.fecha;

        detailDay.textContent = evento.fechaFin
            ? formatRangeText(fechaInicio, evento.fechaFin)
            : formatDateText(fechaInicio);
        detailTimeBox.classList.add("hidden");
        detailPerson.textContent = "No aplica";
        detailStatus.textContent = evento.estado === "resuelta" ? "Resuelta" : "Activa";
        resolveIncidenciaBtn.classList.remove("hidden");

    } else if (evento.tipo === "tarea") {
        detailDayLabel.textContent = "Fecha";
        detailDay.textContent = formatDateText(evento.fecha);
        detailTimeBox.classList.add("hidden");

        const personas = evento.personas && evento.personas.length > 0
            ? evento.personas
            : evento.persona
                ? [evento.persona]
                : [];

        detailPersonLabel.textContent = personas.length === 1
            ? "Persona asignada"
            : "Personas asignadas";

        detailPerson.textContent = personas.length > 0
            ? personas.join(", ")
            : "-";

        detailStatus.textContent = evento.estado === "completada" ? "Completada" : "Pendiente";

        if (evento.estado === "completada") {
            completeTaskBtn.textContent = "Marcar como no completada";
            completeTaskBtn.classList.remove("btn-success");
            completeTaskBtn.classList.add("btn-warning");
            completeTaskBtn.classList.remove("hidden");
        } else {
            completeTaskBtn.textContent = "Completada";
            completeTaskBtn.classList.remove("btn-warning");
            completeTaskBtn.classList.add("btn-success");
            completeTaskBtn.classList.remove("hidden");
        }

    } else {
        detailDayLabel.textContent = "Fecha";
        detailDay.textContent = formatDateText(evento.fecha);
        detailTimeBox.classList.remove("hidden");
        detailTime.textContent = evento.hora || "-";

        const personas = evento.personas || [];

        detailPersonLabel.textContent = personas.length === 1
            ? "Persona asignada"
            : "Personas asignadas";

        detailPerson.textContent = personas.length > 0
            ? personas.join(", ")
            : "No asignadas";

        detailStatus.textContent = "Programado";
    }

    openModal(modalDetails);
}
function updateFormByType() {
    const tipo = eventTypeInput.value;

    generalFields.classList.add("hidden");
    peopleFields.classList.add("hidden");
    timeFields.classList.add("hidden");
    repeatFields.classList.add("hidden");

    if (tipo === "tarea") {
        generalFields.classList.remove("hidden");
        peopleFields.classList.remove("hidden");
        repeatFields.classList.remove("hidden");
    }

    if (tipo === "evento") {
        generalFields.classList.remove("hidden");
        peopleFields.classList.remove("hidden");
        timeFields.classList.remove("hidden");
    }
}

taskRepeatInput.addEventListener("change", () => {
    if (taskRepeatInput.checked) {
        nextRepeatBtn.classList.remove("hidden");
        saveEventBtn.classList.add("hidden");

        repeatOptions.classList.remove("hidden");
        repeatTypeInput.value = "weekly";
    } else {
        nextRepeatBtn.classList.add("hidden");
        backRepeatBtn.classList.add("hidden");
        saveEventBtn.classList.remove("hidden");

        repeatStep.classList.add("hidden");
        repeatOptions.classList.add("hidden");
        customRepeatBox.classList.add("hidden");
        customWeekDays.classList.add("hidden");

        generalFields.classList.remove("hidden");
        peopleFields.classList.remove("hidden");
        repeatFields.classList.remove("hidden");
    }
});

repeatTypeInput.addEventListener("change", () => {
    if (repeatTypeInput.value === "custom") {
        customRepeatBox.classList.remove("hidden");
    } else {
        customRepeatBox.classList.add("hidden");
    }
});

repeatFrequencyInput.addEventListener("change", () => {
    if (repeatFrequencyInput.value === "week") {
        customWeekDays.classList.remove("hidden");
    } else {
        customWeekDays.classList.add("hidden");
    }
});

repeatEndInput.addEventListener("change", () => {
    if (repeatEndInput.value === "custom") {
        repeatEndCustomBox.classList.remove("hidden");
    } else {
        repeatEndCustomBox.classList.add("hidden");
    }
});

function formatearFecha(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function obtenerFechasRepetidas(fechaInicio) {
    const fechas = [];
    const tipoRepeticion = repeatTypeInput.value;

    const [anio, mes, dia] = fechaInicio.split("-").map(Number);
    const inicio = new Date(anio, mes - 1, dia);

    let fin;

    if (repeatEndInput.value === "custom") {
        if (!repeatEndDateInput.value) {
            return [];
        }

        const [anioFin, mesFin, diaFin] = repeatEndDateInput.value.split("-").map(Number);
        fin = new Date(anioFin, mesFin - 1, diaFin);
    } else {
        const semanasDuracion = parseInt(repeatEndInput.value, 10);
        fin = new Date(inicio);
        fin.setDate(fin.getDate() + semanasDuracion * 7);
    }

    if (tipoRepeticion === "daily") {
        for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
            fechas.push(formatearFecha(fecha));
        }
    }

    if (tipoRepeticion === "weekly") {
        for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 7)) {
            fechas.push(formatearFecha(fecha));
        }
    }

    if (tipoRepeticion === "biweekly") {
        for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 14)) {
            fechas.push(formatearFecha(fecha));
        }
    }

    if (tipoRepeticion === "monthly") {
        for (let fecha = new Date(inicio); fecha <= fin; fecha.setMonth(fecha.getMonth() + 1)) {
            fechas.push(formatearFecha(fecha));
        }
    }

    if (tipoRepeticion === "yearly") {
        for (let fecha = new Date(inicio); fecha <= fin; fecha.setFullYear(fecha.getFullYear() + 1)) {
            fechas.push(formatearFecha(fecha));
        }
    }

    if (tipoRepeticion === "custom") {
        const intervalo = parseInt(repeatIntervalInput.value, 10);
        const frecuencia = repeatFrequencyInput.value;

        if (frecuencia === "day") {
            for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + intervalo)) {
                fechas.push(formatearFecha(fecha));
            }
        }

        if (frecuencia === "week") {
            const diasSeleccionados = Array.from(document.querySelectorAll('input[name="repeat-days"]:checked'))
                .map(input => input.value);

            if (diasSeleccionados.length === 0) {
                return [];
            }

            for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
                const diferenciaDias = Math.floor((fecha - inicio) / (1000 * 60 * 60 * 24));
                const semanaActual = Math.floor(diferenciaDias / 7);

                if (semanaActual % intervalo === 0 && diasSeleccionados.includes(String(fecha.getDay()))) {
                    fechas.push(formatearFecha(fecha));
                }
            }
        }

        if (frecuencia === "month") {
            for (let fecha = new Date(inicio); fecha <= fin; fecha.setMonth(fecha.getMonth() + intervalo)) {
                fechas.push(formatearFecha(fecha));
            }
        }

        if (frecuencia === "year") {
            for (let fecha = new Date(inicio); fecha <= fin; fecha.setFullYear(fecha.getFullYear() + intervalo)) {
                fechas.push(formatearFecha(fecha));
            }
        }
    }

    return fechas;
}

function resetAddForm() {
    addEventForm.reset();
    clearWarning();

    eventPeopleInputs.forEach((input) => {
        input.checked = false;
    });

    repeatStep.classList.add("hidden");
    nextRepeatBtn.classList.add("hidden");
    backRepeatBtn.classList.add("hidden");
    saveEventBtn.classList.remove("hidden");

    updateFormByType();
}

function setMinDates() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayString = `${yyyy}-${mm}-${dd}`;

    eventDateInput.min = todayString;
}

eventTypeInput.addEventListener("change", updateFormByType);

document.getElementById("btn-prev").addEventListener("click", () => {
    if (currentView === "week") {
        currentDate.setDate(currentDate.getDate() - 7);
    } else if (currentView === "year") {
        currentDate.setFullYear(currentDate.getFullYear() - 1);
    } else {
        currentDate.setMonth(currentDate.getMonth() - 1);
    }

    renderCalendar(currentDate);
});

document.getElementById("btn-next").addEventListener("click", () => {
    if (currentView === "week") {
        currentDate.setDate(currentDate.getDate() + 7);
    } else if (currentView === "year") {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
    } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    renderCalendar(currentDate);
});

btnToday.addEventListener("click", () => {
    currentDate = new Date();
    currentView = "day";

    if (calendarViewSelect) {
        calendarViewSelect.value = "day";
    }

    renderCalendar(currentDate);
});

btnSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchResults.innerHTML = '<p class="search-empty">Escribe para buscar eventos.</p>';
    openModal(modalSearch);
    searchInput.focus();
});

closeSearchModal.addEventListener("click", () => {
    closeModal(modalSearch);
});

function buscarEventos(texto) {
    const busqueda = normalizarTexto(texto);

    if (!busqueda) {
        searchResults.innerHTML = '<p class="search-empty">Escribe para buscar eventos.</p>';
        return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const resultados = eventos.filter((evento) => {

        let fechaEvento;

        // INCIDENCIAS
        if (evento.tipo === "incidencia") {

            // Si está resuelta no aparece
            if (evento.estado === "resuelta") return false;

            // Usa fecha fin o fecha inicio
            fechaEvento = new Date(evento.fechaFin || evento.fechaInicio);

        } else {

            // Tareas completadas no aparecen
            if (evento.tipo === "tarea" && evento.estado === "completada") {
                return false;
            }

            fechaEvento = new Date(evento.fecha);
        }

        // Ocultar eventos pasados
        if (fechaEvento < hoy) {
            return false;
        }

        const titulo = normalizarTexto(evento.titulo || "");
        const tipo = normalizarTexto(typeNames[evento.tipo] || "");
        const personas = normalizarTexto((evento.personas || []).join(" "));

        return titulo.includes(busqueda) ||
            tipo.includes(busqueda) ||
            personas.includes(busqueda);
    });

    searchResults.innerHTML = "";

    if (resultados.length === 0) {
        searchResults.innerHTML = '<p class="search-empty">No se encontraron eventos.</p>';
        return;
    }

    resultados.forEach((evento) => {
        const card = document.createElement("div");
        card.className = "search-result-card";

        const fecha =
            evento.tipo === "incidencia"
                ? formatRangeText(evento.fechaInicio, evento.fechaFin)
                : formatDateText(evento.fecha);

        card.innerHTML = `
            <div class="search-result-title">${evento.titulo}</div>
            <div class="search-result-meta">
                ${typeNames[evento.tipo]} · ${fecha}
            </div>
        `;

        card.addEventListener("click", () => {
            closeModal(modalSearch);

            selectedEvent = evento;
            showEventDetails(evento);

            const fechaPrincipal = getEventMainDate(evento);

            if (fechaPrincipal) {
                const [anio, mes, dia] = fechaPrincipal.split("-").map(Number);
                currentDate = new Date(anio, mes - 1, dia);
                renderCalendar(currentDate);
            }
        });

        searchResults.appendChild(card);
    });
}

searchInput.addEventListener("input", () => {
    buscarEventos(searchInput.value);
});



calendarViewSelect.addEventListener("change", () => {
    currentView = calendarViewSelect.value;

    if (currentView === "day" || currentView === "week") {
        currentDate = new Date();
    }

    renderCalendar(currentDate);
});

document.getElementById("btn-add").addEventListener("click", () => {
    setMinDates();

    // Si ya había algo escrito, lo mantiene tal cual
    if (!eventTitleInput.value.trim()) {
        updateFormByType();
    }

    openModal(modalAdd);
});

function normalizarTexto(texto) {
    return texto
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

function existeTareaMismoDia(titulo, fecha) {
    const tituloNormalizado = normalizarTexto(titulo);

    return eventos.some((evento) =>
        evento.tipo === "tarea" &&
        evento.estado !== "completada" &&
        evento.fecha === fecha &&
        normalizarTexto(evento.titulo) === tituloNormalizado
    );
}

addEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = eventTitleInput.value.trim();
    const tipo = eventTypeInput.value;

    clearWarning();

    if (!titulo || !tipo) {
        return;
    }

    if (tipo === "tarea") {
        const fecha = eventDateInput.value;

        const personasSeleccionadas = Array.from(eventPeopleInputs)
            .filter((input) => input.checked)
            .map((input) => input.value);

        if (!fecha) {
            eventWarning.textContent = "Selecciona una fecha para la tarea.";
            eventWarning.classList.add("show");
            return;
        }

        if (personasSeleccionadas.length === 0) {
            eventWarning.textContent = "Selecciona al menos una persona para la tarea.";
            eventWarning.classList.add("show");
            return;
        }

        let fechasTarea = [fecha];

        if (taskRepeatInput.checked) {
            fechasTarea = obtenerFechasRepetidas(fecha);

            if (fechasTarea.length === 0) {
                eventWarning.textContent = "Selecciona al menos un día para la repetición personalizada.";
                eventWarning.classList.add("show");
                return;
            }
        }

        for (const fechaTarea of fechasTarea) {
            if (existeTareaMismoDia(titulo, fechaTarea)) {
                eventWarning.textContent = `La tarea "${titulo}" ya está añadida para el día ${formatDateText(fechaTarea)}.`;
                eventWarning.classList.add("show");
                return;
            }

            const nuevoEvento = {
                titulo,
                tipo,
                fecha: fechaTarea,
                hora: null,
                estado: "pendiente",
                personas: personasSeleccionadas
            };

            await guardarEventoEnBD(nuevoEvento);
        }

        const [anio, mes] = fecha.split("-").map(Number);
        currentDate = new Date(anio, mes - 1, 1);
    }

    if (tipo === "evento") {
        const fecha = eventDateInput.value;
        const hora = eventTimeInput.value;
        const personasSeleccionadas = Array.from(eventPeopleInputs)
            .filter((input) => input.checked)
            .map((input) => input.value);

        if (!fecha || !hora) {
            return;
        }

        if (personasSeleccionadas.length === 0) {
            eventWarning.textContent = "Selecciona al menos una persona asignada para el evento.";
            eventWarning.classList.add("show");
            return;
        }

        const existeMismoEvento = eventos.some((evento) =>
            evento.tipo === "evento" &&
            evento.fecha === fecha &&
            evento.hora === hora
        );

        if (existeMismoEvento) {
            eventWarning.textContent = "Ya existe un evento en esa fecha y a esa hora.";
            eventWarning.classList.add("show");
            return;
        }

        const nuevoEvento = {
            titulo,
            tipo,
            fecha,
            hora,
            estado: "programado",
            personas: personasSeleccionadas
        };

        await guardarEventoEnBD(nuevoEvento);

        const [anio, mes] = fecha.split("-").map(Number);
        currentDate = new Date(anio, mes - 1, 1);
    }

    resetAddForm();
    closeModal(modalAdd);
    renderCalendar(currentDate);
});

document.getElementById("close-add-modal").addEventListener("click", () => {
    clearWarning();
    closeModal(modalAdd);
});

document.getElementById("cancel-add").addEventListener("click", () => {
    resetAddForm();
    clearWarning();
    closeModal(modalAdd);
});

document.getElementById("close-details-modal").addEventListener("click", () => {
    closeModal(modalDetails);
});

window.addEventListener("click", (e) => {
    if (e.target === modalAdd) {
        // Solo se cierra, pero NO limpia ni cambia el formulario, para evitar perder datos si se cierra por error
        closeModal(modalAdd);
    }

    if (e.target === modalDetails) {
        closeModal(modalDetails);
    }

    if (e.target === modalDay) {
        closeModal(modalDay);
    }

    if (e.target === modalSearch) {
        closeModal(modalSearch);
    }

    if (e.target === modalDeleteRepeat) {
        closeModal(modalDeleteRepeat);
    }

    if (e.target === modalDeleteConfirm) {
        closeModal(modalDeleteConfirm);
    }
});

resolveIncidenciaBtn.addEventListener("click", async () => {
    if (!selectedEvent || selectedEvent.tipo !== "incidencia") return;

    await actualizarEstadoEvento(selectedEvent.id_evento, "resuelta");
});

completeTaskBtn.addEventListener("click", async () => {
    if (!selectedEvent || selectedEvent.tipo !== "tarea") return;

    const nuevoEstado = selectedEvent.estado === "completada"
        ? "pendiente"
        : "completada";

    await actualizarEstadoEvento(selectedEvent.id_evento, nuevoEstado);
});

deleteEventBtn.addEventListener("click", () => {
    if (!selectedEvent) return;

    if (selectedEvent.tipo === "tarea") {
        openModal(modalDeleteRepeat);
    } else {
        deleteConfirmText.textContent =
            `¿Seguro que quieres eliminar este ${typeNames[selectedEvent.tipo].toLowerCase()}?`;

        openModal(modalDeleteConfirm);
    }
});

confirmDeleteEventBtn.addEventListener("click", () => {
    if (!selectedEvent) return;
    eliminarEvento(selectedEvent.id_evento);
});

closeDeleteConfirmBtn.addEventListener("click", () => {
    closeModal(modalDeleteConfirm);
});

cancelDeleteConfirmBtn.addEventListener("click", () => {
    closeModal(modalDeleteConfirm);
});

deleteOnlyOneBtn.addEventListener("click", () => {
    if (!selectedEvent) return;
    eliminarEvento(selectedEvent.id_evento);
});

deleteFutureTasksBtn.addEventListener("click", () => {
    if (!selectedEvent) return;
    eliminarTareasFuturas(selectedEvent);
});

closeDeleteRepeatBtn.addEventListener("click", () => {
    closeModal(modalDeleteRepeat);
});

const closeDayModalBtn = document.getElementById("close-day-modal");

if (closeDayModalBtn) {
    closeDayModalBtn.addEventListener("click", () => {
        closeModal(modalDay);
    });
}

document.addEventListener("DOMContentLoaded", async () => {

    cargarUsuario();

    await cargarEventos();

});

updateFormByType();
setMinDates();
cargarEventos();