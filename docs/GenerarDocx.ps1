param([string]$ScreenshotsDir, [string]$OutputPath)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# ── HELPERS ────────────────────────────────────────────────────────────────────
function xmlEsc([string]$s) { [System.Security.SecurityElement]::Escape($s) }

# Load images
$imgs = [ordered]@{}
Get-ChildItem "$ScreenshotsDir\*.png" | Sort-Object Name | ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    $b64   = [System.Convert]::ToBase64String($bytes)
    $imgs[$_.Name] = @{ B64 = $b64; Bytes = $bytes.Length }
}
Write-Host "Loaded $($imgs.Count) images."

# Sections: (filename, caption, description)
$sections = @(
    @("01_identificacion_votante.png",
      "Figura 1. Pantalla de Bienvenida e Identificación del Votante",
      "El proceso electoral comienza en la pantalla de identificación. El votante ingresa su Número de Documento Nacional de Identidad (DNI) mediante el teclado físico o el teclado numérico virtual en pantalla, pensado para facilitar el uso en equipos táctiles o de tipo quiosco. El sistema verifica en tiempo real que el DNI contenga entre 7 y 8 números, y acepta formatos con puntos (38.123.456) o guiones (38-123-456). El indicador de progreso en la parte superior muestra en todo momento en qué paso del proceso se encuentra el votante, garantizando visibilidad del estado del sistema (Heurística de Nielsen N.° 1). Un cartel de garantía de privacidad en la parte inferior recuerda que el sistema no guarda ningún dato personal.");

    @("02_alerta_validacion_dni.png",
      "Figura 2. Validación del DNI — Aviso de Formato Incorrecto",
      "Cuando el votante intenta ingresar un DNI con más de 8 números, el sistema lo detecta de forma inmediata y muestra un aviso de advertencia en color naranja debajo del campo de entrada. El campo cambia de color y se produce una animación de sacudida para reforzar el mensaje visualmente. Esta retroalimentación instantánea respeta la Heurística de Nielsen N.° 5 (prevención de errores) y la N.° 9 (ayuda a los usuarios a reconocer, diagnosticar y recuperarse de los errores), guiando al votante para que corrija el dato sin necesidad de asistencia.");

    @("03_cuarto_oscuro.png",
      "Figura 3. Cuarto Oscuro Digital — Selección de Candidatos",
      "Una vez que el DNI es validado y el votante está habilitado en el padrón, accede al Cuarto Oscuro Digital. En esta pantalla se presentan las boletas electorales de los candidatos: la Dra. Valeria Gómez (Lista 101 — Frente Ciudadano y Futuro), el Ing. Roberto Martínez (Lista 202 — Unión por la Transformación), la opción de Voto en Blanco y el Voto Nulo. Cada boleta incluye la fotografía del candidato, su nombre completo, partido político, lema y propuestas principales. Para facilitar el uso, las boletas también se pueden seleccionar con las teclas numéricas del teclado [1], [2], [3] y [4]. El indicador de pasos muestra que ahora se está en el paso 2 — Selección. La boleta seleccionada (Dra. Valeria Gómez) queda visualmente resaltada con un borde azul y la leyenda 'Seleccionado' en color verde.");

    @("04_revision_seleccion.png",
      "Figura 4. Pantalla de Revisión — Confirmar o Deshacer la Selección",
      "Antes de emitir definitivamente el voto, el sistema presenta una pantalla de revisión donde el votante puede verificar su elección con claridad. Se muestra la fotografía del candidato seleccionado, su nombre, partido político y lema. Se ofrecen dos acciones: confirmar el voto o deshacerlo si el votante desea cambiar su elección. Esta pantalla respeta la Heurística de Nielsen N.° 6 (reconocimiento antes que recuerdo) al mostrar toda la información relevante sin obligar al votante a recordar lo que eligió en el paso anterior. El indicador de progreso marca el paso 3 — Revisión.");

    @("05_advertencia_deshacer.png",
      "Figura 5. Modal de Advertencia — Deshacer la Selección de Voto",
      "Al pulsar el botón 'Deshacer Selección / Cambiar Voto', el sistema muestra un cuadro de diálogo emergente (modal) con una advertencia destacada en color naranja. El diálogo indica el nombre del candidato que se está por deshacer y ofrece dos opciones claras: 'No, mantener mi voto' o 'Sí, deshacer mi selección'. Esta advertencia explícita garantiza que el votante no cambie su voto por un error accidental, cumpliendo con la Heurística de Nielsen N.° 5 (prevención de errores) y N.° 3 (control y libertad del usuario). El fondo de la pantalla queda oscurecido para enfocar la atención en la decisión.");

    @("06_urna_y_constancia.png",
      "Figura 6. Voto Emitido — Urna Digital y Constancia Criptográfica Anónima",
      "Tras confirmar la elección, el voto queda depositado en la urna digital y el sistema muestra la pantalla de éxito (paso 4 — Constancia). Aparece la animación gráfica de una urna con la ranura de votación. A continuación se exhibe la Constancia Criptográfica Anónima de Sufragio: un código de token único (por ejemplo, VOTO-7842-K9L1-2026) que certifica que el voto fue emitido sin vincular al votante con su elección. Un temporizador visible informa que la pantalla se limpiará automáticamente en 12 segundos para el siguiente votante. El botón 'Finalizar y Limpiar Pantalla' permite hacerlo de forma manual.");

    @("07_modo_alto_contraste.png",
      "Figura 7. Modo de Alto Contraste (Accesibilidad WCAG AAA)",
      "El sistema cuenta con herramientas de accesibilidad ubicadas en la barra superior. El botón 'Alto Contraste' activa un modo de máxima legibilidad cumpliendo el estándar WCAG AAA, con fondo negro, texto y bordes en amarillo brillante, pensado para personas con baja visión o daltonismo. Puede activarse y desactivarse en cualquier momento sin interrumpir el flujo de votación. Esta pantalla muestra el Cuarto Oscuro en el modo de alto contraste.");

    @("08_guia_de_ayuda.png",
      "Figura 8. Guía de Votación y Accesibilidad — Modal de Ayuda",
      "Al presionar el botón '? Ayuda' o la tecla [H], se despliega una guía interactiva que explica los cuatro pasos del proceso de votación en lenguaje simple y accesible. También lista todos los atajos de teclado disponibles, lo cual respeta la Heurística de Nielsen N.° 10 (ayuda y documentación). La guía se puede cerrar en cualquier momento con el botón 'Entendido' o con la tecla [Esc] sin perder el progreso en la votación.");

    @("09_presidente_login.png",
      "Figura 9. Acceso Oficial — Inicio de Sesión del Presidente de Mesa",
      "La sección 'Presidente de Mesa' es exclusiva para la autoridad electoral designada. Para acceder al panel de administración, el Presidente debe ingresar el Número de Mesa asignado (en este caso, 042) y su código PIN de verificación (2026). Estos datos son las credenciales de acreditación oficial. Si las credenciales son incorrectas, el sistema muestra un aviso de error. Un cartel informativo recuerda que solo la autoridad de mesa puede acceder a esta sección. Se proveen credenciales de demostración rápida para propósitos de prueba.");

    @("10_presidente_padron.png",
      "Figura 10. Panel del Presidente de Mesa — Padrón Electoral con Estado de Sufragio",
      "Tras el inicio de sesión exitoso, el Presidente de Mesa accede al panel de control. En la parte superior se muestran indicadores de estado de la mesa: total de votos emitidos, porcentaje de participación y total de empadronados (15 en este ejemplo). La sección principal muestra el Padrón Electoral con el nombre de cada elector, DNI y estado de voto ('✓ YA VOTÓ' en verde o '⏳ PENDIENTE' en gris). El sistema indica si cada persona sufragó pero NO revela en ningún caso cuál fue su elección, garantizando el secreto del voto. El buscador permite filtrar por DNI o apellido, y hay botones para filtrar por estado.");

    @("11_anulacion_voto_cantado.png",
      "Figura 11. Modal de Anulación — Procedimiento de Voto Cantado",
      "El botón 'Anular Voto (Voto Cantado)' abre un cuadro de diálogo exclusivo para el Presidente de Mesa. Este procedimiento se utiliza cuando un elector manifiesta públicamente el sentido de su voto dentro del recinto electoral (infracción conocida como 'voto cantado') o cuando adultera la boleta. El Presidente selecciona la causal de la anulación en un menú desplegable (voto cantado en voz alta, exhibición pública de la boleta, o adulteración) y confirma la acción. El sistema registra un sufragio nulo en la urna y asienta la incidencia en el acta oficial de auditoría.");

    @("12_presidente_escrutinio.png",
      "Figura 12. Recuento Oficial y Escrutinio Provisorio con Estadísticas",
      "La sección de Recuento y Escrutinio muestra en tiempo real el cómputo de los votos depositados. La tarjeta destacada 'Opción Más Votada de la Mesa' indica el líder de la elección: en este ejemplo, la Dra. Valeria Gómez con el 57.1% de los sufragios (4 de 7 votos) y una ventaja de +2 votos sobre la segunda opción. Debajo se presenta el desglose completo en forma de barras proporcionales para todos los candidatos, el Voto en Blanco y el Voto Nulo, con sus porcentajes correspondientes. Este panel no interrumpe el flujo de votación: los votantes siguen pudiendo votar en paralelo.");

    @("13_tribunal_auditoria.png",
      "Figura 13. Tribunal Electoral — Verificación Criptográfica e Integridad de la Urna",
      "La pestaña 'Tribunal & Auditoría' está diseñada para auditores e interventores electorales independientes. Muestra dos listas paralelas: el Padrón Criptográfico, con las huellas digitales anónimas (hashes SHA-256) de cada votante habilitado, sin ningún nombre ni DNI recuperable; y la Urna Desacoplada, con los tokens anónimos de cada sufragio junto a la opción elegida y el horario de emisión. El desacoplamiento total entre ambas listas garantiza que sea imposible cruzar los datos para saber quién votó a quién, respetando el secreto del voto aún bajo auditoría independiente.")
)

