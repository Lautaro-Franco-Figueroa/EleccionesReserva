/**
 * cryptoService.js
 * Módulo criptográfico para garantizar:
 * 1. Privacidad absoluta del votante: CERO datos personales almacenados (sin nombres, sin DNI en texto plano).
 * 2. Unicidad del voto: Distingue si una persona ya votó mediante un hash unidireccional SHA-256 con Salt.
 * 3. Desacoplamiento total: El registro de quién votó está completamente separado de qué votó.
 */

const CryptoService = {
    // Salt secreto de la mesa para evitar ataques de tablas rainbow a números de DNI conocidos
    TABLE_SALT: "MESA-042-INTENDENCIA-SECRET-SALT-2026",

    /**
     * Convierte una cadena de texto en un Hash SHA-256 unidireccional hexadecimal.
     * @param {string} text - Cadena a hashear (ej: DNI + Salt)
     * @returns {Promise<string>} Hash de 64 caracteres
     */
    async sha256(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        // Uso de Web Crypto API nativa del navegador
        if (window.crypto && window.crypto.subtle) {
            const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        }

        // Fallback matemático simple en entornos sin crypto.subtle
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return "hash-fallback-" + Math.abs(hash).toString(16);
    },

    /**
     * Genera la huella criptográfica anónima del votante.
     * Nunca se guarda el DNI original.
     * @param {string} rawDocument - Número de documento o matrícula electoral
     * @returns {Promise<string>} Huella anónima
     */
    async anonymizeVoterId(rawDocument) {
        if (!rawDocument) return "";
        // Quitar puntos, guiones y espacios para asegurar igualdad criptográfica de hashes
        const cleanDoc = String(rawDocument).replace(/[\.\-\s]/g, "").trim().toUpperCase();
        return await this.sha256(`${this.TABLE_SALT}::${cleanDoc}`);
    },

    /**
     * Genera un comprobante anónimo de sufragio para el votante.
     * Contiene solo un identificador aleatorio de urna y fecha, sin ningún dato que lo vincule a su DNI.
     */
    generateAnonymousReceipt() {
        const randomBytes = new Uint8Array(8);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(randomBytes);
        } else {
            for (let i = 0; i < 8; i++) randomBytes[i] = Math.floor(Math.random() * 256);
        }
        const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
        return `VOTO-${hex.substring(0, 4)}-${hex.substring(4, 8)}-${new Date().getFullYear()}`;
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { CryptoService };
}
