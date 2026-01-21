// Aplicación principal
class ArtCorEventsApp {
    constructor() {
        // Inicializar datos - CORREGIDOS NOMBRES DE LOCALSTORAGE
        this.members = JSON.parse(localStorage.getItem('artcor_members')) || [];
        this.events = JSON.parse(localStorage.getItem('artcor_events')) || [];
        
        this.currentEventId = null;
        this.nextId = Math.max(
            ...this.events.map(e => e.id || 0), 
            ...this.members.map(m => m.id || 0), 
            0
        ) + 1;
        
        // Inicializar la app
        this.init();
    }
    
    init() {
        // Registrar Service Worker - RUTA CORREGIDA (relativa)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js', {
                scope: './'
            })
            .then(registration => {
                console.log('Service Worker registrado con éxito:', registration.scope);
                
                // Verificar actualizaciones
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('Nueva versión del Service Worker encontrada');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                console.log('Nueva versión disponible');
                            }
                        }
                    });
                });
            })
            .catch(error => {
                console.log('Error al registrar el Service Worker:', error);
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
        
        // Establecer fecha mínima para input date (hoy)
        const today = new Date().toISOString().split('T')[0];
        if (this.eventDate) {
            this.eventDate.min = today;
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
        
        // Prevenir envío de formularios con Enter
        this.addMemberForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.target.matches('button')) {
                e.preventDefault();
            }
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
        
        // Enfocar el primer campo
        setTimeout(() => this.eventName.focus(), 50);
    }
    
    closeEventModal() {
        this.eventModal.querySelector('.modal-content').style.transform = 'translateY(20px)';
        setTimeout(() => {
            this.eventModal.classList.remove('active');
            this.currentEventId = null;
            this.eventForm.reset();
        }, 300);
    }
    
    saveEvent(e) {
        e.preventDefault();
        
        if (!this.eventName.value.trim()) {
            this.showNotification('Por favor ingresa un nombre para el evento');
            this.eventName.focus();
            return;
        }
        
        const eventData = {
            id: this.currentEventId || this.nextId++,
            name: this.eventName.value.trim(),
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
        this.showNotification(eventData.name + ' guardado exitosamente');
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
        
        if (this.members.length === 0) {
            this.membersChecklist.innerHTML = '<p class="no-members">No hay miembros registrados</p>';
            this.membersList.innerHTML = '<p class="no-members">No hay miembros registrados</p>';
            return;
        }
        
        this.members.forEach(member => {
            // Checklist para eventos
            const checkItem = document.createElement('label');
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
                    <button class="edit-member" data-id="${member.id}" title="Editar">✏️</button>
                    <button class="delete-member" data-id="${member.id}" title="Eliminar">🗑️</button>
                </div>
            `;
            this.membersList.appendChild(listItem);
        });
        
        // Agregar event listeners a los botones de miembros
        setTimeout(() => {
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
        }, 100);
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
        
        // Enfocar el primer campo
        setTimeout(() => this.memberName.focus(), 50);
    }
    
    closeMembersModalFn() {
        this.membersModal.querySelector('.modal-content').style.transform = 'translateY(20px)';
        setTimeout(() => {
            this.membersModal.classList.remove('active');
            this.addMemberForm.reset();
        }, 300);
    }
    
    addMember(e) {
        e.preventDefault();
        
        const name = this.memberName.value.trim();
        const role = this.memberRole.value.trim();
        
        if (!name || !role) {
            this.showNotification('Por favor completa ambos campos');
            return;
        }
        
        // Verificar si ya existe un miembro con ese nombre
        if (this.members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
            this.showNotification('Ya existe un miembro con ese nombre');
            this.memberName.focus();
            return;
        }
        
        const memberData = {
            id: this.nextId++,
            name: name,
            role: role
        };
        
        this.members.push(memberData);
        this.saveToLocalStorage();
        this.renderMembers();
        
        // Limpiar formulario
        this.addMemberForm.reset();
        
        // Enfocar de nuevo en el nombre
        this.memberName.focus();
        
        this.showNotification(name + ' agregado como ' + role);
    }
    
    editMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;
        
        const newName = prompt('Nuevo nombre:', member.name);
        if (newName !== null && newName.trim() !== '') {
            const newRole = prompt('Nuevo rol:', member.role);
            if (newRole !== null && newRole.trim() !== '') {
                member.name = newName.trim();
                member.role = newRole.trim();
                this.saveToLocalStorage();
                this.renderMembers();
                this.showNotification('Integrante actualizado');
            }
        }
    }
    
    deleteMember(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;
        
        // Verificar si el miembro está en algún evento
        const eventsWithMember = this.events.filter(event => 
            event.attendees.includes(memberId)
        );
        
        if (eventsWithMember.length > 0) {
            const eventNames = eventsWithMember.map(e => e.name).join(', ');
            alert(`No se puede eliminar "${member.name}" porque está registrado en los siguientes eventos:\n\n${eventNames}\n\nPrimero elimínalo de los eventos correspondientes.`);
            return;
        }
        
        if (confirm(`¿Estás seguro de que quieres eliminar a "${member.name}"?`)) {
            this.members = this.members.filter(m => m.id !== memberId);
            this.saveToLocalStorage();
            this.renderMembers();
            this.showNotification(member.name + ' eliminado');
        }
    }
    
    // Funciones para eventos y listado
    renderEvents() {
        this.eventsList.innerHTML = '';
        
        if (this.events.length === 0) {
            this.eventsList.innerHTML = '<p class="no-events">No hay eventos registrados</p>';
            return;
        }
        
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
                    ${attendeeNames.length > 0 ? 
                        attendeeNames.map(name => 
                            `<span class="member-tag">${name}</span>`
                        ).join('') : 
                        '<span class="no-attendees">Sin asistentes registrados</span>'
                    }
                </div>
                <div class="event-actions">
                    <button class="edit-event" data-id="${event.id}" title="Editar">✏️</button>
                    <button class="delete-event" data-id="${event.id}" title="Eliminar">🗑️</button>
                </div>
            `;
            
            this.eventsList.appendChild(eventCard);
        });
        
        // Agregar event listeners a los botones de eventos
        setTimeout(() => {
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
        }, 100);
    }
    
    renderEventTree() {
        this.eventTree.innerHTML = '';
        
        if (this.events.length === 0) {
            this.eventTree.innerHTML = '<p class="no-events-tree">No hay eventos para mostrar</p>';
            return;
        }
        
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
                    name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                    days: {}
                };
            }
            
            if (!eventsByYear[year][month].days[day]) {
                eventsByYear[year][month].days[day] = {
                    name: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${day}`,
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
            
            // Ordenar meses (de más reciente a más antiguo)
            const sortedMonths = Object.entries(months)
                .sort((a, b) => b[0] - a[0])
                .map(([monthIndex, monthData]) => ({ 
                    monthIndex: parseInt(monthIndex), 
                    ...monthData 
                }));
            
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
                
                // Ordenar días (de más reciente a más antiguo)
                const sortedDays = Object.entries(monthData.days)
                    .sort((a, b) => b[0] - a[0])
                    .map(([dayIndex, dayData]) => ({ 
                        dayIndex: parseInt(dayIndex), 
                        ...dayData 
                    }));
                
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
                    
                    const dayHeader = document.createElement('div');
                    dayHeader.className = 'day-header';
                    dayHeader.innerHTML = `
                        <span>${dayData.name}</span>
                        <span>▼</span>
                    `;
                    
                    dayHeader.addEventListener('click', () => {
                        dayEvents.classList.toggle('expanded');
                        const arrow = dayHeader.querySelector('span:last-child');
                        arrow.textContent = dayEvents.classList.contains('expanded') ? '▲' : '▼';
                    });
                    
                    monthDays.appendChild(dayHeader);
                    monthDays.appendChild(dayEvents);
                });
                
                const yearHeader = yearGroup.querySelector('.year-header');
                yearHeader.addEventListener('click', () => {
                    monthGroup.classList.toggle('expanded');
                    const arrow = yearHeader.querySelector('span:last-child');
                    arrow.textContent = monthGroup.classList.contains('expanded') ? '▲' : '▼';
                });
                
                const monthHeader = monthGroup.querySelector('.month-header');
                monthHeader.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dayElements = monthGroup.querySelectorAll('.day-events');
                    dayElements.forEach(day => {
                        day.classList.toggle('expanded');
                    });
                    const arrow = monthHeader.querySelector('span:last-child');
                    const allExpanded = Array.from(dayElements).every(day => 
                        day.classList.contains('expanded')
                    );
                    arrow.textContent = allExpanded ? '▲' : '▼';
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
        
        if (this.members.length === 0) {
            this.statsContent.innerHTML = '<p class="no-stats">No hay miembros registrados</p>';
            return;
        }
        
        if (this.events.length === 0) {
            this.statsContent.innerHTML = '<p class="no-stats">No hay eventos para calcular estadísticas</p>';
            return;
        }
        
        // Calcular estadísticas para cada miembro
        this.members.forEach(member => {
            const memberStats = this.calculateMemberStats(member.id, filter);
            
            const statCard = document.createElement('div');
            statCard.className = 'member-stats';
            
            // Determinar color según porcentaje
            let percentageClass = 'percentage-low';
            if (memberStats.percentage >= 75) percentageClass = 'percentage-high';
            else if (memberStats.percentage >= 50) percentageClass = 'percentage-medium';
            
            statCard.innerHTML = `
                <div class="member-stats-header">
                    <div class="member-stats-name">
                        <strong>${member.name}</strong>
                        <small>${member.role}</small>
                    </div>
                    <div class="attendance-percentage ${percentageClass}">
                        ${memberStats.percentage}%
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${memberStats.percentage}%"></div>
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
        let periodText = '';
        
        if (filter === 'all') {
            relevantEvents = this.events;
            periodText = 'totales';
        } else if (filter === 'year') {
            // Último año
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            relevantEvents = this.events.filter(event => 
                new Date(event.date) >= oneYearAgo
            );
            periodText = 'en el último año';
        } else if (filter === 'month') {
            // Último mes
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            relevantEvents = this.events.filter(event => 
                new Date(event.date) >= oneMonthAgo
            );
            periodText = 'en el último mes';
        }
        
        const totalEvents = relevantEvents.length;
        const attendedEvents = relevantEvents.filter(event => 
            event.attendees.includes(memberId)
        ).length;
        
        const percentage = totalEvents > 0 ? 
            Math.round((attendedEvents / totalEvents) * 100) : 0;
        
        const details = totalEvents > 0 ? 
            `Asistió a ${attendedEvents} de ${totalEvents} eventos ${periodText}` :
            `No hay eventos ${periodText}`;
        
        return { percentage, details };
    }
    
    // Funciones de utilidad
    saveToLocalStorage() {
        localStorage.setItem('artcor_members', JSON.stringify(this.members));
        localStorage.setItem('artcor_events', JSON.stringify(this.events));
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
            max-width: 300px;
            word-break: break-word;
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
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la ruta correcta de GitHub Pages
    const currentPath = window.location.pathname;
    const isCorrectPath = currentPath === '/' || currentPath.includes('artcor-events');
    
    if (!isCorrectPath) {
        console.log('Redirigiendo a la ruta correcta de la PWA...');
        window.location.href = '/artcor-events/';
        return;
    }
    
    window.app = new ArtCorEventsApp();
    
    // Agregar estilos CSS para los elementos dinámicos
    const dynamicStyles = document.createElement('style');
    dynamicStyles.textContent = `
        .no-members, .no-events, .no-stats, .no-events-tree {
            text-align: center;
            padding: 2rem;
            color: #666;
            font-style: italic;
        }
        
        .notification {
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
        }
        
        .percentage-high { color: #4CAF50; }
        .percentage-medium { color: #FF9800; }
        .percentage-low { color: #F44336; }
        
        .progress-bar {
            height: 6px;
            background: #eee;
            border-radius: 3px;
            margin: 0.5rem 0;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff5a8c, #ff8fab);
            transition: width 0.5s ease;
        }
        
        .no-attendees {
            color: #999;
            font-style: italic;
        }
    `;
    document.head.appendChild(dynamicStyles);
});

// Manejar recarga de la PWA
if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });
}
