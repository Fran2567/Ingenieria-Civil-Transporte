document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const approvedCourses = new Set();
    const resetButton = document.getElementById('resetButton'); // Obtener el botón de reinicio

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
                    courseElement.classList.remove('locked');
                }
            });
            updateCourseStates();
        } else {
            // Si no hay estado guardado, inicializar los cursos bloqueados
            courses.forEach(course => {
                // Verificar si la asignatura tiene dependencias o si no es de primer semestre
                const isFirstSemesterCourse = course.closest('.semester-group').querySelector('h2').textContent.includes('Primer Semestre');
                if (!course.classList.contains('approved') && (course.dataset.dependencies || !isFirstSemesterCourse)) {
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

            if (approvedCourses.has(courseId)) {
                course.classList.add('approved');
                course.classList.remove('locked');
                return; // Si ya está aprobado, no necesitamos verificar dependencias para bloquearlo
            }

            const allDependenciesMet = dependencies.every(dep => approvedCourses.has(dep.trim()));

            // Solo si no está aprobado
            if (!approvedCourses.has(courseId)) {
                if (dependencies.length === 0) { // Asignaturas sin dependencias (primer semestre)
                    course.classList.remove('locked');
                } else if (allDependenciesMet) {
                    course.classList.remove('locked'); // Desbloquear si las dependencias se cumplen
                } else {
                    course.classList.add('locked'); // Bloquear si las dependencias no se cumplen
                }
            }
        });
    };

    // Manejador de clics para las asignaturas
    courses.forEach(course => {
        course.addEventListener('click', (event) => {
            const clickedCourse = event.target;
            const courseId = clickedCourse.id;

            if (!clickedCourse.classList.contains('locked') && !clickedCourse.classList.contains('approved')) {
                clickedCourse.classList.add('approved');
                approvedCourses.add(courseId);
                saveState();
                updateCourseStates(); // Recalcular todas las dependencias
            } else if (clickedCourse.classList.contains('approved')) {
                const confirmUndo = confirm(`¿Estás seguro de que quieres desaprobar "${clickedCourse.textContent}"? Esto podría bloquear otras asignaturas que dependen de ella.`);
                if (confirmUndo) {
                    // Verificar si alguna asignatura aprobada actualmente depende de esta
                    let canRemove = true;
                    const dependenciesToRemove = [courseId]; // Asignaturas a desaprobar, incluyendo la actual
                    
                    // Función recursiva para encontrar todas las dependencias que se verían afectadas
                    const findDependentCourses = (currentCourseId) => {
                        courses.forEach(c => {
                            const deps = c.dataset.dependencies ? c.dataset.dependencies.split(',').map(d => d.trim()) : [];
                            if (deps.includes(currentCourseId) && approvedCourses.has(c.id) && !dependenciesToRemove.includes(c.id)) {
                                dependenciesToRemove.push(c.id);
                                findDependentCourses(c.id); // Llamada recursiva
                            }
                        });
                    };
                    findDependentCourses(courseId);

                    if (dependenciesToRemove.length > 1) {
                         const confirmAffected = confirm(`Desaprobar "${clickedCourse.textContent}" también desaprobará las siguientes asignaturas (porque dependen de ella): ${dependenciesToRemove.filter(id => id !== courseId).map(id => document.getElementById(id).textContent).join(', ')}. ¿Continuar?`);
                         if (!confirmAffected) {
                             canRemove = false;
                         }
                    }

                    if (canRemove) {
                        dependenciesToRemove.forEach(id => {
                            const el = document.getElementById(id);
                            if (el) {
                                el.classList.remove('approved');
                                approvedCourses.delete(id);
                            }
                        });
                        saveState();
                        updateCourseStates(); // Recalcular todo
                    }
                }
            }
        });
    });

    // Manejador de clics para el botón de reinicio
    resetButton.addEventListener('click', () => {
        const confirmReset = confirm('¿Estás seguro de que quieres reiniciar todo el progreso de la malla? ¡Esta acción no se puede deshacer!');
        if (confirmReset) {
            localStorage.removeItem('approvedCourses'); // Borrar todo del almacenamiento local
            approvedCourses.clear(); // Limpiar el Set de asignaturas aprobadas
            
            // Restablecer todas las clases de las asignaturas
            courses.forEach(course => {
                course.classList.remove('approved');
                // Re-aplicar 'locked' a las asignaturas que dependen de otras o no son de primer semestre
                const isFirstSemesterCourse = course.closest('.semester-group').querySelector('h2').textContent.includes('Primer Semestre');
                if (course.dataset.dependencies || !isFirstSemesterCourse) {
                    course.classList.add('locked');
                } else {
                    course.classList.remove('locked'); // Asegurar que las de primer semestre estén desbloqueadas
                }
            });
            updateCourseStates(); // Volver a verificar los estados
            alert('¡Malla Curricular Reiniciada!');
        }
    });

    // Cargar el estado inicial al cargar la página
    loadState();
});
