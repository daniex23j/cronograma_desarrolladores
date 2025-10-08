let developers = [];
let tasks = [];
let currentMonth = new Date();
let currentDevId = null;

// Festivos de Colombia 2024-2026
const holidays = [
    // 2024
    '2024-01-01', '2024-01-08', '2024-03-25', '2024-03-28', '2024-03-29',
    '2024-05-01', '2024-05-13', '2024-06-03', '2024-06-10', '2024-07-01',
    '2024-07-20', '2024-08-07', '2024-08-19', '2024-10-14', '2024-11-04',
    '2024-11-11', '2024-12-08', '2024-12-25',
    // 2025
    '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
    '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
    '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
    '2025-12-08', '2025-12-25',
    // 2026
    '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
    '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
    '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
    '2026-11-16', '2026-12-08', '2026-12-25'
];

// Verificar si una fecha es festivo
function isHoliday(dateString) {
    return holidays.includes(dateString);
}

// Inicializar aplicación
function init() {
    loadFromStorage();
    setCurrentMonth();
    renderTimeline();
    updateStats();
}

// Establecer mes actual
function setCurrentMonth() {
    const monthInput = document.getElementById('filterMonth');
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    monthInput.value = `${year}-${month}`;
}

// Cambiar mes
function changeMonth() {
    const monthInput = document.getElementById('filterMonth');
    const [year, month] = monthInput.value.split('-');
    currentMonth = new Date(year, month - 1, 1);
    renderTimeline();
}

// Mes anterior
function previousMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    // Validar límite mínimo (enero 2024)
    const minDate = new Date(2024, 0, 1);
    if (currentMonth < minDate) {
        currentMonth = minDate;
    }
    
    setCurrentMonth();
    renderTimeline();
}

// Mes siguiente
function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    
    // Validar límite máximo (diciembre 2026)
    const maxDate = new Date(2026, 11, 1);
    if (currentMonth > maxDate) {
        currentMonth = maxDate;
    }
    
    setCurrentMonth();
    renderTimeline();
}

// Cargar datos del almacenamiento
function loadFromStorage() {
    const storedDevs = localStorage.getItem('developers');
    const storedTasks = localStorage.getItem('tasks');
    
    if (storedDevs) developers = JSON.parse(storedDevs);
    if (storedTasks) tasks = JSON.parse(storedTasks);
}

// Guardar en almacenamiento
function saveToStorage() {
    localStorage.setItem('developers', JSON.stringify(developers));
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Abrir modal
function openModal(type) {
    if (type === 'developer') {
        document.getElementById('modalDeveloper').classList.add('active');
    } else if (type === 'task') {
        document.getElementById('modalTask').classList.add('active');
    }
}

// Cerrar modal
function closeModal(type) {
    if (type === 'developer') {
        document.getElementById('modalDeveloper').classList.remove('active');
        document.getElementById('devName').value = '';
        document.getElementById('devArea').value = '';
    } else if (type === 'task') {
        document.getElementById('modalTask').classList.remove('active');
        document.getElementById('taskProject').value = '';
        document.getElementById('taskHut').value = '';
        document.getElementById('taskDateStart').value = '';
        document.getElementById('taskDateEnd').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskId').value = '';
    }
}

// Guardar desarrollador
function saveDeveloper(e) {
    e.preventDefault();
    
    const name = document.getElementById('devName').value;
    const area = document.getElementById('devArea').value;
    
    const newDev = {
        id: Date.now(),
        name: name,
        area: area
    };
    
    developers.push(newDev);
    saveToStorage();
    renderTimeline();
    updateStats();
    closeModal('developer');
    showToast('Desarrollador agregado exitosamente');
}

// Eliminar desarrollador
function deleteDeveloper(id) {
    if (confirm('¿Está seguro de eliminar este desarrollador? Se eliminarán todas sus tareas.')) {
        developers = developers.filter(d => d.id !== id);
        tasks = tasks.filter(t => t.developerId !== id);
        saveToStorage();
        renderTimeline();
        updateStats();
        showToast('Desarrollador eliminado');
    }
}

// Abrir modal para nueva asignación
function openNewAssignmentModal() {
    // Verificar que haya desarrolladores
    if (developers.length === 0) {
        alert('Primero debe agregar al menos un desarrollador');
        return;
    }
    
    // Limpiar formulario
    document.getElementById('taskId').value = '';
    document.getElementById('taskProject').value = '';
    document.getElementById('taskHut').value = '';
    document.getElementById('taskDateStart').value = '';
    document.getElementById('taskDateEnd').value = '';
    document.getElementById('taskDescription').value = '';
    
    // Mostrar selector de desarrollador
    const devSelect = document.getElementById('taskDevId');
    const devSelectGroup = document.getElementById('devSelectGroup');
    devSelectGroup.style.display = 'block';
    devSelect.required = true;
    
    // Llenar selector de desarrolladores
    devSelect.innerHTML = '<option value="">Seleccione un desarrollador</option>';
    developers.forEach(dev => {
        devSelect.innerHTML += `<option value="${dev.id}">${dev.name}</option>`;
    });
    
    document.getElementById('taskModalTitle').textContent = 'Nueva Asignación';
    openModal('task');
}

// Manejar click en celda del timeline
function handleCellClick(devId, date, event) {
    // Si hay una barra de tarea, no hacer nada (el click será manejado por la barra)
    if (event.target.classList.contains('task-bar')) {
        return;
    }
    
    // Si es una celda vacía, abrir modal para agregar tarea
    openTaskModal(devId, date);
}

// Abrir modal de tarea
function openTaskModal(devId, date) {
    currentDevId = devId;
    
    // Ocultar selector de desarrollador cuando se abre desde celda
    const devSelectGroup = document.getElementById('devSelectGroup');
    devSelectGroup.style.display = 'none';
    
    const devSelect = document.getElementById('taskDevId');
    devSelect.value = devId;
    devSelect.required = false;
    
    document.getElementById('taskDateStart').value = date;
    document.getElementById('taskDateEnd').value = date;
    document.getElementById('taskModalTitle').textContent = 'Agregar Tarea';
    document.getElementById('taskId').value = '';
    openModal('task');
}

// Mostrar detalles de tarea (puede ser única o múltiple)
function showTaskDetails(taskId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    // Buscar la tarea o grupo de tareas
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        editTask(taskId, event);
    }
}

