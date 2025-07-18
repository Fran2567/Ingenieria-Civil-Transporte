document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const approvedCourses = new Set(); // Para llevar un registro de las asignaturas aprobadas

    // Función para guardar el estado en localStorage
    const saveState = () => {
        localStorage.setItem('approvedCourses', JSON.stringify(Array.from(approvedCourses)));
    };

    // Función para cargar el estado desde localStorage
    const loadState = () => {
        const savedCourses = localStorage.getItem('approvedCourses');
        if (savedCourses) {
            const parsedCourses = JSON.parse(savedCourses);
            parsedCourses.forEach(courseId => {
                const courseElement = document.getElementById(courseId);
                if (courseElement) {
                    approvedCourses.add(courseId);
                    courseElement.classList.add('approved');
                    courseElement.classList.remove('locked'); // Asegurarse de que no esté bloqueado si ya está aprobado
                }
            });
            updateCourseStates(); // Volver a verificar todas las dependencias al cargar
        } else {
            // Si no hay estado guardado, inicializar los cursos bloqueados
            courses.forEach(course => {
                if (!course.classList.contains('approved') && course.dataset.dependencies) {
                    course.classList.add('locked');
                }
            });
            updateCourseStates(); // Revisa las dependencias iniciales
        }
    };

    // Función para verificar y actualizar el estado de las asignaturas
    const updateCourseStates = () => {
        courses.forEach(course => {
            const courseId = course.id;
            const dependencies = course.dataset.dependencies ? course.dataset.dependencies.split(',') : [];

            // Si el curso ya está aprobado, no hacer nada más que asegurar la clase
            if (approvedCourses.has(courseId)) {
                course.classList.add('approved');
                course.classList.remove('locked');
                return;
            }

            // Verificar si todas las dependencias están aprobadas
            const allDependenciesMet = dependencies.every(dep => approvedCourses.has(dep.trim()));

            if (allDependenciesMet) {
                course.classList.remove('locked'); // Desbloquear si las dependencias se cumplen
            } else {
                if (!approvedCourses.has(courseId)) { // Si no está aprobado, bloquearlo
                    course.classList.add('locked');
                }
            }
        });
    };

    // Manejador de clics para las asignaturas
    courses.forEach(course => {
        course.addEventListener('click', (event) => {
            const clickedCourse = event.target;
            const courseId = clickedCourse.id;

            // Solo permitir clic si no está bloqueado y no ha sido aprobado
            if (!clickedCourse.classList.contains('locked') && !clickedCourse.classList.contains('approved')) {
                clickedCourse.classList.add('approved');
                approvedCourses.add(courseId); // Añadir a la lista de aprobados
                saveState(); // Guardar el estado
                updateCourseStates(); // Actualizar el estado de todas las asignaturas

                // Desbloquear las asignaturas indicadas en data-unlocks
                const unlocks = clickedCourse.dataset.unlocks ? clickedCourse.dataset.unlocks.split(',') : [];
                unlocks.forEach(unlockId => {
                    const unlockCourse = document.getElementById(unlockId.trim());
                    if (unlockCourse && unlockCourse.classList.contains('locked')) {
                        // Antes de desbloquear, verificar si sus propias dependencias ya se cumplen
                        const unlockDependencies = unlockCourse.dataset.dependencies ? unlockCourse.dataset.dependencies.split(',') : [];
                        const canUnlock = unlockDependencies.every(dep => approvedCourses.has(dep.trim()));
                        if (canUnlock) {
                            unlockCourse.classList.remove('locked');
                        }
                    }
                });

            } else if (clickedCourse.classList.contains('approved')) {
                // Opcional: Permitir "desaprobar" una asignatura (con cuidado por las dependencias)
                const confirmUndo = confirm(`¿Estás seguro de que quieres desaprobar "${clickedCourse.textContent}"? Esto podría bloquear otras asignaturas.`);
                if (confirmUndo) {
                    clickedCourse.classList.remove('approved');
                    approvedCourses.delete(courseId); // Eliminar de la lista de aprobados
                    saveState(); // Guardar el estado
                    updateCourseStates(); // Recalcular todo
                }
            }
        });
    });

    // Cargar el estado inicial al cargar la página
    loadState();
});
