/**
 * nielsenFeedback.js
 * Sistema de Retroalimentación y Diálogos de Usabilidad según las Heurísticas de Jakob Nielsen.
 * - Retroalimentación auditiva y visual inmediata (Visibilidad del estado del sistema).
 * - Modal explícito de advertencia al deshacer el voto (Control del usuario y prevención de errores).
 * - Notificaciones toast accesibles (Ayuda a reconocer errores).
 */

const NielsenFeedback = {
    audioContext: null,

    /**
     * Inicializa el sintetizador de audio accesible para feedback no intrusivo.
     */
    initAudio() {
        if (!this.audioContext && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioCtx();
        }
    },

    /**
     * Reproduce un tono sutil acorde a la acción.
     * @param {'select'|'confirm'|'warning'|'error'|'undo'} type 
     */
    playSound(type) {
        try {
            this.initAudio();
            if (!this.audioContext) return;
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const ctx = this.audioContext;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'select') {
                // Tono agradable ascendente suave
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'confirm') {
                // Acorde de confirmación cívica
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'warning' || type === 'undo') {
                // Tono de atención de dos pulsos bajos
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.setValueAtTime(260, now + 0.1);
                gain.gain.setValueAtTime(0.09, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'error') {
                // Tono grave de error
                osc.type = 'square';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.setValueAtTime(180, now + 0.15);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {
            // Silencioso si el navegador bloquea audio
        }
    },

    /**
     * Muestra una notificación accesible de estado (Toast).
     * @param {string} message 
     * @param {'info'|'success'|'warning'|'error'} type 
     * @param {number} durationMs 
     */
    showToast(message, type = 'info', durationMs = 4000) {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");

        const icons = {
            info: "ℹ️",
            success: "✅",
            warning: "⚠️",
            error: "🚫"
        };

        toast.innerHTML = `
            <span class="toast-icon" aria-hidden="true">${icons[type] || "ℹ️"}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Cerrar notificación">&times;</button>
        `;

        const closeBtn = toast.querySelector(".toast-close");
        closeBtn.onclick = () => {
            toast.classList.add("toast-hiding");
            setTimeout(() => toast.remove(), 250);
        };

        container.appendChild(toast);
        this.playSound(type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'select');

        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add("toast-hiding");
                setTimeout(() => toast.remove(), 250);
            }
        }, durationMs);
    },

    /**
     * Modal especializado de advertencia cuando el usuario decide deshacer su voto.
     * Cumple con la Heurística de Nielsen #3 (Control y libertad del usuario)
     * y la Heurística #5 (Prevención de errores), además del requisito explícito del usuario.
     * 
     * @param {object} candidate - Candidato actualmente seleccionado
     * @param {function} onConfirmUndo - Callback si el usuario confirma deshacer
     * @param {function} onCancelUndo - Callback si el usuario decide mantener su voto
     */
    showUndoWarningModal(candidate, onConfirmUndo, onCancelUndo) {
        this.playSound('warning');

        const modalOverlay = document.getElementById("undo-modal-overlay");
        const modalCandidateName = document.getElementById("undo-modal-candidate-name");
        const btnConfirmUndo = document.getElementById("btn-confirm-undo");
        const btnCancelUndo = document.getElementById("btn-cancel-undo");

        if (modalCandidateName) {
            modalCandidateName.textContent = candidate ? candidate.name : "su opción";
        }

        modalOverlay.classList.remove("hidden");
        modalOverlay.setAttribute("aria-hidden", "false");

        // Foco inicial en el botón seguro (mantener el voto) para prevenir errores accidentales
        btnCancelUndo.focus();

        const cleanup = () => {
            modalOverlay.classList.add("hidden");
            modalOverlay.setAttribute("aria-hidden", "true");
            btnConfirmUndo.onclick = null;
            btnCancelUndo.onclick = null;
        };

        btnConfirmUndo.onclick = () => {
            cleanup();
            this.playSound('undo');
            this.showToast("Acción deshecha. Por favor, seleccione un candidato nuevamente.", "warning");
            if (onConfirmUndo) onConfirmUndo();
        };

        btnCancelUndo.onclick = () => {
            cleanup();
            this.playSound('select');
            if (onCancelUndo) onCancelUndo();
        };

        // Soporte tecla Escape para cancelar el deshacer
        const keyHandler = (e) => {
            if (e.key === "Escape" && !modalOverlay.classList.contains("hidden")) {
                cleanup();
                window.removeEventListener("keydown", keyHandler);
                if (onCancelUndo) onCancelUndo();
            }
        };
        window.addEventListener("keydown", keyHandler);
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { NielsenFeedback };
}
