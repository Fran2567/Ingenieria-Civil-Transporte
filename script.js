document.addEventListener('DOMContentLoaded', () => {
    const courses = document.querySelectorAll('.course');
    const approvedCourses = new Set();
    const resetButton = document.getElementById('resetButton');

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
                const isFirstSemesterCourse = course.closest('.semester-group').querySelector('h2').textContent.includes('Primer Semestre');
                if (!course.classList.contains('approved') && (course.dataset.dependencies || !isFirstSemesterCourse)) {
                    course.classList.add('locked');
                }
            });
            updateCourseStates();
        }
    };

    // Función para verificar y actualizar el estado de las asignaturas
    const updateCourseStates = () => {
        courses.forEach(course => {
            const courseId = course.id;
            const dependencies = course.dataset.dependencies ? course.dataset.dependencies.split(',').map(d => d.trim()) : [];

            if (approvedCourses.has(courseId)) {
                course.classList.add('approved');
                course.classList.remove('locked');
                return;
            }

            const allDependenciesMet = dependencies.every(dep => approvedCourses.has(dep));

            if (dependencies.length === 0) {
                course.classList.remove('locked'); // Asignaturas sin dependencias (ej: primer semestre)
            } else if (allDependenciesMet) {
                course.classList.remove('locked'); // Desbloquear si las dependencias se cumplen
            } else {
                course.classList.add('locked'); // Bloquear si las dependencias no se cumplen
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
                updateCourseStates();
            } else if (clickedCourse.classList.contains('approved')) {
                const confirmUndo = confirm(`¿Estás seguro de que quieres desaprobar "${clickedCourse.textContent}"? Esto podría bloquear otras asignaturas que dependen de ella.`);
                if (confirmUndo) {
                    let affectedCourses = new Set([courseId]);

                    // Función recursiva para encontrar todas las asignaturas que se verían afectadas
                    const findDependentCoursesRecursively = (currentCourseId) => {
                        courses.forEach(c => {
                            const deps = c.dataset.dependencies ? c.dataset.dependencies.split(',').map(d => d.trim()) : [];
                            if (deps.includes(currentCourseId) && approvedCourses.has(c.id) && !affectedCourses.has(c.id)) {
                                affectedCourses.add(c.id);
                                findDependentCoursesRecursively(c.id);
                            }
                        });
                    };
                    findDependentCoursesRecursively(courseId);

                    const affectedList = Array.from(affectedCourses)
                        .filter(id => id !== courseId)
                        .map(id => document.getElementById(id).textContent)
                        .join(', ');

                    if (affectedList) {
                         const confirmAffected = confirm(`Desaprobar "${clickedCourse.textContent}" también desaprobará las siguientes asignaturas (porque dependen de ella): ${affectedList}. ¿Continuar?`);
                         if (!confirmAffected) {
                             return; // No hacer nada si el usuario cancela
                         }
                    }

                    Array.from(affectedCourses).forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            el.classList.remove('approved');
                            approvedCourses.delete(id);
                        }
                    });
                    saveState();
                    updateCourseStates();
                }
            }
        });
    });

    // Manejador de clics para el botón de reinicio
    resetButton.addEventListener('click', () => {
        const confirmReset = confirm('¿Estás seguro de que quieres reiniciar todo el progreso de la malla? ¡Esta acción no se puede deshacer!');
        if (confirmReset) {
            localStorage.removeItem('approvedCourses');
            approvedCourses.clear();
            
            courses.forEach(course => {
                course.classList.remove('approved');
                const isFirstSemesterCourse = course.closest('.semester-group').querySelector('h2').textContent.includes('Primer Semestre');
                if (course.dataset.dependencies || !isFirstSemesterCourse) {
                    course.classList.add('locked');
                } else {
                    course.classList.remove('locked');
                }
            });
            updateCourseStates();
            alert('¡Malla Curricular Reiniciada con éxito! 🎉');
        }
    });

    // Cargar el estado inicial al cargar la página
    loadState();
});
