// Base de datos inicial (se guardará en localStorage)
const initialData = {
    integrantes: [
        { id: 1, nombre: "Ana García", email: "ana@proyecto.com" },
        { id: 2, nombre: "Carlos López", email: "carlos@proyecto.com" },
        { id: 3, nombre: "María Rodríguez", email: "maria@proyecto.com" }
    ],
    eventos: [
        { 
            id: 1, 
            nombre: "Reunión Inicial", 
            fecha: "2024-03-10",
            asistentes: [1, 2, 3]
        },
        { 
            id: 2, 
            nombre: "Presentación de Avances", 
            fecha: "2024-03-15",
            asistentes: [1, 3]
        },
        { 
            id: 3, 
            nombre: "Planificación de Fase 2", 
            fecha: "2024-04-05",
            asistentes: [2, 3]
        }
    ]
};

// Inicializar datos si no existen
if (!localStorage.getItem('eventosAppData')) {
    localStorage.setItem('eventosAppData', JSON.stringify(initialData));
}

// Obtener datos
function getData() {
    return JSON.parse(localStorage.getItem('eventosAppData'));
}

// Guardar datos
function saveData(data) {
    localStorage.setItem('eventosAppData', JSON.stringify(data));
}

// Obtener el siguiente ID para un array
function getNextId(arr) {
    return arr.length > 0 ? Math.max(...arr.map(item => item.id)) + 1 : 1;
}

