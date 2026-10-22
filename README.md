# Elecciones Municipales - Intendente 2026 🗳️

Sistema de interfaz de usuario para el soporte del voto electrónico en las elecciones a Intendente, desarrollado bajo los principios de **Usabilidad de Jakob Nielsen**, **Accesibilidad Universal (WCAG 2.1 AA/AAA)** y **Privacidad Criptográfica Absoluta**.

---

## 🚀 Inicio Rápido

Para ejecutar la aplicación localmente:
1. Haz doble clic en el archivo **`iniciar.bat`**, o bien:
2. Abre **`index.html`** directamente con cualquier navegador moderno (Google Chrome, Microsoft Edge, Firefox, Brave, Safari).

No requiere instalación de servidores, Node.js ni compiladores. Funciona de manera 100% nativa y autónoma.

---

## 👥 Soporte para los Tipos de Participantes

- **Votantes:**
  - Flujo guiado en 4 pasos claros (Identificación ➔ Selección ➔ Revisión ➔ Constancia).
  - Boletas con fotografías, colores y propuestas.
  - Botón de **Deshacer selección** con advertencia emergente obligatoria antes de confirmar.
  - Comprobante anónimo instantáneo.
- **Candidatos:**
  - Garantía de igualdad de condiciones visuales y ausencia de sesgos.
  - Posibilidad de verificar el escrutinio transparente en tiempo real.
- **Presidente de Mesa y Autoridades:**
  - Inicio de sesión oficial con N° de Mesa (`042`) y Código PIN de verificación (`2026`).
  - Consulta del padrón electoral oficial con constatación de electores que ya sufragaron (secreto absoluto del voto: no expone la opción elegida).
  - Procedimiento para **anular votos** formalmente ante infracciones de **voto cantado** con diálogo de advertencia e ingreso al acta oficial.
  - Escrutinio en tiempo real con **estadística destacada de la opción más votada / líder de la elección**, margen y porcentajes.
  - Control de apertura/cierre de mesa y restablecimiento de datos.
- **Tribunal Electoral:**
  - Padrón criptográfico transparente (hashes SHA-256 sin datos personales).
  - Urna digital desacoplada con inserción aleatoria para asegurar el secreto del voto.

---

## 📐 Cumplimiento de las Heurísticas de Jakob Nielsen

1. **Visibilidad del estado del sistema:** Indicador de pasos numéricos y notificaciones inmediatas.
2. **Coincidencia con el mundo real:** Metáfora de Boleta Única y Urna física.
3. **Control y libertad del usuario:** Capacidad de deshacer el voto con diálogo de advertencia explícito.
4. **Consistencia y estándares:** Códigos de colores normalizados (Verde = Confirmar, Naranja = Deshacer, Azul = Navegación).
5. **Prevención de errores:** Límite estricto de 8 números en DNI, admisión flexible de puntos (.) y guiones (-), avisos visuales en tiempo real ante carga incorrecta y confirmación obligatoria.
6. **Reconocimiento antes que recuerdo:** Fotografías de alta calidad y pantalla de revisión detallada.
7. **Flexibilidad y eficiencia:** Atajos de teclado (`1`, `2`, `3`, `H`), modo kiosco y presets de prueba.
8. **Diseño estético y minimalista:** Interfaz moderna, limpia, sin distracciones.
9. **Ayuda para reconocer errores:** Mensajes claros ante intentos de voto duplicado o datos incorrectos.
10. **Ayuda y documentación:** Modal interactivo con guía de votación y accesibilidad.

Para ver el desglose técnico completo, consulte [JUSTIFICACION_NIELSEN.md](docs/JUSTIFICACION_NIELSEN.md).

---

## 🔒 Privacidad y No Persistencia de Datos Personales
El sistema cumple estrictamente con el requerimiento de no almacenar información personal:
- El documento del votante se procesa con una función hash unidireccional **SHA-256** junto a un *salt* secreto.
- Solo se almacena el hash anónimo para evitar el doble voto.
- La urna almacena los votos de forma independiente, desacoplada y barajada temporalmente, haciendo imposible vincular la identidad del elector con su voto.

---

## 👤 Opciones Electorales en el Cuarto Oscuro
1. **Dra. Valeria Gómez** - *Frente Ciudadano y Futuro* (Lista 101)
2. **Ing. Roberto Martínez** - *Unión por la Transformación* (Lista 202)
3. **Voto en Blanco** - *Opción Institucional Oficial*
4. **Voto Nulo** - *Opción Electoral no Computable*
