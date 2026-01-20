// Database
class Database {
    constructor() {
        this.members = JSON.parse(localStorage.getItem('members')) || [];
        this.events = JSON.parse(localStorage.getItem('events')) || [];
        this.tutorialCompleted = localStorage.getItem('tutorialCompleted') === 'true';
        this.init();
    }

    init() {
        if (!localStorage.getItem('members')) {
            this.saveMembers();
        }
        if (!localStorage.getItem('events')) {
            this.saveEvents();
        }
    }

    saveMembers() {
        localStorage.setItem('members', JSON.stringify(this.members));
    }

    saveEvents() {
        localStorage.setItem('events', JSON.stringify(this.events));
    }

    markTutorialCompleted() {
        this.tutorialCompleted = true;
        localStorage.setItem('tutorialCompleted', 'true');
    }

    resetTutorial() {
        this.tutorialCompleted = false;
        localStorage.setItem('tutorialCompleted', 'false');
    }

    addMember(name, role) {
        const member = {
            id: Date.now(),
            name,
            role
        };
        this.members.push(member);
        this.saveMembers();
        return member;
    }

    updateMember(id, name, role) {
        const index = this.members.findIndex(m => m.id === id);
        if (index !== -1) {
            this.members[index] = { id, name, role };
            this.saveMembers();
            return this.members[index];
        }
        return null;
    }

    deleteMember(id) {
        this.members = this.members.filter(m => m.id !== id);
        this.saveMembers();
    }

    addEvent(name, date, attendees) {
        const event = {
            id: Date.now(),
            name,
            date,
            attendees
        };
        this.events.push(event);
        this.saveEvents();
        return event;
    }

    updateEvent(id, name, date, attendees) {
        const index = this.events.findIndex(e => e.id === id);
        if (index !== -1) {
            this.events[index] = { id, name, date, attendees };
            this.saveEvents();
            return this.events[index];
        }
        return null;
    }

    deleteEvent(id) {
        this.events = this.events.filter(e => e.id !== id);
        this.saveEvents();
    }

    getEvent(id) {
        return this.events.find(e => e.id === id);
    }

    getMember(id) {
        return this.members.find(m => m.id === id);
    }

    getAttendanceStats(period = 'all', year = null, month = null) {
        const stats = {};
        const members = this.members;
        const events = this.events.filter(event => {
            const eventDate = new Date(event.date);
            if (period === 'all') return true;
            if (period === 'year' && year) {
                return eventDate.getFullYear() === parseInt(year);
            }
            if (period === 'month' && year && month) {
                return eventDate.getFullYear() === parseInt(year) && 
                       eventDate.getMonth() === parseInt(month);
            }
            return true;
        });

        members.forEach(member => {
            const memberEvents = events.filter(event => 
                event.attendees.includes(member.id)
            );
            
            stats[member.id] = {
                name: member.name,
                totalEvents: events.length,
                attended: memberEvents.length,
                percentage: events.length > 0 ? 
                    Math.round((memberEvents.length / events.length) * 100) : 0
            };
        });

        return stats;
    }

    getUniqueYears() {
        const years = this.events.map(event => new Date(event.date).getFullYear());
        return [...new Set(years)].sort((a, b) => b - a);
    }