// Variables globales
let currentEventId = null;
let currentIntegranteId = null;

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos DOM
    const menuBtn = document.getElementById('menuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    const addEventBtn = document.getElementById('addEventBtn');
    const addIntegranteBtn = document.getElementById('addIntegranteBtn');
    const eventModal = document.getElementById('eventModal');
    const integranteModal = document.getElementById('integranteModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeIntegranteModalBtn = document.getElementById('closeIntegranteModalBtn');
    const eventForm = document.getElementById('eventForm');
    const integranteForm = document.getElementById('integranteForm');
    const content = document.getElementById('content');
    
    // Elementos del menú
    const menuIntegrantes = document.getElementById('menuIntegrantes');
    const menuEventos = document.getElementById('menuEventos');
    const menuInicio = document.getElementById('menuInicio');
    const menuSalir = document.getElementById('menuSalir');
    
    // Vistas
    const inicioView = document.getElementById('inicioView');
    const integrantesView = document.getElementById('integrantesView');
    const eventosView = document.getElementById('eventosView');
    
    // Funciones para mostrar vistas
    function showView(view) {
        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        // Mostrar la vista solicitada
        view.classList.add('active');
        // Actualizar título
        document.getElementById('appTitle').textContent = view === inicioView ? 'Gestor de Eventos K-Pop' : 
                                                         view === integrantesView ? 'Integrantes' : 
                                                         view === eventosView ? 'Eventos' : 'Gestor de Eventos K-Pop';
    }
    
    // Funciones para mostrar/ocultar menú
    function showMenu() {
        sidebar.style.left = '0';
        overlay.style.display = 'block';
        cargarMenuEventos();
    }
    
    function hideMenu() {
        sidebar.style.left = '-280px';
        overlay.style.display = 'none';
    }
    
    // Funciones para mostrar/ocultar modales
    function showEventModal(eventId = null) {
        currentEventId = eventId;
        const modalTitle = document.getElementById('modalTitle');
        
        if (eventId) {
            modalTitle.textContent = 'Editar Evento';
            cargarDatosEvento(eventId);
        } else {
            modalTitle.textContent = 'Nuevo Evento';
            resetEventForm();
        }
        
        cargarAsistentes();
        eventModal.style.display = 'flex';
    }
    
    function hideEventModal() {
        eventModal.style.display = 'none';
        currentEventId = null;
    }
    
    function showIntegranteModal(integranteId = null) {
        currentIntegranteId = integranteId;
        const modalTitle = document.getElementById('modalIntegranteTitle');
        
        if (integranteId) {
            modalTitle.textContent = 'Editar Integrante';
            cargarDatosIntegrante(integranteId);
        } else {
            modalTitle.textContent = 'Nuevo Integrante';
            resetIntegranteForm();
        }
        
        integranteModal.style.display = 'flex';
    }
    
    function hideIntegranteModal() {
        integranteModal.style.display = 'none';
        currentIntegranteId = null;
    }
    
    // Cargar datos de un evento en el formulario
    function cargarDatosEvento(eventId) {
        const data = getData();
        const evento = data.eventos.find(e => e.id === eventId);
        
        if (evento) {
            document.getElementById('eventName').value = evento.nombre;
            document.getElementById('eventDate').value = evento.fecha;
        }
    }
    
    // Cargar datos de un integrante en el formulario
    function cargarDatosIntegrante(integranteId) {
        const data = getData();
        const integrante = data.integrantes.find(i => i.id === integranteId);
        
        if (integrante) {
            document.getElementById('integranteName').value = integrante.nombre;
            document.getElementById('integranteEmail').value = integrante.email || '';
        }
    }
    
    // Resetear formularios
    function resetEventForm() {
        document.getElementById('eventName').value = '';
        document.getElementById('eventDate').value = '';
    }
    
    function resetIntegranteForm() {
        document.getElementById('integranteName').value = '';
        document.getElementById('integranteEmail').value = '';
    }
    
    // Cargar lista de asistentes en el modal de eventos
    function cargarAsistentes() {
        const data = getData();
        const asistentesList = document.getElementById('asistentesList');
        const evento = currentEventId ? data.eventos.find(e => e.id === currentEventId) : null;
        const asistentesIds = evento ? evento.asistentes : [];
        
        // Limpiar lista
        asistentesList.innerHTML = '';
        
        // Crear contenedor para checkboxes
        const container = document.createElement('div');
        container.className = 'asistentes-container';
        
        // Crear checkbox para cada integrante
        data.integrantes.forEach(integrante => {
            const item = document.createElement('div');
            item.className = 'asistente-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `asistente-${integrante.id}`;
            checkbox.value = integrante.id;
            checkbox.checked = asistentesIds.includes(integrante.id);
            
            const label = document.createElement('label');
            label.htmlFor = `asistente-${integrante.id}`;
            label.textContent = integrante.nombre;
            
            item.appendChild(checkbox);
            item.appendChild(label);
            container.appendChild(item);
        });
        
        asistentesList.appendChild(container);
    }
    
    // Cargar lista de integrantes
    function cargarIntegrantes() {
        const data = getData();
        const integrantesList = document.getElementById('integrantesList');
        
        if (data.integrantes.length === 0) {
            integrantesList.innerHTML = '<div class="empty-message">No hay integrantes registrados. Agrega el primero con el botón "+ Integrante".</div>';
            return;
        }
        
        integrantesList.innerHTML = '';
        
        data.integrantes.forEach(integrante => {
            const card = document.createElement('div');
            card.className = 'integrante-card';
            card.dataset.id = integrante.id;
            
            card.innerHTML = `
                <div class="integrante-header">
                    <div class="integrante-name">${integrante.nombre}</div>
                </div>
                ${integrante.email ? `<div class="integrante-email">${integrante.email}</div>` : ''}
                <div class="actions">
                    <button class="btn-edit" onclick="editarIntegrante(${integrante.id})">Editar</button>
                    <button class="btn-delete" onclick="eliminarIntegrante(${integrante.id})">Eliminar</button>
                </div>
            `;
            
            integrantesList.appendChild(card);
        });
    }
    
    // Cargar lista de eventos
    function cargarEventos() {
        const data = getData();
        const eventosList = document.getElementById('eventosList');
        
        if (data.eventos.length === 0) {
            eventosList.innerHTML = '<div class="empty-message">No hay eventos registrados. Crea el primero con el botón "+".</div>';
            return;
        }
        
        eventosList.innerHTML = '';
        
        // Ordenar eventos por fecha (más recientes primero)
        const eventosOrdenados = [...data.eventos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        eventosOrdenados.forEach(evento => {
            const fecha = new Date(evento.fecha);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Obtener nombres de asistentes
            const asistentesNombres = evento.asistentes.map(id => {
                const integrante = data.integrantes.find(i => i.id === id);
                return integrante ? integrante.nombre : 'Desconocido';
            });
            
            const card = document.createElement('div');
            card.className = 'evento-card';
            card.dataset.id = evento.id;
            
            card.innerHTML = `
                <div class="evento-header">
                    <div class="evento-name">${evento.nombre}</div>
                </div>
                <div class="evento-date">${fechaFormateada}</div>
                <div class="evento-asistentes">
                    <strong>Asistentes:</strong> ${asistentesNombres.join(', ') || 'Ninguno'}
                </div>
                <div class="actions">
                    <button class="btn-edit" onclick="editarEvento(${evento.id})">Editar</button>
                    <button class="btn-delete" onclick="eliminarEvento(${evento.id})">Eliminar</button>
                </div>
            `;
            
            eventosList.appendChild(card);
        });
    }
    
    // Cargar menú de eventos por año, mes y día
    function cargarMenuEventos() {
        const data = getData();
        const eventosMenu = document.getElementById('eventosMenu');
        
        if (data.eventos.length === 0) {
            eventosMenu.innerHTML = '<p style="color: #888; padding: 0.5rem 1rem;">No hay eventos</p>';
            return;
        }
        
        // Agrupar eventos por año, mes y día
        const eventosPorAnio = {};
        
        data.eventos.forEach(evento => {
            const fecha = new Date(evento.fecha);
            const año = fecha.getFullYear();
            const mes = fecha.getMonth() + 1; // 1-12
            const dia = fecha.getDate();
            const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long' });
            const nombreDia = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
            
            if (!eventosPorAnio[año]) {
                eventosPorAnio[año] = {};
            }
            
            if (!eventosPorAnio[año][mes]) {
                eventosPorAnio[año][mes] = {
                    nombre: nombreMes,
                    dias: {}
                };
            }
            
            if (!eventosPorAnio[año][mes].dias[dia]) {
                eventosPorAnio[año][mes].dias[dia] = {
                    nombre: nombreDia,
                    eventos: []
                };
            }
            
            eventosPorAnio[año][mes].dias[dia].eventos.push(evento);
        });
        
        // Crear HTML para el menú
        let html = '';
        
        // Ordenar años de forma descendente
        const años = Object.keys(eventosPorAnio).sort((a, b) => b - a);
        
        años.forEach(año => {
            html += `
                <div class="event-year">
                    <div class="year-header" onclick="toggleYear(this)">
                        ${año}
                    </div>
                    <div class="year-content">
            `;
            
            // Ordenar meses de forma descendente
            const meses = Object.keys(eventosPorAnio[año]).sort((a, b) => b - a);
            
            meses.forEach(mes => {
                const mesData = eventosPorAnio[año][mes];
                html += `
                    <div class="event-month">
                        <div class="month-header" onclick="toggleMonth(this)">
                            ${mesData.nombre.charAt(0).toUpperCase() + mesData.nombre.slice(1)}
                        </div>
                        <div class="month-content">
                `;
                
                // Ordenar días de forma descendente
                const dias = Object.keys(mesData.dias).sort((a, b) => b - a);
                
                dias.forEach(dia => {
                    const diaData = mesData.dias[dia];
                    html += `
                        <div class="day-events">
                            <div class="day-header">
                                ${dia} de ${mesData.nombre} (${diaData.nombre})
                            </div>
                    `;
                    
                    diaData.eventos.forEach(evento => {
                        html += `
                            <div class="day-event" onclick="verDetalleEvento(${evento.id})">
                                ${evento.nombre}
                            </div>
                        `;
                    });
                    
                    html += '</div>';
                });
                
                html += '</div></div>';
            });
            
            html += '</div></div>';
        });
        
        eventosMenu.innerHTML = html;
    }
    
    // Manejar envío del formulario de evento
    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const data = getData();
        const nombre = document.getElementById('eventName').value;
        const fecha = document.getElementById('eventDate').value;
        
        // Obtener asistentes seleccionados
        const asistentesCheckboxes = document.querySelectorAll('#asistentesList input[type="checkbox"]:checked');
        const asistentes = Array.from(asistentesCheckboxes).map(cb => parseInt(cb.value));
        
        if (currentEventId) {
            // Editar evento existente
            const index = data.eventos.findIndex(e => e.id === currentEventId);
            if (index !== -1) {
                data.eventos[index] = {
                    ...data.eventos[index],
                    nombre,
                    fecha,
                    asistentes
                };
            }
        } else {
            // Crear nuevo evento
            const nuevoEvento = {
                id: getNextId(data.eventos),
                nombre,
                fecha,
                asistentes
            };
            data.eventos.push(nuevoEvento);
        }
        
        saveData(data);
        hideEventModal();
        cargarEventos();
        cargarMenuEventos();
        
        // Mostrar mensaje de éxito
        alert(currentEventId ? 'Evento actualizado correctamente' : 'Evento creado correctamente');
    });
    
    // Manejar envío del formulario de integrante
    integranteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const data = getData();
        const nombre = document.getElementById('integranteName').value;
        const email = document.getElementById('integranteEmail').value;
        
        if (currentIntegranteId) {
            // Editar integrante existente
            const index = data.integrantes.findIndex(i => i.id === currentIntegranteId);
            if (index !== -1) {
                data.integrantes[index] = {
                    ...data.integrantes[index],
                    nombre,
                    email: email || null
                };
            }
        } else {
            // Crear nuevo integrante
            const nuevoIntegrante = {
                id: getNextId(data.integrantes),
                nombre,
                email: email || null
            };
            data.integrantes.push(nuevoIntegrante);
        }
        
        saveData(data);
        hideIntegranteModal();
        cargarIntegrantes();
        
        // Mostrar mensaje de éxito
        alert(currentIntegranteId ? 'Integrante actualizado correctamente' : 'Integrante agregado correctamente');
    });
    
    // Asignar eventos
    menuBtn.addEventListener('click', showMenu);
    closeMenuBtn.addEventListener('click', hideMenu);
    overlay.addEventListener('click', hideMenu);
    
    addEventBtn.addEventListener('click', () => showEventModal());
    closeModalBtn.addEventListener('click', hideEventModal);
    closeIntegranteModalBtn.addEventListener('click', hideIntegranteModal);
    
    // Eventos del menú
    menuIntegrantes.addEventListener('click', () => {
        hideMenu();
        cargarIntegrantes();
        showView(integrantesView);
    });
    
    menuEventos.addEventListener('click', () => {
        hideMenu();
        cargarEventos();
        showView(eventosView);
    });
    
    menuInicio.addEventListener('click', () => {
        hideMenu();
        showView(inicioView);
    });
    
    menuSalir.addEventListener('click', () => {
        if (confirm('¿Deseas salir de la aplicación?')) {
            // Para una PWA, podemos cerrar la ventana o simplemente volver al inicio
            showView(inicioView);
            hideMenu();
        }
    });
    
    // Agregar integrante
    if (addIntegranteBtn) {
        addIntegranteBtn.addEventListener('click', () => showIntegranteModal());
    }
    
    // Cerrar modales al hacer clic fuera de ellos
    window.addEventListener('click', (e) => {
        if (e.target === eventModal) {
            hideEventModal();
        }
        if (e.target === integranteModal) {
            hideIntegranteModal();
        }
    });
    
    // Inicializar
    cargarIntegrantes();
    cargarEventos();
    showView(inicioView);
});