# ── BUILD DOCX XML ──────────────────────────────────────────────────────────────
function makeRel($id, $target) {
    return "<Relationship Id=""$id"" Type=""http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"" Target=""media/$target""/>"
}

function makeImgRun($rId, $w, $h) {
    $cx = $w * 9144  # EMUs (914400 per inch, 72 dpi -> 1px = 9144 EMU approx)
    $cy = $h * 9144
    # cap at 5400000 wide (roughly 5.9 inch at 96dpi)
    if ($cx -gt 5400000) { $cy = [int]($cy * (5400000.0 / $cx)); $cx = 5400000 }
    return @"
<w:r>
  <w:rPr/>
  <w:drawing>
    <wp:inline distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="$cx" cy="$cy"/>
      <wp:effectExtent l="0" t="0" r="0" b="0"/>
      <wp:docPr id="1" name="img_$rId"/>
      <wp:cNvGraphicFramePr/>
      <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:nvPicPr>
              <pic:cNvPr id="0" name="img_$rId"/>
              <pic:cNvPicPr/>
            </pic:nvPicPr>
            <pic:blipFill>
              <a:blip r:embed="$rId"/>
              <a:stretch><a:fillRect/></a:stretch>
            </pic:blipFill>
            <pic:spPr>
              <a:xfrm><a:off x="0" y="0"/><a:ext cx="$cx" cy="$cy"/></a:xfrm>
              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
            </pic:spPr>
          </pic:pic>
        </a:graphicData>
      </a:graphic>
    </wp:inline>
  </w:drawing>
</w:r>
"@
}