// Editar tarea
function editTask(taskId, event) {
    if (event) {
        event.stopPropagation();
    }
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        // Ocultar selector de desarrollador al editar
        const devSelectGroup = document.getElementById('devSelectGroup');
        devSelectGroup.style.display = 'none';
        
        const devSelect = document.getElementById('taskDevId');
        devSelect.value = task.developerId;
        devSelect.required = false;
        
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskProject').value = task.project;
        document.getElementById('taskHut').value = task.hut;
        document.getElementById('taskDateStart').value = task.startDate;
        document.getElementById('taskDateEnd').value = task.endDate;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskModalTitle').textContent = 'Editar Tarea';
        openModal('task');
    }
}

// Guardar tarea
function saveTask(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('taskId').value;
    const devId = parseInt(document.getElementById('taskDevId').value);
    const project = document.getElementById('taskProject').value;
    const hut = document.getElementById('taskHut').value;
    const startDate = document.getElementById('taskDateStart').value;
    const endDate = document.getElementById('taskDateEnd').value;
    const description = document.getElementById('taskDescription').value;
    
    if (new Date(endDate) < new Date(startDate)) {
        alert('La fecha de fin no puede ser anterior a la fecha de inicio');
        return;
    }
    
    if (taskId) {
        const taskIndex = tasks.findIndex(t => t.id === parseInt(taskId));
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            project,
            hut,
            startDate,
            endDate,
            description
        };
        showToast('Tarea actualizada exitosamente');
    } else {
        const newTask = {
            id: Date.now(),
            developerId: devId,
            project,
            hut,
            startDate,
            endDate,
            description
        };
        tasks.push(newTask);
        showToast('Tarea agregada exitosamente');
    }
    
    saveToStorage();
    renderTimeline();
    updateStats();
    closeModal('task');
}

// Eliminar tarea
function deleteTask(taskId) {
    if (confirm('¿Está seguro de eliminar esta tarea?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveToStorage();
        renderTimeline();
        updateStats();
        showToast('Tarea eliminada');
    }
}

// Obtener días del mes
function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateString = formatDate(currentDate);
        days.push({
            date: currentDate,
            dateString: dateString,
            dayNumber: day,
            isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
            isHoliday: isHoliday(dateString)
        });
    }
    
    return days;
}

// Formatear fecha
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Obtener clase de proyecto
function getProjectClass(project) {
    const projectMap = {
        'ONIX': 'proyecto-onix',
        'Poliedro': 'proyecto-poliedro',
        'DIME': 'proyecto-dime',
        'FACT': 'proyecto-fact',
        'Banco Agrario': 'proyecto-agrario',
        'CSI': 'proyecto-csi',
        'EPM': 'proyecto-epm',
        'ANDIE': 'proyecto-andie',
        'Vacaciones': 'vacaciones'
    };
    return projectMap[project] || '';
}