// Funciones globales para uso en onclick
function editarEvento(id) {
    showEventModal(id);
}

function eliminarEvento(id) {
    if (confirm('¿Estás seguro de eliminar este evento?')) {
        const data = getData();
        data.eventos = data.eventos.filter(e => e.id !== id);
        saveData(data);
        cargarEventos();
        cargarMenuEventos();
        alert('Evento eliminado correctamente');
    }
}

function editarIntegrante(id) {
    showIntegranteModal(id);
}

function eliminarIntegrante(id) {
    const data = getData();
    
    // Verificar si el integrante está en algún evento
    const enEventos = data.eventos.some(e => e.asistentes.includes(id));
    
    if (enEventos) {
        alert('No se puede eliminar este integrante porque está registrado en uno o más eventos. Primero edita los eventos para eliminar su asistencia.');
        return;
    }
    
    if (confirm('¿Estás seguro de eliminar este integrante?')) {
        data.integrantes = data.integrantes.filter(i => i.id !== id);
        saveData(data);
        cargarIntegrantes();
        alert('Integrante eliminado correctamente');
    }
}

function verDetalleEvento(id) {
    const data = getData();
    const evento = data.eventos.find(e => e.id === id);
    
    if (evento) {
        const fecha = new Date(evento.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Obtener nombres de asistentes
        const asistentesNombres = evento.asistentes.map(id => {
            const integrante = data.integrantes.find(i => i.id === id);
            return integrante ? integrante.nombre : 'Desconocido';
        });
        
        const detalleView = document.getElementById('detalleEventoView');
        detalleView.innerHTML = `
            <div class="section-header">
                <h2>${evento.nombre}</h2>
            </div>
            <div class="evento-card">
                <div class="evento-date">${fechaFormateada}</div>
                <div class="evento-asistentes">
                    <strong>Asistentes (${asistentesNombres.length}):</strong> 
                    ${asistentesNombres.length > 0 ? 
                        `<ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                            ${asistentesNombres.map(nombre => `<li>${nombre}</li>`).join('')}
                        </ul>` : 
                        'Ninguno'}
                </div>
                <div class="actions">
                    <button class="btn-edit" onclick="editarEvento(${evento.id})">Editar Evento</button>
                    <button class="btn-delete" onclick="eliminarEvento(${evento.id})">Eliminar Evento</button>
                    <button class="btn-edit" onclick="showView(document.getElementById('eventosView'))">Volver a Eventos</button>
                </div>
            </div>
        `;
        
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        detalleView.classList.add('active');
        document.getElementById('appTitle').textContent = 'Detalle del Evento';
        hideMenu();
    }
}

function toggleYear(element) {
    element.classList.toggle('expanded');
    const content = element.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
}

function toggleMonth(element) {
    element.classList.toggle('expanded');
    const content = element.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
}

// Hacer las funciones globales disponibles
window.editarEvento = editarEvento;
window.eliminarEvento = eliminarEvento;
window.editarIntegrante = editarIntegrante;
window.eliminarIntegrante = eliminarIntegrante;
window.verDetalleEvento = verDetalleEvento;
window.toggleYear = toggleYear;
window.toggleMonth = toggleMonth;
window.showView = function(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    view.classList.add('active');
    document.getElementById('appTitle').textContent = view.id === 'inicioView' ? 'Gestor de Eventos K-Pop' : 
                                                     view.id === 'integrantesView' ? 'Integrantes' : 
                                                     view.id === 'eventosView' ? 'Eventos' : 
                                                     view.id === 'detalleEventoView' ? 'Detalle del Evento' : 'Gestor de Eventos K-Pop';
};

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registrado con éxito:', registration.scope);
            })
            .catch(error => {
                console.log('Error al registrar el Service Worker:', error);
            });
    });
}