function heading($text, $level) {
    return "<w:p><w:pPr><w:pStyle w:val=""Heading$level""/></w:pPr><w:r><w:t>$(xmlEsc $text)</w:t></w:r></w:p>"
}

function para($text, [bool]$bold=$false) {
    $rPr = if ($bold) { "<w:rPr><w:b/></w:rPr>" } else { "" }
    $lines = $text -split "`n"
    $runs = ($lines | ForEach-Object {
        "<w:r>$rPr<w:t xml:space=""preserve"">$(xmlEsc $_)</w:t></w:r><w:r><w:br/></w:r>"
    }) -join ""
    return "<w:p><w:pPr><w:spacing w:after=""160""/></w:pPr>$runs</w:p>"
}

function pageBreak() {
    return "<w:p><w:r><w:br w:type=""page""/></w:r></w:p>"
}

function caption($text) {
    return "<w:p><w:pPr><w:pStyle w:val=""Caption""/><w:jc w:val=""center""/></w:pPr><w:r><w:rPr><w:i/><w:color w:val=""555555""/></w:rPr><w:t>$(xmlEsc $text)</w:t></w:r></w:p>"
}

# Gather image dimensions from PNG IHDR chunk
function getPngDims([byte[]]$bytes) {
    # PNG IHDR: offset 16 = width (4 bytes BE), 20 = height (4 bytes BE)
    $w = ([int]$bytes[16] -shl 24) -bor ([int]$bytes[17] -shl 16) -bor ([int]$bytes[18] -shl 8) -bor $bytes[19]
    $h = ([int]$bytes[20] -shl 24) -bor ([int]$bytes[21] -shl 16) -bor ([int]$bytes[22] -shl 8) -bor $bytes[23]
    return @($w, $h)
}

