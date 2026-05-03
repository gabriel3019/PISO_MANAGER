const API_URL = "/PISO_MANAGER/src/php/calendario.php";

const monthTitle = document.getElementById("month-title");
const calendarGrid = document.getElementById("calendar-grid");
const eventsList = document.getElementById("events-list");

const repeatFields = document.getElementById("repeat-fields");
const taskRepeatInput = document.getElementById("task-repeat");
const repeatOptions = document.getElementById("repeat-options");
const repeatDayInputs = document.querySelectorAll('input[name="repeat-days"]');
const repeatWeeksInput = document.getElementById("repeat-weeks");

const eventWarning = document.getElementById("event-warning");
const modalAdd = document.getElementById("modal-add");
const modalDetails = document.getElementById("modal-details");

const addEventForm = document.getElementById("add-event-form");
const eventTitleInput = document.getElementById("event-title");
const eventTypeInput = document.getElementById("event-type");
const eventDateInput = document.getElementById("event-date");
const eventStartDateInput = document.getElementById("event-start-date");
const eventEndDateInput = document.getElementById("event-end-date");
const eventTimeInput = document.getElementById("event-time");

const incidenciaFields = document.getElementById("incidencia-fields");
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


let currentDate = new Date(2026, 4, 1);
let selectedEvent = null;
let eventos = [];

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

function incidenciaVisibleEnMes(incidencia, year, month) {
    if (incidencia.estado === "resuelta") return false;

    const { firstDay, lastDay } = getMonthRange(year, month);

    const fechaFin = incidencia.fechaFin || lastDay;

    return incidencia.fechaInicio <= lastDay && fechaFin >= firstDay;
}

function renderCalendar(date) {
    calendarGrid.innerHTML = "";

    const year = date.getFullYear();
    const month = date.getMonth();

    monthTitle.textContent = `${monthNames[month]} de ${year}`;

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

        let html = `<div class="calendar-day-number">${day}</div>`;

        const dayString = String(day).padStart(2, "0");
        const monthString = String(month + 1).padStart(2, "0");
        const fullDate = `${year}-${monthString}-${dayString}`;

        const eventosDelDia = eventos.filter((evento) => {
            if (evento.tipo === "tarea" && evento.estado === "completada") {
                return false;
            }

            if (evento.tipo === "incidencia") {
                if (evento.estado === "resuelta") return false;

                 return evento.fechaInicio === fullDate;
            }

            return evento.fecha === fullDate;
        });



        const eventosVisibles = eventosDelDia.slice(0, 1);
        const eventosOcultos = eventosDelDia.length - eventosVisibles.length;

        eventosVisibles.forEach((evento) => {
            let icono = "";

            if (evento.tipo === "evento" && evento.personas && evento.personas.length > 0) {
                icono = " 👥";
            }

            if (evento.tipo === "tarea" && evento.personas && evento.personas.length > 0) {
                if (evento.personas.length === 1) {
                    icono = " 👤";
                } else {
                    icono = " 👥";
                }
            }

            if (evento.tipo === "incidencia") {
                icono = " ⚠️";
            }

            const completedClass =
                evento.tipo === "tarea" && evento.estado === "completada"
                    ? "completed-task"
                    : "";

            html += `
    <div 
      class="event ${evento.tipo} ${completedClass}"
      data-id="${evento.id_evento || ""}"
      data-title="${evento.titulo}"
      data-type="${evento.tipo}"
      data-date="${evento.fecha || ""}"
      data-start="${evento.fechaInicio || ""}"
      data-end="${evento.fechaFin || ""}"
      data-time="${evento.hora || ""}"
      data-person="${evento.persona || ""}"
      data-people='${JSON.stringify(evento.personas || [])}'
      data-status="${evento.estado || ""}">
      <span class="event-text">${evento.titulo}</span>
      <span class="event-icon">${icono}</span>
    </div>
`;
        });

        if (eventosOcultos > 0) {
            html += `<div class="more-events">+${eventosOcultos} más</div>`;
        }

        dayBox.innerHTML = html;
        dayBox.addEventListener("click", () => {
            openDayModal(fullDate, eventosDelDia);
        });
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

    renderUpcomingEvents();
    addEventClickListeners();
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
                    ? a.fechaInicio
                    : `${a.fecha}T${a.hora || "00:00"}`;

            const fechaB =
                b.tipo === "incidencia"
                    ? b.fechaInicio
                    : `${b.fecha}T${b.hora || "00:00"}`;

            return fechaA.localeCompare(fechaB);
        })
        .forEach((evento) => {
            const item = document.createElement("div");
            item.className = `next-event ${evento.tipo === "tarea" && evento.estado === "completada" ? "completed-task" : ""}`;

            let meta = "";
            if (evento.tipo === "incidencia") {
                const textoFecha = evento.fechaFin
                    ? formatRangeText(evento.fechaInicio, evento.fechaFin)
                    : `${formatDateText(evento.fechaInicio)} - sin fecha de fin`;

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
        detailDay.textContent = evento.fechaFin
            ? formatRangeText(evento.fechaInicio, evento.fechaFin)
            : `${formatDateText(evento.fechaInicio)} - sin fecha de fin`;
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

    incidenciaFields.classList.add("hidden");
    generalFields.classList.add("hidden");
    peopleFields.classList.add("hidden");
    timeFields.classList.add("hidden");
    repeatFields.classList.add("hidden");

    if (tipo === "incidencia") {
        incidenciaFields.classList.remove("hidden");
    }

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
        repeatOptions.classList.remove("hidden");
    } else {
        repeatOptions.classList.add("hidden");
    }
});

