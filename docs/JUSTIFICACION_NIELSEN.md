# Justificación Técnica de Usabilidad y Heurísticas de Nielsen
**Proyecto:** Sistema de Soporte al Voto Electrónico - Elección de Intendente  
**Materia:** Interfaz de Usuario / Diseño y Usabilidad  

---

## 1. Adaptación a los Tipos de Participantes

| Participante | Necesidad Principal | Implementación en la Interfaz |
| :--- | :--- | :--- |
| **Votantes** | Facilidad inmediata, cero curva de aprendizaje, rapidez, posibilidad de deshacer errores y seguridad en el conteo. | Flujo guiado en 4 pasos numerados, boletas visuales con fotos claras, botón explícito de **Deshacer selección** con advertencia clara, comprobante anónimo instantáneo. |
| **Candidatos** | Preocupación por errores, recuperación clara, transparencia e imparcialidad visual. | Boletas con el mismo peso jerárquico, colores oficiales, fotografías nítidas, desglose de escrutinio en tiempo real y urna desacoplada para auditoría. |
| **Trabajadores y Presidente de Mesa** | Fluidez operativa, control del padrón, anulación de votos cantados y escrutinio transparente. | Inicio de sesión con N° de mesa y código PIN, visualización del padrón con estado (VOTÓ / PENDIENTE) sin revelar opciones votadas, herramienta de anulación formal por voto cantado, y estadística destacada de la opción más votada en tiempo real. |
| **Tribunal Electoral** | Honestidad, inviolabilidad, prevención de fraude y doble voto, sin comprometer el secreto del sufragio. | Pestaña "Tribunal & Auditoría": verificación de hashes SHA-256 (CERO datos personales almacenados), inserción aleatoria en urna y log criptográfico. |

---

## 2. Aplicación de las 10 Heurísticas de Jakob Nielsen

### 1. Visibilidad del Estado del Sistema (*Visibility of system status*)
- **Barra de Progreso por Pasos (Stepper):** El votante sabe en todo momento dónde está y qué falta (1. Identificación → 2. Selección → 3. Revisión → 4. Constancia).
- **Retroalimentación Auditiva y Visual:** Tonos suaves para selección, confirmación y advertencia. Toasts informativos y estados de carga visibles.

### 2. Coincidencia entre el Sistema y el Mundo Real (*Match between system and the real world*)
- Metáfora familiar de **Boleta Única**, **Cuarto Oscuro** y **Urna Digital**.
- Lenguaje simple, cívico y directo, sin jerga informática incomprensible.

### 3. Control y Libertad del Usuario (*User control and freedom*)
- **Capacidad de Deshacer Acciones:** En la pantalla de revisión, el votante dispone de un botón visible para volver atrás y cambiar su voto.
- **Advertencia al Deshacer:** Para evitar cancelaciones accidentales por toques involuntarios, el sistema despliega un modal con advertencia explícita y confirmación obligatoria.

### 4. Consistencia y Estándares (*Consistency and standards*)
- Convenciones estándar de botones:
  - **Verde:** Confirmar y emitir voto definitivo.
  - **Ámbar / Naranja:** Advertencia y deshacer selección.
  - **Azul:** Navegación y avance primario.
  - **Rojo:** Cierre de mesa y acciones destructivas de administración.

### 5. Prevención de Errores (*Error prevention*)
- El botón "Revisar y Continuar" permanece deshabilitado hasta que se haya elegido una boleta.
- Teclado numérico restringido a dígitos válidos para el documento.
- Verificación automática de unicidad para impedir que un mismo elector intente votar dos veces.

### 6. Reconocimiento antes que Recuerdo (*Recognition rather than recall*)
- Las boletas muestran fotografías grandes de los candidatos, sus números de lista, alianzas y propuestas.
- La pantalla de revisión (Paso 3) exhibe la boleta completa del candidato elegido en grande, permitiendo al votante reconocer visualmente su decisión sin tener que recordar datos.

### 7. Flexibilidad y Eficiencia de Uso (*Flexibility and efficiency of use*)
- **Accesibilidad y Atajos de Teclado:** Teclas numéricas `[1]`, `[2]`, `[3]` para elegir candidato inmediatamente; tecla `[H]` para ayuda.
- Presets rápidos de prueba en modo demostración.
- Modo de **Alto Contraste** y tamaño de fuente adaptable (Grande y Muy Grande) para personas con baja visión o dificultades motoras.

### 8. Diseño Estético y Minimalista (*Aesthetic and minimalist design*)
- Paleta moderna con modo oscuro descansado, sombras elegantes (*glassmorphism*), tipografías claras y jerarquías tipográficas bien diferenciadas.
- Ausencia total de sobrecarga visual o distractores durante el acto de votar.

### 9. Ayudar a Reconocer, Diagnosticar y Recuperarse de Errores (*Help users recognize, diagnose, and recover from errors*)
- Mensajes de error claros y explicativos (ej: *"Este documento ya figura con sufragio emitido en esta mesa. No es posible votar más de una vez"*).
- Notificaciones Toast no bloqueantes con instrucciones precisas.

### 10. Ayuda y Documentación (*Help and documentation*)
- Botón flotante accesible **"❓ Ayuda"** y atajo de teclado accesible en cualquier momento.
- Modal instructivo paso a paso y lista de atajos disponible para el elector y las autoridades de mesa.

---

## 3. Principio de Privacidad y No Persistencia de Datos Personales
- **Algoritmo:** SHA-256 unidireccional con Salt de mesa.
- **Datos almacenados:** Únicamente el vector de hashes de los votantes que ya participaron.
- **Inversión imposible:** Nunca se guarda el DNI, nombre, apellido, sexo o domicilio.
- **Desacoplamiento urna-padrón:** La urna almacena los votos con tokens aleatorios e inserción barajada, garantizando el secreto constitucional del voto.
