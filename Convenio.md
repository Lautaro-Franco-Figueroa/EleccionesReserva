# Convenio de Trabajo y Control de Versiones

Este documento establece las pautas y el flujo de trabajo para el desarrollo y mantenimiento del proyecto **Elecciones**.

## 1. Regla Principal de Aprobación
Antes de realizar cualquier confirmación en el repositorio local (`git commit`) o envío de cambios al repositorio remoto en GitHub (`git push`), el asistente de IA **debe solicitar la aprobación explícita** del usuario (**Lautaro Franco Figueroa**).

## 2. Flujo de Trabajo Requerido
1. **Propuesta del cambio:** Presentar con claridad qué archivos han sido modificados, agregados o eliminados, detallando el motivo del cambio.
2. **Revisión y Aprobación:** Esperar la confirmación y visto bueno formal del usuario antes de ejecutar comandos Git que alteren el historial o el repositorio remoto.
3. **Confirmación y Publicación:** Una vez recibida la aprobación:
   - Se realizará el commit local con un mensaje descriptivo.
   - Se realizará el push a la rama correspondiente en GitHub (`https://github.com/Lautaro-Franco-Figueroa/Elecciones`).

## 3. Principios de Diseño y Fabricación del Software (Heurísticas de Nielsen y Usabilidad)
En la fabricación del sistema electoral se deben cumplir obligatoriamente los siguientes requerimientos:
- **Heurísticas de Jakob Nielsen:** La interfaz de usuario debe respetar rigurosamente los 10 principios de usabilidad de Nielsen en cada vista, interacción y mensaje.
- **Capacidad de Deshacer Acciones y Control del Usuario:** Se debe poder deshacer cualquier acción o selección previa. El sistema debe presentar advertencias explícitas en caso de que el usuario decida deshacer o reiniciar su voto.
- **Retroalimentación Inmediata (Feedback):** Toda acción del usuario debe recibir confirmación visual, de estado y accesible (visibilidad del estado del sistema, confirmaciones de voto, avisos claros de error).
- **Navegación Clara y Accesibilidad:** Navegación guiada paso a paso, diseño inclusivo con opciones de accesibilidad (modos de alto contraste, tamaño de texto ajustable, soporte de teclado y lectores).
- **Estética y Diseño Minimalista:** Cuidado estético de primer nivel, orden visual, ausencia de sobrecarga informativa y metáforas coherentes con el mundo real (boleta y urna electoral).
- **Privacidad y Prevención de Voto Duplicado:** Está estrictamente prohibido guardar datos personales de los votantes. La distinción para evitar el doble voto debe realizarse mediante identificadores criptográficos anónimos (hashes de un solo sentido).
- **Soporte a Todos los Participantes:** Considerar las necesidades de Votantes, Candidatos, Autoridades/Trabajadores de las Elecciones y el Tribunal Electoral.

---
*Este convenio es de aplicación obligatoria para todas las interacciones y modificaciones en este proyecto.*
