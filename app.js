// Aplicación principal
class KpopEventsApp {
    constructor() {
        // Inicializar datos
        this.members = JSON.parse(localStorage.getItem('kpop_members')) || [];
        
        this.events = JSON.parse(localStorage.getItem('kpop_events')) || [];
        
        this.currentEventId = null;
        this.nextId = Math.max(...this.events.map(e => e.id), ...this.members.map(m => m.id), 0) + 1;
        
        // Inicializar la app
        this.init();
    }
    
    init() {
        // Registrar Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(registration => {
                        console.log('Service Worker registrado con éxito:', registration);
                    })
                    .catch(error => {
                        console.log('Error al registrar el Service Worker:', error);
                    });
            });
        }
        
        // Cargar elementos del DOM
        this.loadDOMElements();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Renderizar datos iniciales
        this.renderMembers();
        this.renderEvents();
        this.renderEventTree();
        
        // Mostrar mensaje de bienvenida si no hay eventos
        if (this.events.length === 0) {
            document.getElementById('welcomeSection').style.display = 'block';
            document.getElementById('eventsSection').style.display = 'none';
        } else {
            document.getElementById('welcomeSection').style.display = 'none';
            document.getElementById('eventsSection').style.display = 'block';
        }
    }
    
    loadDOMElements() {
        // Botones principales
        this.menuToggle = document.getElementById('menuToggle');
        this.closeMenu = document.getElementById('closeMenu');
        this.menuOverlay = document.getElementById('menuOverlay');
        this.sideMenu = document.getElementById('sideMenu');
        this.addEventBtn = document.getElementById('addEventBtn');
        
        // Modales
        this.eventModal = document.getElementById('eventModal');
        this.membersModal = document.getElementById('membersModal');
        this.attendanceModal = document.getElementById('attendanceModal');
        
        // Botones de cierre de modales
        this.closeModal = document.getElementById('closeModal');
        this.closeMembersModal = document.getElementById('closeMembersModal');
        this.closeAttendanceModal = document.getElementById('closeAttendanceModal');
        this.cancelEvent = document.getElementById('cancelEvent');
        
        // Formularios
        this.eventForm = document.getElementById('eventForm');
        this.addMemberForm = document.getElementById('addMemberForm');
        
        // Elementos de listas
        this.membersChecklist = document.getElementById('membersChecklist');
        this.membersList = document.getElementById('membersList');
        this.eventsList = document.getElementById('eventsList');
        this.eventTree = document.getElementById('eventTree');
        this.statsContent = document.getElementById('statsContent');
        
        // Botones del menú
        this.manageMembers = document.getElementById('manageMembers');
        this.viewAttendance = document.getElementById('viewAttendance');
        this.exitApp = document.getElementById('exitApp');
        
        // Campos de formulario
        this.eventName = document.getElementById('eventName');
        this.eventDate = document.getElementById('eventDate');
        this.memberName = document.getElementById('memberName');
        this.memberRole = document.getElementById('memberRole');
        
        // Filtros de estadísticas
        this.filterButtons = document.querySelectorAll('.filter-btn');
    }
    
    setupEventListeners() {
        // Menú
        this.menuToggle.addEventListener('click', () => this.toggleMenu());
        this.closeMenu.addEventListener('click', () => this.toggleMenu());
        this.menuOverlay.addEventListener('click', () => this.toggleMenu());
        
        // Eventos
        this.addEventBtn.addEventListener('click', () => this.openEventModal());
        this.closeModal.addEventListener('click', () => this.closeEventModal());
        this.cancelEvent.addEventListener('click', () => this.closeEventModal());
        this.eventForm.addEventListener('submit', (e) => this.saveEvent(e));
        
        // Gestión de miembros
        this.manageMembers.addEventListener('click', () => this.openMembersModal());
        this.closeMembersModal.addEventListener('click', () => this.closeMembersModalFn());
        this.addMemberForm.addEventListener('submit', (e) => this.addMember(e));
        
        // Asistencia
        this.viewAttendance.addEventListener('click', () => this.openAttendanceModal());
        this.closeAttendanceModal.addEventListener('click', () => this.closeAttendanceModalFn());
        
        // Salir de la app
        this.exitApp.addEventListener('click', () => this.exitApplication());
        
        // Filtros de estadísticas
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.filterStats(e));
        });
        
        // Cerrar modales al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === this.eventModal) this.closeEventModal();
            if (e.target === this.membersModal) this.closeMembersModalFn();
            if (e.target === this.attendanceModal) this.closeAttendanceModalFn();
        });
    }
    
    // Funciones del menú
    toggleMenu() {
        this.sideMenu.classList.toggle('active');
        this.menuOverlay.classList.toggle('active');
        
        // Animar botón hamburguesa
        const spans = this.menuToggle.querySelectorAll('span');
        if (this.sideMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    }
    
    // Funciones para eventos
    openEventModal(event = null) {
        this.currentEventId = event ? event.id : null;
        
        document.getElementById('modalTitle').textContent = 
            event ? 'Editar Evento' : 'Nuevo Evento';
        
        if (event) {
            this.eventName.value = event.name;
            this.eventDate.value = event.date;
        } else {
            this.eventName.value = '';
            // Establecer fecha por defecto a hoy
            const today = new Date().toISOString().split('T')[0];
            this.eventDate.value = today;
        }
        
        this.renderMembersChecklist(event ? event.attendees : []);
        this.eventModal.classList.add('active');
        
        // Animar entrada
        setTimeout(() => {
            this.eventModal.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);
    }
    
    closeEventModal() {
        this.eventModal.querySelector('.modal-content').style.transform = 'translateY(20px)';
        setTimeout(() => {
            this.eventModal.classList.remove('active');
            this.currentEventId = null;
        }, 300);
    }
    
    saveEvent(e) {
        e.preventDefault();
        
        const eventData = {
            id: this.currentEventId || this.nextId++,
            name: this.eventName.value,
            date: this.eventDate.value,
            attendees: []
        };
        
        // Obtener miembros seleccionados
        const checkboxes = this.membersChecklist.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            eventData.attendees.push(parseInt(checkbox.value));
        });
        
        if (this.currentEventId) {
            // Actualizar evento existente
            const index = this.events.findIndex(e => e.id === this.currentEventId);
            this.events[index] = eventData;
        } else {
            // Agregar nuevo evento
            this.events.push(eventData);
        }
        
        this.saveToLocalStorage();
        this.renderEvents();
        this.renderEventTree();
        this.closeEventModal();
        
        // Mostrar sección de eventos si estaba en bienvenida
        document.getElementById('welcomeSection').style.display = 'none';
        document.getElementById('eventsSection').style.display = 'block';
        
        // Mostrar notificación de éxito
        this.showNotification('Evento guardado exitosamente');
    }
    
    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event) this.openEventModal(event);
    }
    
    deleteEvent(eventId) {
        if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
            this.events = this.events.filter(e => e.id !== eventId);
            this.saveToLocalStorage();
            this.renderEvents();
            this.renderEventTree();
            
            // Si no hay eventos, mostrar bienvenida
            if (this.events.length === 0) {
                document.getElementById('welcomeSection').style.display = 'block';
                document.getElementById('eventsSection').style.display = 'none';
            }
            
            this.showNotification('Evento eliminado');
        }
    }
    
    // Funciones para miembros
    renderMembers() {
        this.membersChecklist.innerHTML = '';
        this.membersList.innerHTML = '';
        
        this.members.forEach(member => {
            // Checklist para eventos
            const checkItem = document.createElement('div');
            checkItem.className = 'member-check';
            checkItem.innerHTML = `
                <input type="checkbox" id="member_${member.id}" value="${member.id}">
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-role">${member.role}</div>
                </div>
            `;
            this.membersChecklist.appendChild(checkItem);
            
            // Lista para gestión
            const listItem = document.createElement('div');
            listItem.className = 'member-item';
            listItem.innerHTML = `
                <div class="member-details">
                    <h4>${member.name}</h4>
                    <p>${member.role}</p>
                </div>
                <div class="member-actions">
                    <button class="edit-member" data-id="${member.id}">✏️</button>
                    <button class="delete-member" data-id="${member.id}">🗑️</button>
                </div>
            `;
            this.membersList.appendChild(listItem);
        });
        
        // Agregar event listeners a los botones de miembros
        document.querySelectorAll('.edit-member').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = parseInt(e.target.closest('button').dataset.id);
                this.editMember(memberId);
            });
        });
        
        document.querySelectorAll('.delete-member').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memberId = parseInt(e.target.closest('button').dataset.id);
                this.deleteMember(memberId);
            });
        });
    }
    
    renderMembersChecklist(attendees) {
        const checkboxes = this.membersChecklist.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = attendees.includes(parseInt(checkbox.value));
        });
    }
    
    openMembersModal() {
        this.renderMembers();
        this.membersModal.classList.add('active');
        this.toggleMenu();
        
        setTimeout(() => {
            this.membersModal.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);
    }
    
    closeMembersModalFn() {
        this.membersModal.querySelector('.modal-content').style.transform = 'translateY(20px)';
        setTimeout(() => {
            this.membersModal.classList.remove('active');
        }, 300);
    }
    
    addMember(e) {
        e.preventDefault();
        
        const memberData = {
            id: this.nextId++,
            name: this.memberName.value,
            role: this.memberRole.value
        };
        
        this.members.push(memberData);
        this.saveToLocalStorage();
        this.renderMembers();
        
        // Limpiar formulario
        this.memberName.value = '';
        this.memberRole.value = '';
        
        this.showNotification('Integrante agregado');
    }
    
    editMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;
        
        const newName = prompt('Nuevo nombre:', member.name);
        if (newName !== null) {
            const newRole = prompt('Nuevo rol:', member.role);
            if (newRole !== null) {
                member.name = newName;
                member.role = newRole;
                this.saveToLocalStorage();
                this.renderMembers();
                this.showNotification('Integrante actualizado');
            }
        }
    }
    
    deleteMember(memberId) {
        if (confirm('¿Estás seguro de que quieres eliminar este integrante?')) {
            // Verificar si el miembro está en algún evento
            const isInEvent = this.events.some(event => 
                event.attendees.includes(memberId)
            );
            
            if (isInEvent) {
                alert('No se puede eliminar este integrante porque está registrado en uno o más eventos. Primero elimínalo de los eventos correspondientes.');
                return;
            }
            
            this.members = this.members.filter(m => m.id !== memberId);
            this.saveToLocalStorage();
            this.renderMembers();
            this.showNotification('Integrante eliminado');
        }
    }
    
    // Funciones para eventos y listado
    renderEvents() {
        this.eventsList.innerHTML = '';
        
        // Ordenar eventos por fecha (más recientes primero)
        const sortedEvents = [...this.events].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sortedEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Obtener nombres de los asistentes
            const attendeeNames = event.attendees.map(attendeeId => {
                const member = this.members.find(m => m.id === attendeeId);
                return member ? member.name : 'Desconocido';
            });
            
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <h3>${event.name}</h3>
                <div class="event-date">${formattedDate}</div>
                <div class="event-members">
                    ${attendeeNames.map(name => 
                        `<span class="member-tag">${name}</span>`
                    ).join('')}
                </div>
                <div class="event-actions">
                    <button class="edit-event" data-id="${event.id}">✏️</button>
                    <button class="delete-event" data-id="${event.id}">🗑️</button>
                </div>
            `;
            
            this.eventsList.appendChild(eventCard);
        });
        
        // Agregar event listeners a los botones de eventos
        document.querySelectorAll('.edit-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = parseInt(e.target.closest('button').dataset.id);
                this.editEvent(eventId);
            });
        });
        
        document.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = parseInt(e.target.closest('button').dataset.id);
                this.deleteEvent(eventId);
            });
        });
    }
    
    renderEventTree() {
        this.eventTree.innerHTML = '';
        
        // Organizar eventos por año, mes y día
        const eventsByYear = {};
        
        this.events.forEach(event => {
            const date = new Date(event.date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
            
            if (!eventsByYear[year]) {
                eventsByYear[year] = {};
            }
            
            if (!eventsByYear[year][month]) {
                eventsByYear[year][month] = {
                    name: monthName,
                    days: {}
                };
            }
            
            if (!eventsByYear[year][month].days[day]) {
                eventsByYear[year][month].days[day] = {
                    name: `${dayName} ${day}`,
                    events: []
                };
            }
            
            eventsByYear[year][month].days[day].events.push(event);
        });
        
        // Crear estructura HTML
        for (const [year, months] of Object.entries(eventsByYear).sort((a, b) => b[0] - a[0])) {
            const yearGroup = document.createElement('div');
            yearGroup.className = 'year-group';
            yearGroup.innerHTML = `
                <div class="year-header">
                    <span>${year}</span>
                    <span>▼</span>
                </div>
                <div class="year-months"></div>
            `;
            
            const yearMonths = yearGroup.querySelector('.year-months');
            
            // Ordenar meses
            const sortedMonths = Object.entries(months)
                .sort((a, b) => b[0] - a[0])
                .map(([monthIndex, monthData]) => ({ monthIndex: parseInt(monthIndex), ...monthData }));
            
            sortedMonths.forEach(monthData => {
                const monthGroup = document.createElement('div');
                monthGroup.className = 'month-group';
                monthGroup.innerHTML = `
                    <div class="month-header">
                        <span>${monthData.name}</span>
                        <span>▼</span>
                    </div>
                    <div class="month-days"></div>
                `;
                
                const monthDays = monthGroup.querySelector('.month-days');
                
                // Ordenar días
                const sortedDays = Object.entries(monthData.days)
                    .sort((a, b) => b[0] - a[0])
                    .map(([dayIndex, dayData]) => ({ dayIndex: parseInt(dayIndex), ...dayData }));
                
                sortedDays.forEach(dayData => {
                    const dayEvents = document.createElement('div');
                    dayEvents.className = 'day-events';
                    
                    dayData.events.forEach(event => {
                        const dayEvent = document.createElement('div');
                        dayEvent.className = 'day-event';
                        dayEvent.innerHTML = `
                            <span>${event.name}</span>
                            <span>→</span>
                        `;
                        dayEvent.addEventListener('click', () => {
                            this.editEvent(event.id);
                            this.toggleMenu();
                        });
                        dayEvents.appendChild(dayEvent);
                    });
                    
                    const monthHeader = monthGroup.querySelector('.month-header');
                    monthHeader.addEventListener('click', () => {
                        dayEvents.classList.toggle('expanded');
                        const arrow = monthHeader.querySelector('span:last-child');
                        arrow.textContent = dayEvents.classList.contains('expanded') ? '▲' : '▼';
                    });
                    
                    monthDays.appendChild(dayEvents);
                });
                
                const yearHeader = yearGroup.querySelector('.year-header');
                yearHeader.addEventListener('click', () => {
                    monthGroup.classList.toggle('expanded');
                    const arrow = yearHeader.querySelector('span:last-child');
                    arrow.textContent = monthGroup.classList.contains('expanded') ? '▲' : '▼';
                });
                
                yearMonths.appendChild(monthGroup);
            });
            
            this.eventTree.appendChild(yearGroup);
        }
    }
    
    // Funciones para estadísticas
    openAttendanceModal() {
        this.renderAttendanceStats('all');
        this.attendanceModal.classList.add('active');
        this.toggleMenu();
        
        setTimeout(() => {
            this.attendanceModal.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);
    }
    
    closeAttendanceModalFn() {
        this.attendanceModal.querySelector('.modal-content').style.transform = 'translateY(20px)';
        setTimeout(() => {
            this.attendanceModal.classList.remove('active');
        }, 300);
    }
    
    filterStats(e) {
        const filter = e.target.dataset.filter;
        
        // Actualizar botones activos
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        this.renderAttendanceStats(filter);
    }
    
    renderAttendanceStats(filter) {
        this.statsContent.innerHTML = '';
        
        // Calcular estadísticas para cada miembro
        this.members.forEach(member => {
            const memberStats = this.calculateMemberStats(member.id, filter);
            
            const statCard = document.createElement('div');
            statCard.className = 'member-stats';
            statCard.innerHTML = `
                <div class="member-stats-header">
                    <div class="member-stats-name">${member.name} - ${member.role}</div>
                    <div class="attendance-percentage">${memberStats.percentage}%</div>
                </div>
                <div class="attendance-details">
                    ${memberStats.details}
                </div>
            `;
            
            this.statsContent.appendChild(statCard);
        });
    }
    
    calculateMemberStats(memberId, filter) {
        let relevantEvents = [];
        
        if (filter === 'all') {
            relevantEvents = this.events;
        } else if (filter === 'year') {
            // Último año
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            relevantEvents = this.events.filter(event => 
                new Date(event.date) >= oneYearAgo
            );
        } else if (filter === 'month') {
            // Último mes
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            relevantEvents = this.events.filter(event => 
                new Date(event.date) >= oneMonthAgo
            );
        }
        
        const totalEvents = relevantEvents.length;
        const attendedEvents = relevantEvents.filter(event => 
            event.attendees.includes(memberId)
        ).length;
        
        const percentage = totalEvents > 0 ? 
            Math.round((attendedEvents / totalEvents) * 100) : 0;
        
        let details = '';
        if (filter === 'all') {
            details = `Asistió a ${attendedEvents} de ${totalEvents} eventos totales`;
        } else if (filter === 'year') {
            details = `Asistió a ${attendedEvents} de ${totalEvents} eventos en el último año`;
        } else if (filter === 'month') {
            details = `Asistió a ${attendedEvents} de ${totalEvents} eventos en el último mes`;
        }
        
        return { percentage, details };
    }
    
    // Funciones de utilidad
    saveToLocalStorage() {
        localStorage.setItem('kpop_members', JSON.stringify(this.members));
        localStorage.setItem('kpop_events', JSON.stringify(this.events));
    }
    
    showNotification(message) {
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff5a8c, #ff8fab);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(255, 90, 140, 0.3);
            z-index: 3000;
            transform: translateX(150%);
            transition: transform 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar notificación
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(150%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    exitApplication() {
        if (confirm('¿Estás seguro de que quieres salir de la aplicación?')) {
            // En una PWA real, podrías cerrar la ventana
            // window.close(); // Solo funciona si la ventana fue abierta por script
            
            // Alternativa: Redirigir o mostrar mensaje
            alert('Gracias por usar Eventos K-Pop. La aplicación se cerrará.');
            
            // En dispositivos móviles, no podemos cerrar la app programáticamente
            // pero podemos minimizarla o mostrar un mensaje
            this.toggleMenu();
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new KpopEventsApp();
});