# ── BUILD ZIP (DOCX) ────────────────────────────────────────────────────────────
$ms = New-Object System.IO.MemoryStream
$zip = New-Object System.IO.Compression.ZipArchive($ms, [System.IO.Compression.ZipArchiveMode]::Create, $true)

function addEntry([string]$path, [string]$content) {
    $entry = $zip.CreateEntry($path)
    $writer = New-Object System.IO.StreamWriter($entry.Open(), [System.Text.Encoding]::UTF8)
    $writer.Write($content)
    $writer.Close()
}

function addBinaryEntry([string]$path, [byte[]]$bytes) {
    $entry = $zip.CreateEntry($path)
    $stream = $entry.Open()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
}

# [Content_Types].xml
$contentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>
"@
addEntry "_rels/.rels" @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"@
addEntry "[Content_Types].xml" $contentTypes

# word/_rels/document.xml.rels
$imgRelsXml = ""
$i = 1
foreach ($name in $sections | ForEach-Object { $_[0] }) {
    $imgRelsXml += "<Relationship Id=""rImg$i"" Type=""http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"" Target=""media/$name""/>"
    $i++
}
addEntry "word/_rels/document.xml.rels" @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  $imgRelsXml
</Relationships>
"@

# Embed image binaries
foreach ($name in $sections | ForEach-Object { $_[0] }) {
    $fullPath = Join-Path $ScreenshotsDir $name
    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    addBinaryEntry "word/media/$name" $bytes
}

# word/settings.xml
addEntry "word/settings.xml" @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="720"/>
</w:settings>
"@

# word/styles.xml - Minimal with Normal, Heading1, Heading2, Caption
addEntry "word/styles.xml" @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
          xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr><w:spacing w:after="200" w:line="276" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:outlineLvl w:val="0"/><w:spacing w:before="400" w:after="200"/><w:jc w:val="center"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="1F3864"/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:outlineLvl w:val="1"/><w:spacing w:before="360" w:after="160"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="2E74B5"/></w:pBdr></w:pPr>
    <w:rPr><w:b/><w:color w:val="2E74B5"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:outlineLvl w:val="2"/><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:color w:val="1F3864"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Caption">
    <w:name w:val="caption"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="200"/></w:pPr>
    <w:rPr><w:i/><w:color w:val="595959"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>
  </w:style>
</w:styles>
"@

# ── BUILD document.xml body ────────────────────────────────────────────────────
$nsDecl = @"
xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
xmlns:w10="urn:schemas-microsoft-com:office:word"
xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"
xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
"@

$body = ""

# ── PORTADA ────────────────────────────────────────────────────────────────────
$body += "<w:p><w:pPr><w:spacing w:before=""2400"" w:after=""200""/><w:jc w:val=""center""/></w:pPr></w:p>"
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr><w:r><w:rPr><w:b/><w:color w:val=""1F3864""/><w:sz w:val=""60""/><w:szCs w:val=""60""/></w:rPr><w:t>🗳️ Sistema de Voto Electrónico</w:t></w:r></w:p>"
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr><w:r><w:rPr><w:b/><w:color w:val=""2E74B5""/><w:sz w:val=""44""/><w:szCs w:val=""44""/></w:rPr><w:t>Elecciones Municipales 2026</w:t></w:r></w:p>"
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr><w:r><w:rPr><w:color w:val=""404040""/><w:sz w:val=""28""/></w:rPr><w:t>Elección de Intendente — Mesa N.° 042 — Ciudad Capital</w:t></w:r></w:p>"
$body += "<w:p><w:pPr><w:jc w:val=""center""/><w:spacing w:before=""400""/></w:pPr><w:r><w:rPr><w:color w:val=""595959""/><w:sz w:val=""24""/></w:rPr><w:t>Manual de Usuario del Sistema</w:t></w:r></w:p>"
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr><w:r><w:rPr><w:color w:val=""595959""/><w:sz w:val=""22""/></w:rPr><w:t>Octubre 2026</w:t></w:r></w:p>"
$body += pageBreak

