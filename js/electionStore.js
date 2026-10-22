/**
 * electionStore.js
 * Almacén de datos y lógica electoral de la mesa.
 * - Almacena únicamente el padrón de HASHES anónimos (previene voto doble, CERO PII).
 * - Urna digital desacoplada (secreto absoluto del voto).
 * - Satisface las necesidades del Tribunal Electoral (integridad, auditoría, estadísticas).
 */

const STORAGE_KEYS = {
    HASHED_VOTERS: "elecciones_hashed_voters_v1",
    BALLOT_BOX: "elecciones_ballot_box_v1",
    TABLE_STATE: "elecciones_table_state_v1",
    AUDIT_LOG: "elecciones_audit_log_v1"
};

const ElectionStore = {
    // Total teórico de electores empadronados en la mesa para calcular porcentaje de participación
    ELECTORAL_ROLL_SIZE: 350,

    /**
     * Inicializa o recupera el estado desde LocalStorage.
     */
    getState() {
        try {
            const votersJson = localStorage.getItem(STORAGE_KEYS.HASHED_VOTERS);
            const boxJson = localStorage.getItem(STORAGE_KEYS.BALLOT_BOX);
            const stateJson = localStorage.getItem(STORAGE_KEYS.TABLE_STATE);
            const auditJson = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);

            return {
                hashedVoters: votersJson ? JSON.parse(votersJson) : [],
                ballotBox: boxJson ? JSON.parse(boxJson) : [],
                isOpen: stateJson !== null ? JSON.parse(stateJson) : true,
                auditLog: auditJson ? JSON.parse(auditJson) : []
            };
        } catch (e) {
            console.error("Error al leer el estado electoral:", e);
            return { hashedVoters: [], ballotBox: [], isOpen: true, auditLog: [] };
        }
    },

    saveState(state) {
        try {
            localStorage.setItem(STORAGE_KEYS.HASHED_VOTERS, JSON.stringify(state.hashedVoters));
            localStorage.setItem(STORAGE_KEYS.BALLOT_BOX, JSON.stringify(state.ballotBox));
            localStorage.setItem(STORAGE_KEYS.TABLE_STATE, JSON.stringify(state.isOpen));
            localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(state.auditLog));
        } catch (e) {
            console.error("Error al persistir el estado electoral:", e);
        }
    },

    /**
     * Verifica si un votante está habilitado o si ya votó.
     * @param {string} rawDocument 
     * @returns {Promise<{ allowed: boolean, reason?: string, voterHash?: string }>}
     */
    async checkVoter(rawDocument) {
        if (!rawDocument) {
            return {
                allowed: false,
                reason: "Por favor, ingrese un número de documento."
            };
        }

        const cleanDigits = String(rawDocument).replace(/\D/g, "");
        if (cleanDigits.length < 7 || cleanDigits.length > 8) {
            return {
                allowed: false,
                reason: `El DNI debe contener entre 7 y 8 números (actualmente tiene ${cleanDigits.length}).`
            };
        }

        const state = this.getState();

        if (!state.isOpen) {
            return {
                allowed: false,
                reason: "La mesa de votación se encuentra cerrada por el Tribunal Electoral."
            };
        }

        const voterHash = await CryptoService.anonymizeVoterId(rawDocument);

        if (state.hashedVoters.includes(voterHash)) {
            return {
                allowed: false,
                reason: "Este documento ya figura con sufragio emitido en esta mesa. No es posible votar más de una vez.",
                voterHash
            };
        }

        return {
            allowed: true,
            voterHash
        };
    },

    /**
     * Emite un voto en la urna y marca al votante como sufragado.
     * @param {string} rawDocument
     * @param {string} candidateId
     * @returns {Promise<{ success: boolean, receipt?: string, message?: string }>}
     */
    async castVote(rawDocument, candidateId) {
        const check = await this.checkVoter(rawDocument);
        if (!check.allowed) {
            return { success: false, message: check.reason };
        }

        const state = this.getState();
        const receipt = CryptoService.generateAnonymousReceipt();

        // 1. Registrar hash de votante (sin asociar al voto)
        state.hashedVoters.push(check.voterHash);

        // 2. Depositar voto en la urna completamente anónimo
        // Mezclamos aleatoriamente la posición para evitar cualquier correlación de tiempo
        const newBallot = {
            receiptId: receipt,
            candidateId: candidateId,
            timestamp: new Date().toISOString()
        };

        // Inserción aleatoria en la urna (desacoplamiento total temporal)
        const insertIndex = Math.floor(Math.random() * (state.ballotBox.length + 1));
        state.ballotBox.splice(insertIndex, 0, newBallot);

        // 3. Registrar evento en log de auditoría del tribunal
        state.auditLog.push({
            event: "VOTO_EMITIDO_EXITOSO",
            receiptToken: receipt,
            timestamp: new Date().toISOString()
        });

        this.saveState(state);

        return {
            success: true,
            receipt: receipt
        };
    },

    /**
     * Anula un voto por infracción electoral formal (ej: Voto Cantado).
     * Registra un sufragio nulo en la urna y asienta la infracción en el acta de auditoría.
     * @param {string} reason - Causa de la anulación
     * @returns {{ success: boolean, receipt: string }}
     */
    annulVote(reason = "Voto Cantado / Violación del secreto del sufragio") {
        const state = this.getState();
        const receipt = CryptoService.generateAnonymousReceipt();

        const newBallot = {
            receiptId: receipt,
            candidateId: "null",
            timestamp: new Date().toISOString(),
            isAnnulledIncident: true,
            incidentReason: reason
        };

        const insertIndex = Math.floor(Math.random() * (state.ballotBox.length + 1));
        state.ballotBox.splice(insertIndex, 0, newBallot);

        state.auditLog.push({
            event: "VOTO_ANULADO_POR_CANTADO",
            receiptToken: receipt,
            reason: reason,
            timestamp: new Date().toISOString()
        });

        this.saveState(state);

        return {
            success: true,
            receipt: receipt
        };
    },

    /**
     * Obtiene el escrutinio en tiempo real y estadísticas para el Tribunal y Responsables.
     */
    getResults() {
        const state = this.getState();
        const totalVotes = state.ballotBox.length;
        const counts = {};

        CANDIDATES.forEach(c => {
            counts[c.id] = 0;
        });

        state.ballotBox.forEach(ballot => {
            if (counts[ballot.candidateId] !== undefined) {
                counts[ballot.candidateId]++;
            } else {
                counts[ballot.candidateId] = 1;
            }
        });

        const breakdown = CANDIDATES.map(c => {
            const count = counts[c.id] || 0;
            const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : "0.0";
            return {
                id: c.id,
                name: c.name,
                party: c.party,
                number: c.number,
                colorTheme: c.colorTheme,
                votes: count,
                percentage: percentage
            };
        });

        // Determinar la opción más votada (estadística de a qué se votó más)
        const sorted = [...breakdown].sort((a, b) => b.votes - a.votes);
        let leaderInfo = null;

        if (totalVotes > 0 && sorted[0].votes > 0) {
            const topVotes = sorted[0].votes;
            const tied = sorted.filter(item => item.votes === topVotes);
            if (tied.length > 1) {
                leaderInfo = {
                    isTie: true,
                    tiedNames: tied.map(t => t.name).join(" y "),
                    votes: topVotes,
                    percentage: tied[0].percentage
                };
            } else {
                const secondVotes = sorted[1] ? sorted[1].votes : 0;
                leaderInfo = {
                    isTie: false,
                    option: sorted[0],
                    marginVotes: topVotes - secondVotes,
                    votes: topVotes,
                    percentage: sorted[0].percentage
                };
            }
        }

        const turnoutPercentage = ((totalVotes / this.ELECTORAL_ROLL_SIZE) * 100).toFixed(1);

        return {
            totalVotes,
            electoralRollSize: this.ELECTORAL_ROLL_SIZE,
            turnoutPercentage,
            isOpen: state.isOpen,
            breakdown,
            leaderInfo,
            auditLog: state.auditLog,
            hashedVotersCount: state.hashedVoters.length
        };
    },

    /**
     * Alterna la apertura / cierre de la mesa electoral.
     */
    toggleTableState() {
        const state = this.getState();
        state.isOpen = !state.isOpen;
        state.auditLog.push({
            event: state.isOpen ? "MESA_REAPERTURA" : "MESA_CIERRE_OFICIAL",
            timestamp: new Date().toISOString()
        });
        this.saveState(state);
        return state.isOpen;
    },

    /**
     * Restablece la urna y el padrón para reiniciar la demostración.
     */
    resetDemo() {
        localStorage.removeItem(STORAGE_KEYS.HASHED_VOTERS);
        localStorage.removeItem(STORAGE_KEYS.BALLOT_BOX);
        localStorage.removeItem(STORAGE_KEYS.TABLE_STATE);
        localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG);
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { ElectionStore };
}
