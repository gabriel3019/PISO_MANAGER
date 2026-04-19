const monthTitle = document.getElementById("month-title");
const calendarGrid = document.getElementById("calendar-grid");
const eventsList = document.getElementById("events-list");

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

const detailBadge = document.getElementById("detail-badge");
const detailTitle = document.getElementById("detail-title");
const detailType = document.getElementById("detail-type");
const detailDay = document.getElementById("detail-day");
const detailTime = document.getElementById("detail-time");
const detailPerson = document.getElementById("detail-person");
const detailColor = document.getElementById("detail-color");
const detailStatus = document.getElementById("detail-status");

const resolveIncidenciaBtn = document.getElementById("resolve-incidencia-btn");
const completeTaskBtn = document.getElementById("complete-task-btn");

let currentDate = new Date(2026, 3, 1);
let selectedEvent = null;

const eventos = [
    {
        titulo: "Lavadora averiada",
        tipo: "incidencia",
        fechaInicio: "2026-04-10",
        fechaFin: "2026-04-14",
        estado: "activa"
    },
    {
        titulo: "Limpiar baño",
        tipo: "tarea",
        fecha: "2026-04-15",
        hora: "18:00",
        persona: "Celia",
        estado: "pendiente"
    },
    {
        titulo: "Cena del piso",
        tipo: "evento",
        fecha: "2026-04-20",
        hora: "21:30",
        personas: ["Celia", "Gabriel", "Carlos"]
    },
    {
        titulo: "Comida con amigos",
        tipo: "evento",
        fecha: "2026-04-21",
        hora: "14:00",
        personas: ["Celia"]
    }
];

const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const typeNames = {
    incidencia: "Incidencia",
    tarea: "Tarea",
    evento: "Evento"
};