# ── INTRODUCCIÓN ───────────────────────────────────────────────────────────────
$body += heading "1. Introducción" 1
$body += para "Este documento describe el funcionamiento del Sistema de Voto Electrónico Municipal utilizado durante las Elecciones de Intendente 2026. El manual está dirigido a todos los participantes del proceso electoral: votantes, Presidente de Mesa y Tribunal Electoral. No se incluyen detalles técnicos del código fuente; el objetivo es explicar qué hace cada pantalla y cómo usarla correctamente."
$body += para "El sistema cumple con los 10 principios de usabilidad de Jakob Nielsen, lo que garantiza una experiencia intuitiva, accesible y libre de errores. Incluye retroalimentación constante, advertencias ante acciones importantes, accesibilidad visual (modo de alto contraste WCAG AAA) y la posibilidad de deshacer acciones antes de confirmar el voto."
$body += para "La privacidad del votante está garantizada constitucionalmente: el sistema no guarda ningún nombre, domicilio ni DNI en texto legible. Solo registra una huella criptográfica anónima (hash SHA-256) para impedir que una misma persona vote más de una vez, manteniendo la urna totalmente desacoplada e inrastreable."

# ── SECCIÓN VOTANTE ────────────────────────────────────────────────────────────
$body += heading "2. Proceso de Votación — Flujo del Votante" 1
$body += para "El proceso de votación está dividido en cuatro pasos claramente indicados por una barra de progreso en la parte superior de la pantalla: Identificación, Selección, Revisión y Constancia. A continuación se describe cada paso con su correspondiente captura de pantalla real."
$body += pageBreak

# Section 2.1 — Paso 1
$body += heading "2.1 Paso 1: Identificación del Votante" 2
$body += para "El votante ingresa al sistema presentando su DNI. El sistema acepta el número con o sin puntos o guiones, y lo verifica de manera anónima contra el padrón de la mesa para confirmar que la persona está habilitada y que no ha votado anteriormente."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\01_identificacion_votante.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg1" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 1. Pantalla de Bienvenida e Identificación del Votante"
$body += para "El sistema muestra un teclado virtual en pantalla, útil en equipos táctiles tipo quiosco. También se incluyen botones de acceso rápido con DNI de demostración para agilizar las pruebas. Un cartel en la parte inferior garantiza que no se guardan datos personales."
$body += pageBreak

# Section 2.2 — Paso 1 error
$body += heading "2.2 Validación del DNI — Prevención de Errores" 2
$body += para "Si el votante intenta ingresar un DNI con más de 8 números o con caracteres no válidos, el sistema detecta el problema de manera inmediata y muestra un aviso de advertencia. El campo de entrada cambia de color y el sistema indica exactamente cuál es el error, para que el votante pueda corregirlo sin ayuda."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\02_alerta_validacion_dni.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg2" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 2. Aviso de formato incorrecto de DNI"
$body += pageBreak

# Section 2.3 — Paso 2
$body += heading "2.3 Paso 2: Cuarto Oscuro Digital — Selección de Candidatos" 2
$body += para "Una vez habilitado el votante, accede al Cuarto Oscuro Digital donde se presentan todas las opciones electorales disponibles: los candidatos con su fotografía, partido y propuestas, la opción de Voto en Blanco y el Voto Nulo. El votante selecciona la opción de su preferencia haciendo clic sobre la boleta o usando las teclas numéricas del teclado."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\03_cuarto_oscuro.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg3" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 3. Cuarto Oscuro Digital con los candidatos disponibles"
$body += para "La boleta seleccionada queda visualmente resaltada con un borde de color y la etiqueta 'Seleccionado'. El botón 'Revisar y Continuar' se habilita solo cuando se ha elegido una opción, evitando el avance accidental."
$body += pageBreak

