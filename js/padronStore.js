/**
 * padronStore.js
 * Padrón electoral oficial de la Mesa 042 y control de autenticación del Presidente de Mesa.
 * - Credenciales oficiales de la mesa.
 * - Lista de electores empadronados.
 * - Muestra quiénes ya votaron SIN mostrar jamás a quién votaron (secreto del voto).
 */

const PadronStore = {
    TABLE_NUMBER: "042",
    PRESIDENT_CODE: "2026",

    // Padrón oficial inicial de la Mesa 042
    DEFAULT_ELECTORS: [
        { order: 1, name: "GÓMEZ, Horacio Alberto", dni: "38123456", gender: "M" },
        { order: 2, name: "FIGUEROA, Mariana Belén", dni: "41987654", gender: "F" },
        { order: 3, name: "MARTÍNEZ, Santiago Daniel", dni: "35412890", gender: "M" },
        { order: 4, name: "FERNÁNDEZ, Lucía Inés", dni: "39204512", gender: "F" },
        { order: 5, name: "RODRÍGUEZ, Carlos Ramón", dni: "28456123", gender: "M" },
        { order: 6, name: "GONZÁLEZ, Ana María", dni: "32109845", gender: "F" },
        { order: 7, name: "ÁLVAREZ, Mateo Agustín", dni: "42156789", gender: "M" },
        { order: 8, name: "BENÍTEZ, Sofía Camila", dni: "40321654", gender: "F" },
        { order: 9, name: "DÍAZ, Lucas Valentín", dni: "37890123", gender: "M" },
        { order: 10, name: "HERRERA, Florencia Micaela", dni: "43210987", gender: "F" },
        { order: 11, name: "LÓPEZ, Javier Esteban", dni: "31456789", gender: "M" },
        { order: 12, name: "CASTRO, Rocío Antonella", dni: "44123890", gender: "F" },
        { order: 13, name: "MORALES, Pablo Andrés", dni: "29876543", gender: "M" },
        { order: 14, name: "SOSA, Victoria Elena", dni: "36789012", gender: "F" },
        { order: 15, name: "ROMERO, Gabriel Iván", dni: "34567891", gender: "M" }
    ],

    /**
     * Valida las credenciales del Presidente de Mesa.
     * @param {string} tableNum 
     * @param {string} code 
     * @returns {boolean}
     */
    authenticate(tableNum, code) {
        if (!tableNum || !code) return false;
        const cleanTable = String(tableNum).trim().replace(/^0+/, "") || "0";
        const cleanTarget = this.TABLE_NUMBER.replace(/^0+/, "");
        const cleanCode = String(code).trim();

        return (cleanTable === cleanTarget || String(tableNum).trim() === this.TABLE_NUMBER) && 
               cleanCode === this.PRESIDENT_CODE;
    },

    /**
     * Obtiene los electores con su estado de votación calculado contra los hashes anónimos de la urna.
     * NUNCA expone a quién votó, solo si su huella criptográfica figura en la lista de sufragados.
     * @returns {Promise<Array>}
     */
    async getRollWithStatus() {
        const state = ElectionStore.getState();
        const hashedVoters = state.hashedVoters || [];

        const list = [];
        for (const elector of this.DEFAULT_ELECTORS) {
            const electorHash = await CryptoService.anonymizeVoterId(elector.dni);
            const hasVoted = hashedVoters.includes(electorHash);
            list.push({
                ...elector,
                hasVoted: hasVoted,
                formattedDni: this.formatDni(elector.dni)
            });
        }
        return list;
    },

    formatDni(dni) {
        const s = String(dni).replace(/\D/g, "");
        if (s.length === 8) {
            return `${s.substring(0, 2)}.${s.substring(2, 5)}.${s.substring(5)}`;
        } else if (s.length === 7) {
            return `${s.substring(0, 1)}.${s.substring(1, 4)}.${s.substring(4)}`;
        }
        return s;
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { PadronStore };
}