const typeColors = {
    incidencia: "Rojo",
    tarea: "Verde",
    evento: "Azul"
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

function incidenciaVisibleEnMes(incidencia, year, month) {
    if (incidencia.estado === "resuelta") return false;

    const { firstDay, lastDay } = getMonthRange(year, month);
    return incidencia.fechaInicio <= lastDay && incidencia.fechaFin >= firstDay;
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
            if (evento.tipo === "incidencia") {
                if (evento.estado === "resuelta") return false;
                return dateIsBetween(fullDate, evento.fechaInicio, evento.fechaFin);
            }

            return evento.fecha === fullDate;
        });

        eventosDelDia.forEach((evento) => {
            const subtitle =
                evento.tipo === "tarea" && evento.persona
                    ? ` · ${evento.persona}`
                    : evento.tipo === "evento" && evento.personas && evento.personas.length > 0
                        ? ` · ${evento.personas.join(", ")}`
                        : evento.tipo === "evento" && evento.hora
                            ? ` · ${evento.hora}`
                            : evento.tipo === "incidencia"
                                ? " · incidencia"
                                : "";

            const completedClass =
                evento.tipo === "tarea" && evento.estado === "completada"
                    ? "completed-task"
                    : "";

            html += `
        <div 
          class="event ${evento.tipo} ${completedClass}"
          data-title="${evento.titulo}"
          data-type="${evento.tipo}"
          data-date="${evento.fecha || ""}"
          data-start="${evento.fechaInicio || ""}"
          data-end="${evento.fechaFin || ""}"
          data-time="${evento.hora || ""}"
          data-person="${evento.persona || ""}"
          data-people='${JSON.stringify(evento.personas || [])}'
          data-status="${evento.estado || ""}">
          ${evento.titulo}${subtitle}
        </div>
      `;
        });

        dayBox.innerHTML = html;
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
                meta = `${typeNames[evento.tipo]} · ${formatRangeText(evento.fechaInicio, evento.fechaFin)}`;
            } else if (evento.tipo === "tarea") {
                meta = `${typeNames[evento.tipo]} · ${formatDateText(evento.fecha)} · ${evento.hora} · ${evento.persona}`;
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
        eventElement.addEventListener("click", () => {
            const evento = {
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

    if (evento.tipo === "incidencia") {
        detailDay.textContent = formatRangeText(evento.fechaInicio, evento.fechaFin);
        detailTime.textContent = "No aplica";
        detailPerson.textContent = "No aplica";
        detailStatus.textContent = evento.estado === "resuelta" ? "Resuelta" : "Activa";
        resolveIncidenciaBtn.classList.remove("hidden");
    } else if (evento.tipo === "tarea") {
        detailDay.textContent = formatDateText(evento.fecha);
        detailTime.textContent = evento.hora || "-";
        detailPerson.textContent = evento.persona || "-";
        detailStatus.textContent = evento.estado === "completada" ? "Completada" : "Pendiente";

        if (evento.estado !== "completada") {
            completeTaskBtn.classList.remove("hidden");
        }
    } else {
        detailDay.textContent = formatDateText(evento.fecha);
        detailTime.textContent = evento.hora || "-";
        detailPerson.textContent =
            evento.personas && evento.personas.length > 0
                ? evento.personas.join(", ")
                : "No asignadas";
        detailStatus.textContent = "Programado";
    }

    detailColor.textContent = typeColors[evento.tipo];

    openModal(modalDetails);
}

function updateFormByType() {
    const tipo = eventTypeInput.value;

    incidenciaFields.classList.add("hidden");
    generalFields.classList.add("hidden");
    peopleFields.classList.add("hidden");
    timeFields.classList.add("hidden");

    if (tipo === "incidencia") {
        incidenciaFields.classList.remove("hidden");
    }

    if (tipo === "tarea" || tipo === "evento") {
        generalFields.classList.remove("hidden");
        peopleFields.classList.remove("hidden");
        timeFields.classList.remove("hidden");
    }
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
    resetAddForm();
    setMinDates();
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

addEventForm.addEventListener("submit", (e) => {
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

        if (!fechaInicio || !fechaFin) {
            return;
        }

        if (fechaFin < fechaInicio) {
            eventWarning.textContent = "La fecha de fin no puede ser anterior a la de inicio.";
            eventWarning.classList.add("show");
            return;
        }

        eventos.push({
            titulo,
            tipo,
            fechaInicio,
            fechaFin,
            estado: "activa"
        });

        const fechaNueva = new Date(fechaInicio);
        currentDate = new Date(fechaNueva.getFullYear(), fechaNueva.getMonth(), 1);
    }

    if (tipo === "tarea") {
        const fecha = eventDateInput.value;
        const hora = eventTimeInput.value;
        const personasSeleccionadas = Array.from(eventPeopleInputs)
            .filter((input) => input.checked)
            .map((input) => input.value);

        if (!fecha || !hora) {
            return;
        }

        if (personasSeleccionadas.length !== 1) {
            eventWarning.textContent = "Para una tarea debes seleccionar solo una persona.";
            eventWarning.classList.add("show");
            return;
        }

        const persona = personasSeleccionadas[0];

        const existeMismaTarea = eventos.some((evento) =>
            evento.tipo === "tarea" &&
            evento.fecha === fecha &&
            evento.hora === hora &&
            evento.persona === persona
        );

        if (existeMismaTarea) {
            eventWarning.textContent = "Esa persona ya tiene una tarea asignada en esa fecha y a esa hora.";
            eventWarning.classList.add("show");
            return;
        }

        eventos.push({
            titulo,
            tipo,
            fecha,
            hora,
            persona,
            estado: "pendiente"
        });

        const fechaNueva = new Date(fecha);
        currentDate = new Date(fechaNueva.getFullYear(), fechaNueva.getMonth(), 1);
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

        eventos.push({
            titulo,
            tipo,
            fecha,
            hora,
            personas: personasSeleccionadas
        });

        const fechaNueva = new Date(fecha);
        currentDate = new Date(fechaNueva.getFullYear(), fechaNueva.getMonth(), 1);
    }

    closeModal(modalAdd);
    renderCalendar(currentDate);
});

document.getElementById("close-add-modal").addEventListener("click", () => {
    clearWarning();
    closeModal(modalAdd);
});

document.getElementById("cancel-add").addEventListener("click", () => {
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
});

resolveIncidenciaBtn.addEventListener("click", () => {
    if (!selectedEvent || selectedEvent.tipo !== "incidencia") return;

    const index = eventos.findIndex((evento) =>
        evento.tipo === "incidencia" &&
        evento.titulo === selectedEvent.titulo &&
        evento.fechaInicio === selectedEvent.fechaInicio &&
        evento.fechaFin === selectedEvent.fechaFin
    );

    if (index !== -1) {
        eventos[index].estado = "resuelta";
    }

    closeModal(modalDetails);
    renderCalendar(currentDate);
});

completeTaskBtn.addEventListener("click", () => {
    if (!selectedEvent || selectedEvent.tipo !== "tarea") return;

    const index = eventos.findIndex((evento) =>
        evento.tipo === "tarea" &&
        evento.titulo === selectedEvent.titulo &&
        evento.fecha === selectedEvent.fecha &&
        evento.hora === selectedEvent.hora &&
        evento.persona === selectedEvent.persona
    );

    if (index !== -1) {
        eventos[index].estado = "completada";
    }

    closeModal(modalDetails);
    renderCalendar(currentDate);
});

updateFormByType();
setMinDates();
renderCalendar(currentDate);