# Section 2.4 — Paso 3
$body += heading "2.4 Paso 3: Revisión — Confirmar o Cambiar el Voto" 2
$body += para "Antes de emitir el voto de manera definitiva, el sistema presenta una pantalla de revisión donde el votante puede verificar su elección: fotografía del candidato, nombre, partido y lema. Si el votante desea cambiar su elección, puede usar el botón 'Deshacer Selección / Cambiar Voto'."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\04_revision_seleccion.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg4" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 4. Pantalla de Revisión antes de confirmar el voto"
$body += pageBreak

# Section 2.5 — Modal advertencia
$body += heading "2.5 Advertencia al Deshacer el Voto" 2
$body += para "Al pulsar el botón de deshacer, el sistema muestra un cuadro de diálogo de advertencia explícita. El mensaje indica claramente el candidato que se está por cancelar y ofrece dos opciones: mantener el voto actual o sí deshacerlo. Esta advertencia impide que el votante cambie su voto por error."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\05_advertencia_deshacer.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg5" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 5. Cuadro de advertencia al intentar deshacer la selección de voto"
$body += pageBreak

# Section 2.6 — Paso 4
$body += heading "2.6 Paso 4: Voto Emitido — Urna Digital y Constancia" 2
$body += para "Al confirmar el voto, el sistema lo deposita en la urna digital de forma anónima. La pantalla muestra la animación de la urna y emite una Constancia Criptográfica Anónima: un código único que certifica que el voto fue registrado sin revelar la elección del votante. Un temporizador indica que la pantalla se reseteará automáticamente en 12 segundos para el siguiente elector."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\06_urna_y_constancia.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg6" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 6. Confirmación de voto emitido y constancia criptográfica anónima"
$body += pageBreak

# ── SECCIÓN ACCESIBILIDAD ──────────────────────────────────────────────────────
$body += heading "3. Herramientas de Accesibilidad" 1

$body += heading "3.1 Modo de Alto Contraste" 2
$body += para "El sistema incluye un botón de Alto Contraste en la barra superior que activa un esquema de colores de máxima legibilidad (estándar WCAG AAA), con fondo negro y texto en amarillo brillante. Este modo está diseñado para personas con baja visión o daltonismo y puede activarse en cualquier momento sin interrumpir el proceso de votación."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\07_modo_alto_contraste.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg7" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 7. Modo de Alto Contraste (WCAG AAA)"
$body += pageBreak

$body += heading "3.2 Guía de Ayuda Interactiva" 2
$body += para "Al presionar el botón '? Ayuda' o la tecla [H] del teclado, se abre una guía que explica los cuatro pasos del proceso de votación y los atajos de teclado disponibles. La guía puede cerrarse con el botón 'Entendido' o con la tecla [Esc] sin perder el avance en la votación."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\08_guia_de_ayuda.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg8" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 8. Guía de votación y accesibilidad"
$body += pageBreak

# ── SECCIÓN PRESIDENTE DE MESA ─────────────────────────────────────────────────
$body += heading "4. Sección del Presidente de Mesa" 1
$body += para "La sección 'Presidente de Mesa' es exclusiva para la autoridad electoral designada. Se accede desde la pestaña correspondiente en la barra de navegación superior. Esta sección permite gestionar el padrón, controlar quiénes han votado, registrar incidencias de voto cantado y consultar el escrutinio provisorio."
$body += pageBreak

$body += heading "4.1 Inicio de Sesión del Presidente de Mesa" 2
$body += para "El Presidente de Mesa debe ingresar el número de mesa y su código PIN de verificación para acceder al panel de control. Si las credenciales son incorrectas, el sistema muestra un aviso de error."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\09_presidente_login.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg9" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 9. Pantalla de inicio de sesión del Presidente de Mesa"
$body += pageBreak

$body += heading "4.2 Padrón Electoral y Estado de Sufragio" 2
$body += para "Tras autenticarse, el Presidente puede ver el padrón completo con todos los electores habilitados en la mesa. Para cada elector se indica si ya sufragó ('✓ YA VOTÓ' en verde) o si todavía está pendiente ('⏳ PENDIENTE' en gris). El sistema nunca revela cuál fue la elección de cada persona, garantizando el secreto del voto. El buscador y los filtros permiten localizar rápidamente a cualquier elector."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\10_presidente_padron.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg10" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 10. Padrón electoral con estado de sufragio (7 de 15 votaron — 46.7%)"
$body += pageBreak