// Verificar si una fecha está dentro del mes actual
function isDateInMonth(dateString, monthStart, monthEnd) {
    const date = new Date(dateString);
    return date >= monthStart && date <= monthEnd;
}

// Organizar tareas en filas sin solapamiento
function organizeTasks(devTasks, days, monthStart, monthEnd) {
    // Filtrar y ordenar tareas por fecha de inicio
    const relevantTasks = devTasks
        .filter(task => {
            const taskStart = new Date(task.startDate);
            const taskEnd = new Date(task.endDate);
            return taskEnd >= monthStart && taskStart <= monthEnd;
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    // Agrupar tareas por proyecto y fechas coincidentes
    const groupedTasks = [];
    
    relevantTasks.forEach(task => {
        // Buscar si ya existe un grupo con el mismo proyecto y fechas
        const existingGroup = groupedTasks.find(group => 
            group.project === task.project &&
            group.startDate === task.startDate &&
            group.endDate === task.endDate
        );
        
        if (existingGroup) {
            // Agregar HUT al grupo existente
            existingGroup.huts.push(task.hut);
            existingGroup.tasks.push(task);
        } else {
            // Crear nuevo grupo
            groupedTasks.push({
                project: task.project,
                startDate: task.startDate,
                endDate: task.endDate,
                huts: [task.hut],
                tasks: [task],
                hut: task.hut,
                description: task.description,
                id: task.id
            });
        }
    });
    
    const rows = [];
    
    groupedTasks.forEach(taskGroup => {
        const taskStart = new Date(taskGroup.startDate);
        const taskEnd = new Date(taskGroup.endDate);
        
        // Ajustar fechas al mes visible
        const displayStart = taskStart < monthStart ? monthStart : taskStart;
        const displayEnd = taskEnd > monthEnd ? monthEnd : taskEnd;
        
        // CORRECCIÓN: Encontrar índice considerando que puede empezar desde día 1
        let startIndex = 0;
        
        if (taskStart >= monthStart) {
            // La tarea empieza en este mes
            startIndex = days.findIndex(day => {
                return formatDate(new Date(day.dateString)) === formatDate(displayStart);
            });
        } else {
            // La tarea empezó en mes anterior, comienza desde el día 1
            startIndex = 0;
        }
        
        if (startIndex === -1) return;
        
        // Calcular duración visible en este mes
        const duration = Math.round((displayEnd - displayStart) / (1000 * 60 * 60 * 24)) + 1;
        
        const taskPosition = {
            task: taskGroup,
            startIndex: startIndex,
            duration: duration,
            endIndex: startIndex + duration - 1,
            isCombined: taskGroup.huts.length > 1
        };
        
        // Buscar fila donde colocar la tarea
        let placed = false;
        for (let row of rows) {
            let canPlace = true;
            
            for (let existingTask of row) {
                if (!(taskPosition.endIndex < existingTask.startIndex || 
                      taskPosition.startIndex > existingTask.endIndex)) {
                    canPlace = false;
                    break;
                }
            }
            
            if (canPlace) {
                row.push(taskPosition);
                placed = true;
                break;
            }
        }
        
        if (!placed) {
            rows.push([taskPosition]);
        }
    });
    
    return rows;
}

// Renderizar timeline
function renderTimeline() {
    const timeline = document.getElementById('timeline');
    const days = getDaysInMonth(currentMonth);
    
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    if (developers.length === 0) {
        timeline.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h3>No hay desarrolladores</h3>
                <p>Comienza agregando desarrolladores para crear el cronograma</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="timeline-header">';
    html += '<div class="dev-name-header">Desarrollador</div>';
    html += '<div class="dates-header">';
    
    // NUEVO: Header interactivo - se actualizará con JavaScript
    days.forEach((day, dayIndex) => {
        let cellClass = 'date-cell-header';
        if (day.isHoliday) {
            cellClass += ' holiday';
        } else if (day.isWeekend) {
            cellClass += ' weekend';
        }
        html += `<div class="${cellClass} header-day" 
                     data-date="${day.dateString}"
                     title="${day.isHoliday ? 'Festivo - Click en fila de desarrollador para agregar tarea' : 'Click en fila de desarrollador para agregar tarea'}">
                     ${day.dayNumber}
                 </div>`;
    });
    
    html += '</div></div>';
    
    const filteredDevs = getFilteredDevelopers();
    
    // Variable para tracking del desarrollador actual cuando se hace click en header
    let currentHeaderDevId = null;
    
    filteredDevs.forEach(dev => {
        const devTasks = tasks.filter(t => t.developerId === dev.id);
        const taskRows = organizeTasks(devTasks, days, monthStart, monthEnd);
        
        // Si no hay tareas, mostrar una fila vacía
        const numRows = taskRows.length > 0 ? taskRows.length : 1;
        
        // Renderizar filas
        for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
            const row = taskRows[rowIndex] || [];
            html += '<div class="timeline-row">';
            
            // Nombre del desarrollador solo en la primera fila
            if (rowIndex === 0) {
                html += `<div class="dev-name" style="min-height: 58px;">
                    <span>${dev.name}</span>
                    <div class="dev-actions">
                        <button class="icon-btn" onclick="deleteDeveloper(${dev.id})" title="Eliminar">🗑️</button>
                    </div>
                </div>`;
            } else {
                html += '<div style="width: 250px; margin-right: 10px;"></div>';
            }
            
            html += '<div class="dates-grid">';
            
            // Renderizar celdas
            days.forEach((day, dayIndex) => {
                let cellClass = 'date-cell';
                if (day.isHoliday) {
                    cellClass += ' holiday';
                } else if (day.isWeekend) {
                    cellClass += ' weekend';
                }
                
                let cellContent = '';
                
                // Buscar tarea que inicie en este día
                const taskAtDay = row.find(pos => pos.startIndex === dayIndex);
                
                if (taskAtDay) {
                    const projectClass = getProjectClass(taskAtDay.task.project);
                    const widthPx = (taskAtDay.duration * 40) + ((taskAtDay.duration - 1) * 2);
                    
                    const hutsDisplay = taskAtDay.task.huts ? taskAtDay.task.huts.join(', ') : taskAtDay.task.hut;
                    const titleText = taskAtDay.task.huts 
                        ? `${taskAtDay.task.project} - ${taskAtDay.task.huts.join(', ')}` 
                        : `${taskAtDay.task.project} - ${taskAtDay.task.hut}`;
                    
                    // Badge para múltiples HUTs
                    const multipleBadge = taskAtDay.isCombined 
                        ? `<span class="hut-badge">+${taskAtDay.task.huts.length}</span>` 
                        : '';
                    
                    cellContent = `
                        <div class="task-bar ${projectClass}" 
                             style="width: ${widthPx}px; max-width: ${widthPx}px;" 
                             onclick="showTaskDetails(${taskAtDay.task.id || taskAtDay.task.tasks[0].id}, event)"
                             title="${titleText}">
                            <span class="hut-text">${hutsDisplay}</span>
                            ${multipleBadge}
                        </div>
                    `;
                }
                
                html += `<div class="${cellClass}" 
                             data-dev-id="${dev.id}" 
                             data-date="${day.dateString}"
                             onclick="handleCellClick(${dev.id}, '${day.dateString}', event)">
                             ${cellContent}
                         </div>`;
            });
            
            html += '</div></div>';
        }
    });
    
    timeline.innerHTML = html;
}

// Filtrar desarrolladores
function getFilteredDevelopers() {
    const searchTerm = document.getElementById('searchDev').value.toLowerCase();
    const projectFilter = document.getElementById('filterProject').value;
    
    let filtered = developers;
    
    if (searchTerm) {
        filtered = filtered.filter(dev => 
            dev.name.toLowerCase().includes(searchTerm) ||
            (dev.area && dev.area.toLowerCase().includes(searchTerm))
        );
    }
    
    if (projectFilter) {
        const devIdsWithProject = tasks
            .filter(t => t.project === projectFilter)
            .map(t => t.developerId);
        filtered = filtered.filter(dev => devIdsWithProject.includes(dev.id));
    }
    
    return filtered;
}

// Filtrar timeline
function filterTimeline() {
    renderTimeline();
}

// Actualizar estadísticas
function updateStats() {
    document.getElementById('statDevs').textContent = developers.length;
    
    const activeProjects = new Set(tasks.map(t => t.project)).size;
    document.getElementById('statProjects').textContent = activeProjects;
    
    document.getElementById('statHuts').textContent = tasks.length;
}

// Mostrar toast
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Exportar datos
function exportData() {
    const data = {
        developers: developers,
        tasks: tasks,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cronograma_${formatDate(new Date())}.json`;
    link.click();
    
    showToast('Datos exportados exitosamente');
}

// Cerrar modales al hacer clic fuera
window.onclick = function(e) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    }
}

// Inicializar aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', init);