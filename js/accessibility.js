/**
 * accessibility.js
 * Módulo de Accesibilidad e Inclusión (WCAG 2.1 AA / Heurística Nielsen #7 Flexibilidad y Eficiencia).
 * - Modos de Alto Contraste para personas con baja visión.
 * - Escalado dinámico de tipografía (Normal, Grande, Extra Grande).
 * - Navegación completa por teclado y atajos rápidos tipo kiosco electoral.
 * - Modal interactivo de Ayuda y Documentación (Heurística Nielsen #10).
 */

const Accessibility = {
    fontSizeLevels: ["font-normal", "font-large", "font-xlarge"],
    currentFontIndex: 0,
    highContrastActive: false,

    init() {
        this.bindControls();
        this.bindKeyboardShortcuts();
        this.loadPreferences();
    },

    bindControls() {
        const contrastBtn = document.getElementById("btn-toggle-contrast");
        const fontBtn = document.getElementById("btn-toggle-font-size");
        const helpBtn = document.getElementById("btn-open-help");
        const helpCloseBtn = document.getElementById("btn-close-help");
        const helpModal = document.getElementById("help-modal-overlay");

        if (contrastBtn) {
            contrastBtn.addEventListener("click", () => this.toggleContrast());
        }

        if (fontBtn) {
            fontBtn.addEventListener("click", () => this.cycleFontSize());
        }

        if (helpBtn && helpModal) {
            helpBtn.addEventListener("click", () => {
                helpModal.classList.remove("hidden");
                helpModal.setAttribute("aria-hidden", "false");
                NielsenFeedback.playSound('select');
                if (helpCloseBtn) helpCloseBtn.focus();
            });
        }

        if (helpCloseBtn && helpModal) {
            helpCloseBtn.addEventListener("click", () => {
                helpModal.classList.add("hidden");
                helpModal.setAttribute("aria-hidden", "true");
                NielsenFeedback.playSound('select');
                if (helpBtn) helpBtn.focus();
            });
        }
    },

    toggleContrast() {
        this.highContrastActive = !this.highContrastActive;
        document.body.classList.toggle("high-contrast", this.highContrastActive);
        
        const btn = document.getElementById("btn-toggle-contrast");
        if (btn) {
            btn.setAttribute("aria-pressed", this.highContrastActive.toString());
            btn.title = this.highContrastActive ? "Desactivar Alto Contraste" : "Activar Alto Contraste";
        }

        localStorage.setItem("elecciones_high_contrast", this.highContrastActive);
        NielsenFeedback.showToast(
            this.highContrastActive ? "Modo de alto contraste activado." : "Modo normal activado.",
            "info"
        );
    },

    cycleFontSize() {
        document.body.classList.remove(...this.fontSizeLevels);
        this.currentFontIndex = (this.currentFontIndex + 1) % this.fontSizeLevels.length;
        const newClass = this.fontSizeLevels[this.currentFontIndex];
        
        if (newClass !== "font-normal") {
            document.body.classList.add(newClass);
        }

        const labels = ["Texto Normal (100%)", "Texto Grande (125%)", "Texto Muy Grande (150%)"];
        const btn = document.getElementById("btn-toggle-font-size");
        if (btn) {
            btn.title = `Tamaño de texto: ${labels[this.currentFontIndex]}`;
        }

        localStorage.setItem("elecciones_font_size", this.currentFontIndex);
        NielsenFeedback.showToast(`Tamaño de fuente cambiado a: ${labels[this.currentFontIndex]}`, "info");
    },

    bindKeyboardShortcuts() {
        window.addEventListener("keydown", (e) => {
            // No interferir si el usuario está escribiendo en el campo de texto de DNI
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

            // Atajos de selección de boleta (1, 2, 3) en paso de votación
            if (e.key === "1") {
                const b1 = document.querySelector('[data-candidate-id="cand-1"]');
                if (b1) b1.click();
            } else if (e.key === "2") {
                const b2 = document.querySelector('[data-candidate-id="cand-2"]');
                if (b2) b2.click();
            } else if (e.key === "3" || e.key === "0") {
                const bBlank = document.querySelector('[data-candidate-id="blank"]');
                if (bBlank) bBlank.click();
            } else if (e.key === "4") {
                const bNull = document.querySelector('[data-candidate-id="null"]');
                if (bNull) bNull.click();
            } else if (e.key === "h" || e.key === "H") {
                // Atajo H para Ayuda
                const helpBtn = document.getElementById("btn-open-help");
                if (helpBtn) helpBtn.click();
            }
        });
    },

    loadPreferences() {
        try {
            const savedContrast = localStorage.getItem("elecciones_high_contrast") === "true";
            if (savedContrast) this.toggleContrast();

            const savedFont = parseInt(localStorage.getItem("elecciones_font_size") || "0", 10);
            if (savedFont > 0 && savedFont < this.fontSizeLevels.length) {
                this.currentFontIndex = savedFont - 1;
                this.cycleFontSize();
            }
        } catch (e) {
            // Silencioso
        }
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { Accessibility };
}