$body += heading "4.3 Anulación por Voto Cantado" 2
$body += para "El botón 'Anular Voto (Voto Cantado)' está disponible en el panel del Presidente de Mesa. Se utiliza cuando un elector viola el secreto del voto (lo anuncia públicamente) o adultera la boleta. El Presidente selecciona la causal en el menú desplegable y confirma la anulación. El sistema registra automáticamente la incidencia en el acta oficial de auditoría."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\11_anulacion_voto_cantado.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg11" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 11. Procedimiento formal de anulación por Voto Cantado"
$body += pageBreak

$body += heading "4.4 Recuento y Escrutinio Provisorio" 2
$body += para "La sección de Escrutinio muestra en tiempo real la opción más votada con su porcentaje y ventaja sobre la segunda opción, así como el desglose completo de todos los sufragios en barras proporcionales. Este panel se actualiza de forma continua a medida que los votantes emiten sus sufragios."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\12_presidente_escrutinio.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg12" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 12. Escrutinio provisorio — Dra. Valeria Gómez lidera con 57.1%"
$body += pageBreak

# ── SECCIÓN TRIBUNAL ───────────────────────────────────────────────────────────
$body += heading "5. Tribunal Electoral — Auditoría Criptográfica" 1
$body += para "La pestaña 'Tribunal & Auditoría' está diseñada para que auditores e interventores electorales independientes puedan verificar la integridad del proceso sin comprometer el secreto del voto. Se muestran dos listas paralelas:"
$body += para "• Padrón Criptográfico: muestra las huellas digitales anónimas (hashes SHA-256) de cada votante habilitado. Estos hashes son generados a partir del DNI más una clave secreta de mesa, por lo que ningún nombre ni DNI original puede ser recuperado."
$body += para "• Urna Desacoplada: muestra los tokens de cada sufragio con la opción elegida y el horario. Los votos están mezclados en orden aleatorio para imposibilitar cualquier correlación temporal con el padrón."

$dims = getPngDims ([System.IO.File]::ReadAllBytes("$ScreenshotsDir\13_tribunal_auditoria.png"))
$body += "<w:p><w:pPr><w:jc w:val=""center""/></w:pPr>$(makeImgRun "rImg13" $dims[0] $dims[1])</w:p>"
$body += caption "Figura 13. Panel del Tribunal Electoral — Hashes criptográficos y urna desacoplada"
$body += pageBreak

# ── CIERRE ─────────────────────────────────────────────────────────────────────
$body += heading "6. Resumen del Sistema" 1
$body += para "El Sistema de Voto Electrónico Municipal cumple con los estándares de usabilidad, privacidad y transparencia requeridos por el proceso electoral:"
$body += para "✅ Privacidad garantizada: No se almacena ningún dato personal de los votantes."
$body += para "✅ Secreto del voto: La urna y el padrón están completamente desacoplados."
$body += para "✅ Prevención de doble voto: Mediante huellas criptográficas anónimas (SHA-256)."
$body += para "✅ Capacidad de deshacer: El votante puede cambiar su elección antes de confirmarla, con advertencia explícita."
$body += para "✅ Retroalimentación constante: Todas las acciones generan confirmación visual inmediata."
$body += para "✅ Accesibilidad: Modo de alto contraste WCAG AAA, teclado virtual y guía interactiva."
$body += para "✅ Control de autoridad: El Presidente de Mesa puede gestionar el padrón y el escrutinio con acceso restringido por credenciales."
$body += para "✅ Auditoría independiente: El Tribunal Electoral puede verificar la integridad sin comprometer el secreto del voto."

# ── COMPOSE document.xml ────────────────────────────────────────────────────────
$docXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document $nsDecl mc:Ignorable="w14 w15 wp14">
  <w:body>
$body
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

addEntry "word/document.xml" $docXml

# Finalize
$zip.Dispose()
[System.IO.File]::WriteAllBytes($OutputPath, $ms.ToArray())
$ms.Close()

$size = (Get-Item $OutputPath).Length
Write-Host "DOCX generado exitosamente: $OutputPath ($size bytes)"