    getEventsByYear(year) {
        return this.events.filter(event => 
            new Date(event.date).getFullYear() === year
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getEventsByYearMonth(year, month) {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getFullYear() === year && 
                   eventDate.getMonth() === month;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

// Tutorial Manager
class TutorialManager {
    constructor(app) {
        this.app = app;
        this.steps = [
            {
                title: "¡Hola, Alexandra! 👋",
                content: "Bienvenida a ArtCor Events, tu nueva aplicación para gestionar eventos y asistencia de manera profesional y divertida.",
                emoji: "👩‍💼"
            },
            {
                title: "📅 Gestión de Eventos",
                content: "En la sección 'Eventos' podrás crear, editar y organizar todos tus eventos. Usa el botón '+' para crear nuevos eventos.",
                emoji: "✨"
            },
            {
                title: "👥 Integrantes del Equipo",
                content: "Agrega a todos los miembros de tu proyecto en 'Integrantes'. Así podrás llevar un control de quién asiste a cada evento.",
                emoji: "👨‍👩‍👧‍👦"
            },
            {
                title: "📊 Estadísticas Inteligentes",
                content: "En 'Asistencia' verás estadísticas detalladas de la participación de cada integrante. ¡Podrás ver quién es el más puntual!",
                emoji: "📈"
            },
            {
                title: "🎉 ¡Lista para Comenzar!",
                content: "Ahora que conoces todas las funciones, ¡es hora de empezar a organizar! Toca el menú ☰ para navegar.",
                emoji: "🎊"
            }
        ];
        this.currentStep = 0;
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.tutorialOverlay = document.getElementById('tutorialOverlay');
        this.tutorialContent = document.getElementById('tutorialContent');
        this.nextTutorial = document.getElementById('nextTutorial');
        this.skipTutorial = document.getElementById('skipTutorial');
        this.currentStepElement = document.getElementById('currentStep');
        this.totalStepsElement = document.getElementById('totalSteps');
        this.startTutorial = document.getElementById('startTutorial');
    }

    bindEvents() {
        this.nextTutorial.addEventListener('click', () => this.nextStep());
        this.skipTutorial.addEventListener('click', () => this.skip());
        this.startTutorial.addEventListener('click', () => this.start());
    }

    start() {
        this.currentStep = 0;
        this.showStep();
        this.tutorialOverlay.classList.remove('hidden');
        this.createSparkleAnimation();
    }

    showStep() {
        const step = this.steps[this.currentStep];
        this.tutorialContent.innerHTML = `
            <span class="emoji">${step.emoji}</span>
            <h3>${step.title}</h3>
            <p>${step.content}</p>
        `;
        
        this.currentStepElement.textContent = this.currentStep + 1;
        this.totalStepsElement.textContent = this.steps.length;
        
        // Animación especial para el último paso
        if (this.currentStep === this.steps.length - 1) {
            this.nextTutorial.textContent = "¡Comenzar! 🚀";
            this.createConfettiAnimation();
        } else {
            this.nextTutorial.textContent = "OK, ¡Entendido! 👌";
        }
        
        // Animación de entrada
        this.tutorialContent.classList.add('slide-in');
        setTimeout(() => {
            this.tutorialContent.classList.remove('slide-in');
        }, 500);
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep();
            this.createSparkleAnimation();
        } else {
            this.complete();
        }
    }

    skip() {
        if (confirm("¿Estás segura de saltar el tutorial, Alexandra? Podrás verlo luego desde el menú de Inicio.")) {
            this.complete();
        }
    }

    complete() {
        this.app.db.markTutorialCompleted();
        this.tutorialOverlay.classList.add('hidden');
        this.createConfettiAnimation();
        this.showCompletionMessage();
    }

    createConfettiAnimation() {
        const confettiContainer = document.getElementById('confettiContainer');
        confettiContainer.innerHTML = '';
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Colores aleatorios
            const colors = ['#dc2626', '#b91c1c', '#991b1b', '#f97316', '#f59e0b'];
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Posición y tamaño aleatorios
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            
            // Animación aleatoria
            confetti.style.animationDuration = Math.random() * 2 + 2 + 's';
            confetti.style.animationDelay = Math.random() * 1 + 's';
            
            confettiContainer.appendChild(confetti);
        }
        
        // Limpiar después de la animación
        setTimeout(() => {
            confettiContainer.innerHTML = '';
        }, 3000);
    }

    createSparkleAnimation() {
        const sparkle = document.getElementById('sparkle');
        sparkle.style.display = 'block';
        sparkle.style.left = Math.random() * 80 + 10 + 'vw';
        sparkle.style.top = Math.random() * 80 + 10 + 'vh';
        
        setTimeout(() => {
            sparkle.style.display = 'none';
        }, 1000);
    }

    showCompletionMessage() {
        // Mostrar mensaje de éxito con animación
        const message = document.createElement('div');
        message.className = 'tutorial-completion';
        message.innerHTML = `
            <div class="completion-content">
                <span class="emoji">🎉</span>
                <h3>¡Excelente, Alexandra!</h3>
                <p>¡Ahora estás lista para organizar eventos como una profesional!</p>
            </div>
        `;
        
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 2001;
            animation: slideIn 0.5s ease;
        `;
        
        document.body.appendChild(message);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            message.style.animation = 'fadeIn 0.5s ease reverse';
            setTimeout(() => {
                document.body.removeChild(message);
            }, 500);
        }, 3000);
    }

    shouldShowTutorial() {
        return !this.app.db.tutorialCompleted;
    }
}

// App Controller
class App {
    constructor() {
        this.db = new Database();
        this.tutorial = new TutorialManager(this);
        this.currentView = 'home';
        this.editingMemberId = null;
        this.editingEventId = null;
        
        this.initElements();
        this.bindEvents();
        this.renderWelcome();
        this.initServiceWorker();
        
        // Mostrar tutorial si es la primera vez
        setTimeout(() => {
            if (this.tutorial.shouldShowTutorial()) {
                this.tutorial.start();
            }
        }, 1000);
    }

    initElements() {
        // Main sections
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.eventsSection = document.getElementById('eventsSection');
        this.membersSection = document.getElementById('membersSection');
        this.attendanceSection = document.getElementById('attendanceSection');
        
        // Buttons
        this.menuBtn = document.getElementById('menuBtn');
        this.addBtn = document.getElementById('addBtn');
        this.closeMenu = document.getElementById('closeMenu');
        this.menuOverlay = document.getElementById('menuOverlay');
        this.sidebar = document.getElementById('sidebar');
        
        // Menu buttons
        this.menuHome = document.getElementById('menuHome');
        this.menuEvents = document.getElementById('menuEvents');
        this.menuMembers = document.getElementById('menuMembers');
        this.menuAttendance = document.getElementById('menuAttendance');
        
        // Modals
        this.eventModal = document.getElementById('eventModalOverlay');
        this.memberModal = document.getElementById('memberModalOverlay');
        this.editEventModal = document.getElementById('editEventModalOverlay');
        
        // Event modal
        this.closeEventModal = document.getElementById('closeEventModal');
        this.saveEventBtn = document.getElementById('saveEventBtn');
        this.eventName = document.getElementById('eventName');
        this.eventDate = document.getElementById('eventDate');
        this.attendanceCheckboxes = document.getElementById('attendanceCheckboxes');
        
        // Member modal
        this.closeMemberModal = document.getElementById('closeMemberModal');
        this.saveMemberBtn = document.getElementById('saveMemberBtn');
        this.memberName = document.getElementById('memberName');
        this.memberRole = document.getElementById('memberRole');
        this.editMemberId = document.getElementById('editMemberId');
        
        // Edit event modal
        this.closeEditEventModal = document.getElementById('closeEditEventModal');
        this.updateEventBtn = document.getElementById('updateEventBtn');
        this.deleteEventBtn = document.getElementById('deleteEventBtn');
        this.editEventName = document.getElementById('editEventName');
        this.editEventDate = document.getElementById('editEventDate');
        this.editAttendanceCheckboxes = document.getElementById('editAttendanceCheckboxes');
        this.editEventId = document.getElementById('editEventId');
        
        // Members
        this.membersList = document.getElementById('membersList');
        this.addMemberBtn = document.getElementById('addMemberBtn');
        
        // Attendance
        this.periodFilter = document.getElementById('periodFilter');
        this.yearFilter = document.getElementById('yearFilter');
        this.monthFilter = document.getElementById('monthFilter');
        this.statsContainer = document.getElementById('statsContainer');
        
        // Timeline
        this.timeline = document.getElementById('timeline');
    }

    bindEvents() {
        // Menu toggle con animación
        this.menuBtn.addEventListener('click', () => {
            this.toggleMenu(true);
            this.addButtonAnimation(this.menuBtn);
        });
        
        this.closeMenu.addEventListener('click', () => {
            this.toggleMenu(false);
            this.addButtonAnimation(this.closeMenu);
        });
        
        // Menu overlay
        this.menuOverlay.addEventListener('click', () => this.toggleMenu(false));
        
        // Menu navigation con animaciones
        this.menuHome.addEventListener('click', () => {
            this.showView('home');
            this.addButtonAnimation(this.menuHome);
        });
        
        this.menuEvents.addEventListener('click', () => {
            this.showView('events');
            this.addButtonAnimation(this.menuEvents);
        });
        
        this.menuMembers.addEventListener('click', () => {
            this.showView('members');
            this.addButtonAnimation(this.menuMembers);
        });
        
        this.menuAttendance.addEventListener('click', () => {
            this.showView('attendance');
            this.addButtonAnimation(this.menuAttendance);
        });
        
        // Add buttons con animaciones
        this.addBtn.addEventListener('click', () => {
            this.addButtonAnimation(this.addBtn);
            if (this.currentView === 'events') {
                this.openEventModal();
            }
        });
        
        this.addMemberBtn.addEventListener('click', () => {
            this.addButtonAnimation(this.addMemberBtn);
            this.openMemberModal();
        });
        
        // Event modal
        this.closeEventModal.addEventListener('click', () => {
            this.closeModal(this.eventModal);
            this.addButtonAnimation(this.closeEventModal);
        });
        
        this.saveEventBtn.addEventListener('click', () => {
            this.addButtonAnimation(this.saveEventBtn);
            this.saveEvent();
        });
        
        // Member modal
        this.closeMemberModal.addEventListener('click', () => {
            this.closeModal(this.memberModal);
            this.addButtonAnimation(this.closeMemberModal);
        });
        
        this.saveMemberBtn.addEventListener('click', () => {
            this.addButtonAnimation(this.saveMemberBtn);
            this.saveMember();
        });
        
        // Edit event modal
        this.closeEditEventModal.addEventListener('click', () => {
            this.closeModal(this.editEventModal);
            this.addButtonAnimation(this.closeEditEventModal);
        });
        
        this.updateEventBtn.addEventListener('click', () => {
            this.addButtonAnimation(this.updateEventBtn);
            this.updateEvent();
        });
        
        this.deleteEventBtn.addEventListener('click', () => {
            this.addButtonAnimation(this.deleteEventBtn);
            this.deleteEvent();
        });
        
        // Filters con animaciones
        this.periodFilter.addEventListener('change', () => {
            this.addSelectAnimation(this.periodFilter);
            this.updateAttendanceStats();
        });
        
        this.yearFilter.addEventListener('change', () => {
            this.addSelectAnimation(this.yearFilter);
            this.updateAttendanceStats();
        });
        
        this.monthFilter.addEventListener('change', () => {
            this.addSelectAnimation(this.monthFilter);
            this.updateAttendanceStats();
        });
    }

    addButtonAnimation(button) {
        button.classList.add('shake-animation');
        setTimeout(() => {
            button.classList.remove('shake-animation');
        }, 500);
    }

    addSelectAnimation(select) {
        select.classList.add('bounce-animation');
        setTimeout(() => {
            select.classList.remove('bounce-animation');
        }, 300);
    }

    toggleMenu(show) {
        if (show) {
            this.sidebar.classList.add('open');
            this.menuOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            this.sidebar.classList.remove('open');
            this.menuOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    showView(view) {
        this.currentView = view;
        this.toggleMenu(false);
        
        // Hide all sections
        this.welcomeScreen.classList.add('hidden');
        this.eventsSection.classList.remove('show');
        this.membersSection.classList.remove('show');
        this.attendanceSection.classList.remove('show');
        
        // Update header
        document.querySelector('.header h1').textContent = 
            view === 'home' ? 'ArtCor Events' :
            view === 'events' ? 'Eventos' :
            view === 'members' ? 'Integrantes' : 'Asistencia';
        
        // Show/hide add button
        this.addBtn.style.display = view === 'events' ? 'block' : 'none';
        
        // Show selected section
        switch(view) {
            case 'home':
                this.welcomeScreen.classList.remove('hidden');
                break;
            case 'events':
                this.eventsSection.classList.add('show');
                this.renderTimeline();
                break;
            case 'members':
                this.membersSection.classList.add('show');
                this.renderMembers();
                break;
            case 'attendance':
                this.attendanceSection.classList.add('show');
                this.initAttendanceFilters();
                this.updateAttendanceStats();
                break;
        }
    }

    renderWelcome() {
        this.showView('home');
    }

    openEventModal(event = null) {
        this.eventName.value = event ? event.name : '';
        this.eventDate.value = event ? event.date : this.getTodayDate();
        
        // Clear and create checkboxes
        this.attendanceCheckboxes.innerHTML = '';
        this.db.members.forEach(member => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="attend_${member.id}" 
                       ${event && event.attendees.includes(member.id) ? 'checked' : ''}>
                <label for="attend_${member.id}">${member.name} (${member.role})</label>
            `;
            this.attendanceCheckboxes.appendChild(div);
        });
        
        this.eventModal.classList.remove('hidden');
    }