function obtenerFechasRepetidas(fechaInicio, diasSemana, semanas) {
    const fechas = [];

    const [anio, mes, dia] = fechaInicio.split("-").map(Number);
    const inicio = new Date(anio, mes - 1, dia);

    for (let i = 0; i < semanas * 7; i++) {
        const fecha = new Date(inicio);
        fecha.setDate(inicio.getDate() + i);

        const diaSemana = fecha.getDay();

        if (diasSemana.includes(String(diaSemana))) {
            const yyyy = fecha.getFullYear();
            const mm = String(fecha.getMonth() + 1).padStart(2, "0");
            const dd = String(fecha.getDate()).padStart(2, "0");

            fechas.push(`${yyyy}-${mm}-${dd}`);
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

    updateFormByType();
}

function setMinDates() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayString = `${yyyy}-${mm}-${dd}`;

    eventDateInput.min = todayString;
    eventStartDateInput.min = todayString;
    eventEndDateInput.min = todayString;
}
eventStartDateInput.addEventListener("change", () => {
    eventEndDateInput.min = eventStartDateInput.value;
});

eventTypeInput.addEventListener("change", updateFormByType);

document.getElementById("btn-prev").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
});

document.getElementById("btn-next").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
});

document.getElementById("btn-add").addEventListener("click", () => {
    setMinDates();
    updateFormByType();
    openModal(modalAdd);
});

document.getElementById("btn-details").addEventListener("click", () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const eventosMes = eventos.filter((evento) => {
        if (evento.tipo === "incidencia") {
            return incidenciaVisibleEnMes(evento, year, month);
        }

        const [anio, mes] = evento.fecha.split("-").map(Number);
        return anio === year && (mes - 1) === month;
    });

    if (eventosMes.length > 0) {
        selectedEvent = eventosMes[0];
        showEventDetails(eventosMes[0]);
    }
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

    if (tipo === "incidencia") {
        const fechaInicio = eventStartDateInput.value;
        const fechaFin = eventEndDateInput.value;

        if (!fechaInicio) {
            eventWarning.textContent = "Selecciona la fecha de inicio de la incidencia.";
            eventWarning.classList.add("show");
            return;
        }

        if (fechaFin && fechaFin < fechaInicio) {
            eventWarning.textContent = "La fecha de fin no puede ser anterior a la de inicio.";
            eventWarning.classList.add("show");
            return;
        }

        const nuevoEvento = {
            titulo,
            tipo,
            fechaInicio,
            fechaFin: fechaFin || null,
            estado: "activa",
            personas: []
        };

        await guardarEventoEnBD(nuevoEvento);

        const [anio, mes] = fechaInicio.split("-").map(Number);
        currentDate = new Date(anio, mes - 1, 1);
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
            const diasSeleccionados = Array.from(repeatDayInputs)
                .filter((input) => input.checked)
                .map((input) => input.value);

            const semanas = parseInt(repeatWeeksInput.value, 10);

            if (diasSeleccionados.length === 0) {
                eventWarning.textContent = "Selecciona al menos un día de la semana para repetir la tarea.";
                eventWarning.classList.add("show");
                return;
            }

            fechasTarea = obtenerFechasRepetidas(fecha, diasSeleccionados, semanas);
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
        clearWarning();
        closeModal(modalAdd);
    }

    if (e.target === modalDetails) {
        closeModal(modalDetails);
    }

    if (e.target === modalDay) {
        closeModal(modalDay);
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

document.getElementById("close-day-modal").addEventListener("click", () => {
    closeModal(modalDay);
});

updateFormByType();
setMinDates();
cargarEventos();