    openMemberModal(member = null) {
        this.memberName.value = member ? member.name : '';
        this.memberRole.value = member ? member.role : '';
        this.editMemberId.value = member ? member.id : '';
        
        document.getElementById('memberModalTitle').textContent = 
            member ? 'Editar Integrante' : 'Nuevo Integrante';
        
        this.memberModal.classList.remove('hidden');
    }

    openEditEventModal(eventId) {
        const event = this.db.getEvent(eventId);
        if (!event) return;
        
        this.editEventId.value = event.id;
        this.editEventName.value = event.name;
        this.editEventDate.value = event.date;
        
        // Clear and create checkboxes
        this.editAttendanceCheckboxes.innerHTML = '';
        this.db.members.forEach(member => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="edit_attend_${member.id}" 
                       ${event.attendees.includes(member.id) ? 'checked' : ''}>
                <label for="edit_attend_${member.id}">${member.name} (${member.role})</label>
            `;
            this.editAttendanceCheckboxes.appendChild(div);
        });
        
        this.editEventModal.classList.remove('hidden');
    }

    closeModal(modal) {
        modal.classList.add('hidden');
        this.clearModalForms();
    }

    clearModalForms() {
        this.eventName.value = '';
        this.eventDate.value = '';
        this.memberName.value = '';
        this.memberRole.value = '';
        this.editMemberId.value = '';
        this.editEventId.value = '';
        this.editEventName.value = '';
        this.editEventDate.value = '';
    }

    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    saveEvent() {
        const name = this.eventName.value.trim();
        const date = this.eventDate.value;
        
        if (!name || !date) {
            this.showAlert('¡Ups, Alexandra!', 'Por favor completa todos los campos', 'warning');
            return;
        }
        
        // Get selected attendees
        const attendees = [];
        this.db.members.forEach(member => {
            const checkbox = document.getElementById(`attend_${member.id}`);
            if (checkbox && checkbox.checked) {
                attendees.push(member.id);
            }
        });
        
        this.db.addEvent(name, date, attendees);
        this.closeModal(this.eventModal);
        this.renderTimeline();
        this.showAlert('¡Perfecto!', 'Evento creado exitosamente', 'success');
    }

    updateEvent() {
        const id = parseInt(this.editEventId.value);
        const name = this.editEventName.value.trim();
        const date = this.editEventDate.value;
        
        if (!name || !date) {
            this.showAlert('¡Ups, Alexandra!', 'Por favor completa todos los campos', 'warning');
            return;
        }
        
        // Get selected attendees
        const attendees = [];
        this.db.members.forEach(member => {
            const checkbox = document.getElementById(`edit_attend_${member.id}`);
            if (checkbox && checkbox.checked) {
                attendees.push(member.id);
            }
        });
        
        this.db.updateEvent(id, name, date, attendees);
        this.closeModal(this.editEventModal);
        this.renderTimeline();
        if (this.currentView === 'attendance') {
            this.updateAttendanceStats();
        }
        this.showAlert('¡Excelente!', 'Evento actualizado correctamente', 'success');
    }

    deleteEvent() {
        if (confirm('¿Estás segura de eliminar este evento, Alexandra?')) {
            const id = parseInt(this.editEventId.value);
            this.db.deleteEvent(id);
            this.closeModal(this.editEventModal);
            this.renderTimeline();
            if (this.currentView === 'attendance') {
                this.updateAttendanceStats();
            }
            this.showAlert('Eliminado', 'El evento ha sido eliminado', 'info');
        }
    }

    saveMember() {
        const name = this.memberName.value.trim();
        const role = this.memberRole.value.trim();
        const id = this.editMemberId.value;
        
        if (!name || !role) {
            this.showAlert('¡Ups, Alexandra!', 'Por favor completa todos los campos', 'warning');
            return;
        }
        
        if (id) {
            this.db.updateMember(parseInt(id), name, role);
            this.showAlert('¡Actualizado!', 'Integrante actualizado exitosamente', 'success');
        } else {
            this.db.addMember(name, role);
            this.showAlert('¡Agregado!', 'Nuevo integrante agregado al equipo', 'success');
        }
        
        this.closeModal(this.memberModal);
        this.renderMembers();
        
        // Refresh if we're in events view
        if (this.currentView === 'events') {
            this.renderTimeline();
        }
    }

    deleteMember(id) {
        if (confirm('¿Estás segura de eliminar este integrante, Alexandra?')) {
            this.db.deleteMember(id);
            this.renderMembers();
            
            // Refresh if we're in events view
            if (this.currentView === 'events') {
                this.renderTimeline();
            }
            
            // Refresh if we're in attendance view
            if (this.currentView === 'attendance') {
                this.updateAttendanceStats();
            }
            
            this.showAlert('Eliminado', 'El integrante ha sido eliminado', 'info');
        }
    }

    showAlert(title, message, type) {
        // Crear alerta personalizada
        const alert = document.createElement('div');
        alert.className = `custom-alert alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;
        
        alert.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(alert);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            alert.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                document.body.removeChild(alert);
            }, 300);
        }, 3000);
    }

    renderMembers() {
        this.membersList.innerHTML = '';
        
        if (this.db.members.length === 0) {
            this.membersList.innerHTML = '<p class="empty-state">No hay integrantes registrados, Alexandra. ¡Agrega el primero!</p>';
            return;
        }
        
        this.db.members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'member-card';
            card.innerHTML = `
                <div class="member-info">
                    <h4>${member.name}</h4>
                    <p class="member-role">${member.role}</p>
                </div>
                <div class="member-actions">
                    <button onclick="app.openMemberModal(${JSON.stringify(member)})">✏️</button>
                    <button onclick="app.deleteMember(${member.id})">🗑️</button>
                </div>
            `;
            this.membersList.appendChild(card);
        });
    }

    renderTimeline() {
        this.timeline.innerHTML = '';
        
        if (this.db.events.length === 0) {
            this.timeline.innerHTML = '<p class="empty-state">No hay eventos registrados, Alexandra. ¡Crea el primero!</p>';
            return;
        }
        
        const years = this.db.getUniqueYears();
        
        years.forEach(year => {
            const yearSection = document.createElement('div');
            yearSection.className = 'year-section';
            
            const yearHeader = document.createElement('div');
            yearHeader.className = 'year-header';
            yearHeader.innerHTML = `
                <span>${year}</span>
                <span>▼</span>
            `;
            
            const monthContainer = document.createElement('div');
            monthContainer.className = 'month-container';
            
            // Group events by month
            const months = {};
            this.db.getEventsByYear(year).forEach(event => {
                const date = new Date(event.date);
                const month = date.getMonth();
                const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
                
                if (!months[month]) {
                    months[month] = {
                        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                        events: []
                    };
                }
                months[month].events.push(event);
            });
            
            // Create month sections
            Object.entries(months).forEach(([monthNum, monthData]) => {
                const monthSection = document.createElement('div');
                monthSection.className = 'month-section';
                
                const monthHeader = document.createElement('div');
                monthHeader.className = 'month-header';
                monthHeader.innerHTML = `
                    <span>${monthData.name}</span>
                    <span>▼</span>
                `;
                
                const dayEvents = document.createElement('div');
                dayEvents.className = 'day-events';
                
                // Group events by day
                const days = {};
                monthData.events.forEach(event => {
                    const date = new Date(event.date);
                    const day = date.getDate();
                    
                    if (!days[day]) {
                        days[day] = [];
                    }
                    days[day].push(event);
                });
                
                // Sort days descending
                Object.keys(days).sort((a, b) => b - a).forEach(day => {
                    days[day].forEach(event => {
                        const eventDate = new Date(event.date);
                        const formattedDate = eventDate.toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric'
                        });
                        
                        const eventCard = document.createElement('div');
                        eventCard.className = 'event-card';
                        eventCard.innerHTML = `
                            <div class="event-header">
                                <h4>${event.name}</h4>
                                <button class="edit-event-btn" onclick="app.openEditEventModal(${event.id})">
                                    ✏️ Editar
                                </button>
                            </div>
                            <div class="event-date">${formattedDate}</div>
                            <div class="event-attendees">
                                <small>Asistentes: ${event.attendees.length}/${this.db.members.length}</small>
                            </div>
                        `;
                        dayEvents.appendChild(eventCard);
                    });
                });
                
                monthHeader.addEventListener('click', () => {
                    monthSection.classList.toggle('show');
                    monthHeader.querySelector('span:last-child').textContent = 
                        monthSection.classList.contains('show') ? '▲' : '▼';
                });
                
                monthSection.appendChild(monthHeader);
                monthSection.appendChild(dayEvents);
                monthContainer.appendChild(monthSection);
            });
            
            yearHeader.addEventListener('click', () => {
                yearSection.classList.toggle('show');
                yearHeader.querySelector('span:last-child').textContent = 
                    yearSection.classList.contains('show') ? '▲' : '▼';
            });
            
            yearSection.appendChild(yearHeader);
            yearSection.appendChild(monthContainer);
            this.timeline.appendChild(yearSection);
            
            // Auto-expand current year
            const currentYear = new Date().getFullYear();
            if (year === currentYear) {
                yearSection.classList.add('show');
                yearHeader.querySelector('span:last-child').textContent = '▲';
            }
        });
    }

    initAttendanceFilters() {
        // Populate year filter
        this.yearFilter.innerHTML = '<option value="">Selecciona año</option>';
        this.db.getUniqueYears().forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            this.yearFilter.appendChild(option);
        });
        
        // Populate month filter
        this.monthFilter.innerHTML = '<option value="">Selecciona mes</option>';
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            this.monthFilter.appendChild(option);
        });
        
        // Show/hide filters based on period
        this.periodFilter.addEventListener('change', () => {
            const period = this.periodFilter.value;
            this.yearFilter.classList.toggle('hidden', period !== 'year' && period !== 'month');
            this.monthFilter.classList.toggle('hidden', period !== 'month');
            
            if (period === 'all') {
                this.yearFilter.value = '';
                this.monthFilter.value = '';
            }
        });
    }

    updateAttendanceStats() {
        const period = this.periodFilter.value;
        const year = this.yearFilter.value;
        const month = this.monthFilter.value;
        
        const stats = this.db.getAttendanceStats(period, year, month);
        this.statsContainer.innerHTML = '';
        
        if (Object.keys(stats).length === 0) {
            this.statsContainer.innerHTML = '<p class="empty-state">No hay datos disponibles, Alexandra. ¡Crea algunos eventos primero!</p>';
            return;
        }
        
        // Create summary card
        const summaryCard = document.createElement('div');
        summaryCard.className = 'stat-card';
        
        let periodText = 'General';
        if (period === 'year' && year) {
            periodText = `Año ${year}`;
        } else if (period === 'month' && year && month) {
            const monthName = new Date(2000, parseInt(month)).toLocaleDateString('es-ES', { month: 'long' });
            periodText = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
        }
        
        summaryCard.innerHTML = `
            <div class="stat-header">
                <h3>Estadísticas - ${periodText}</h3>
                <small>Total eventos: ${Object.values(stats)[0]?.totalEvents || 0}</small>
            </div>
            <div class="stat-details" id="statsDetails"></div>
        `;
        
        this.statsContainer.appendChild(summaryCard);
        
        // Add member stats
        const statsDetails = document.getElementById('statsDetails');
        Object.entries(stats).forEach(([memberId, data]) => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            statItem.innerHTML = `
                <span class="stat-name">${data.name}</span>
                <span class="stat-value">${data.percentage}% (${data.attended}/${data.totalEvents})</span>
            `;
            statsDetails.appendChild(statItem);
        });
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registrado:', registration.scope);
                    })
                    .catch(error => {
                        console.log('Error registrando ServiceWorker:', error);
                    });
            });
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});