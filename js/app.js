/**
 * app.js
 * Orquestador principal de la aplicación electoral.
 * Integra los módulos de Votación, Auditoría, Accesibilidad y Principios de Usabilidad de Nielsen.
 */

const App = {
    currentStep: 1,
    activeVoterDoc: "",
    selectedCandidate: null,
    activeTab: "votante", // 'votante' | 'mesa' | 'tribunal'
    presidentAuthenticated: false,
    padronSearchTerm: "",
    padronFilter: "all", // 'all' | 'voted' | 'pending'
    resetTimer: null,
    countdownSeconds: 12,

    init() {
        this.renderCandidates();
        this.bindEvents();
        this.bindKeypad();
        Accessibility.init();
        this.updateStepView();
        this.updateMesaStats();
    },

    /**
     * Renderiza las tarjetas de candidatos en la pantalla de votación (Paso 2).
     */
    renderCandidates() {
        const grid = document.getElementById("candidates-grid");
        if (!grid) return;

        grid.innerHTML = "";

        CANDIDATES.forEach((cand, index) => {
            const card = document.createElement("article");
            card.className = "candidate-card";
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");
            card.setAttribute("aria-pressed", "false");
            card.setAttribute("data-candidate-id", cand.id);
            card.style.setProperty("--brand-color", cand.colorTheme);

            const isBlank = cand.id === "blank";

            card.innerHTML = `
                <div class="card-badge" style="background-color: ${cand.badgeColor}">
                    ${isBlank ? "OPCIÓN OFICIAL" : `LISTA ${cand.number}`}
                </div>
                <div class="card-image-wrap">
                    <img src="${cand.photo}" alt="Fotografía de ${cand.name}" class="candidate-photo" loading="lazy">
                </div>
                <div class="card-body">
                    <h3 class="candidate-name">${cand.name}</h3>
                    <p class="candidate-party">${cand.party}</p>
                    <p class="candidate-slogan">"${cand.slogan}"</p>
                    
                    <ul class="candidate-proposals" aria-label="Propuestas principales">
                        ${cand.proposals.map(p => `<li>${p}</li>`).join("")}
                    </ul>
                </div>
                <div class="card-footer">
                    <span class="selection-indicator" aria-hidden="true">
                        <span class="indicator-icon">✓</span>
                        <span class="indicator-text">Seleccionar</span>
                    </span>
                    <span class="shortcut-pill" title="Atajo de teclado">[ ${index + 1} ]</span>
                </div>
            `;

            // Selección con clic o tecla Enter/Espacio
            const selectAction = () => this.selectCandidate(cand, card);
            card.addEventListener("click", selectAction);
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectAction();
                }
            });

            grid.appendChild(card);
        });
    },

    /**
     * Asocia todos los eventos de interacción de la interfaz.
     */
    bindEvents() {
        // --- Paso 1: Identificación ---
        const btnVerify = document.getElementById("btn-verify-voter");
        const inputDoc = document.getElementById("input-voter-doc");

        if (btnVerify && inputDoc) {
            btnVerify.addEventListener("click", () => this.handleVerifyVoter());
            inputDoc.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.handleVerifyVoter();
                }
            });
            inputDoc.addEventListener("input", () => this.validateDniInput(false));
            inputDoc.addEventListener("blur", () => {
                if (inputDoc.value.trim().length > 0) {
                    this.validateDniInput(true);
                }
            });
        }

        // Botones de presets rápidos para testing
        document.querySelectorAll(".btn-preset-doc").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const doc = e.currentTarget.getAttribute("data-doc");
                if (doc === "random") {
                    const rnd = Math.floor(30000000 + Math.random() * 15000000).toString();
                    inputDoc.value = `${rnd.substring(0, 2)}.${rnd.substring(2, 5)}.${rnd.substring(5)}`;
                } else if (doc === "38123456") {
                    inputDoc.value = "38.123.456";
                } else if (doc === "41987654") {
                    inputDoc.value = "41-987-654";
                } else {
                    inputDoc.value = doc;
                }
                NielsenFeedback.playSound('select');
                this.validateDniInput(false);
                inputDoc.focus();
            });
        });

        // --- Paso 2: Selección ---
        const btnGoToReview = document.getElementById("btn-goto-review");
        if (btnGoToReview) {
            btnGoToReview.addEventListener("click", () => {
                if (this.selectedCandidate) {
                    this.goToStep(3);
                } else {
                    NielsenFeedback.showToast("Por favor seleccione un candidato o Voto en Blanco antes de continuar.", "warning");
                }
            });
        }

        const btnCancelSelection = document.getElementById("btn-cancel-step2");
        if (btnCancelSelection) {
            btnCancelSelection.addEventListener("click", () => {
                this.resetVoterFlow();
                NielsenFeedback.showToast("Sesión de votación cancelada. Se ha limpiado el documento ingresado.", "info");
            });
        }

        // --- Paso 3: Revisión y Confirmación ---
        // BOTÓN DESHACER (Requisito clave: Advertencia explícita al deshacer)
        const btnUndoVote = document.getElementById("btn-undo-vote");
        if (btnUndoVote) {
            btnUndoVote.addEventListener("click", () => {
                NielsenFeedback.showUndoWarningModal(
                    this.selectedCandidate,
                    // Si confirma deshacer:
                    () => {
                        this.selectedCandidate = null;
                        this.clearSelectionVisuals();
                        this.goToStep(2);
                    },
                    // Si cancela deshacer:
                    () => {
                        NielsenFeedback.showToast("Continuando con la revisión de su elección.", "info");
                    }
                );
            });
        }

        // BOTÓN CONFIRMAR Y EMITIR VOTO
        const btnConfirmVote = document.getElementById("btn-confirm-final-vote");
        if (btnConfirmVote) {
            btnConfirmVote.addEventListener("click", () => this.handleCastVote());
        }

        // --- Paso 4: Finalización ---
        const btnFinish = document.getElementById("btn-finish-vote");
        if (btnFinish) {
            btnFinish.addEventListener("click", () => this.resetVoterFlow());
        }

        // --- Pestañas y Roles de Participantes ---
        document.querySelectorAll(".nav-tab-btn").forEach(tabBtn => {
            tabBtn.addEventListener("click", (e) => {
                const targetTab = e.currentTarget.getAttribute("data-tab");
                this.switchTab(targetTab);
            });
        });

        // --- Autenticación y Gestión de Presidente de Mesa ---
        const btnPresQuickFill = document.getElementById("btn-president-quick-fill");
        if (btnPresQuickFill) {
            btnPresQuickFill.addEventListener("click", () => {
                const inputTable = document.getElementById("input-president-table");
                const inputCode = document.getElementById("input-president-code");
                if (inputTable) inputTable.value = PadronStore.TABLE_NUMBER;
                if (inputCode) inputCode.value = PadronStore.PRESIDENT_CODE;
                NielsenFeedback.playSound('select');
                if (inputCode) inputCode.focus();
            });
        }

        const btnPresLogin = document.getElementById("btn-president-login");
        if (btnPresLogin) {
            btnPresLogin.addEventListener("click", () => this.handlePresidentLogin());
        }

        const inputPresCode = document.getElementById("input-president-code");
        if (inputPresCode) {
            inputPresCode.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.handlePresidentLogin();
                }
            });
        }

        const btnPresLogout = document.getElementById("btn-president-logout");
        if (btnPresLogout) {
            btnPresLogout.addEventListener("click", () => this.handlePresidentLogout());
        }

        // Anular Voto por Voto Cantado
        const btnOpenAnnulModal = document.getElementById("btn-annul-cantado");
        const modalAnnul = document.getElementById("annul-modal-overlay");
        const btnCancelAnnul = document.getElementById("btn-cancel-annul");
        const btnConfirmAnnul = document.getElementById("btn-confirm-annul");

        if (btnOpenAnnulModal && modalAnnul) {
            btnOpenAnnulModal.addEventListener("click", () => {
                modalAnnul.classList.remove("hidden");
                modalAnnul.setAttribute("aria-hidden", "false");
                NielsenFeedback.playSound('warning');
                if (btnCancelAnnul) btnCancelAnnul.focus();
            });
        }

        if (btnCancelAnnul && modalAnnul) {
            btnCancelAnnul.addEventListener("click", () => {
                modalAnnul.classList.add("hidden");
                modalAnnul.setAttribute("aria-hidden", "true");
                NielsenFeedback.playSound('select');
            });
        }

        if (btnConfirmAnnul) {
            btnConfirmAnnul.addEventListener("click", () => this.handleConfirmAnnulVote());
        }

        // Búsqueda y Filtros en el Padrón
        const inputPadronSearch = document.getElementById("input-padron-search");
        if (inputPadronSearch) {
            inputPadronSearch.addEventListener("input", (e) => {
                this.padronSearchTerm = e.target.value.trim().toLowerCase();
                this.renderPadronTable();
            });
        }

        const btnClearSearch = document.getElementById("btn-clear-padron-search");
        if (btnClearSearch && inputPadronSearch) {
            btnClearSearch.addEventListener("click", () => {
                inputPadronSearch.value = "";
                this.padronSearchTerm = "";
                this.renderPadronTable();
                inputPadronSearch.focus();
            });
        }

        document.querySelectorAll(".padron-filter-btn").forEach(fBtn => {
            fBtn.addEventListener("click", (e) => {
                document.querySelectorAll(".padron-filter-btn").forEach(b => b.classList.remove("active"));
                e.currentTarget.classList.add("active");
                this.padronFilter = e.currentTarget.getAttribute("data-filter");
                NielsenFeedback.playSound('select');
                this.renderPadronTable();
            });
        });

        // Controles de Mesa / Tribunal
        const btnToggleTable = document.getElementById("btn-toggle-table-state");
        if (btnToggleTable) {
            btnToggleTable.addEventListener("click", () => {
                const newState = ElectionStore.toggleTableState();
                NielsenFeedback.showToast(
                    newState ? "La mesa electoral ha sido ABIERTA." : "La mesa electoral ha sido CERRADA por el Tribunal.",
                    newState ? "success" : "warning"
                );
                this.updateMesaStats();
            });
        }

        const btnResetDemo = document.getElementById("btn-reset-demo");
        if (btnResetDemo) {
            btnResetDemo.addEventListener("click", () => {
                if (confirm("¿Desea restablecer todos los votos de la demostración para comenzar de cero?")) {
                    ElectionStore.resetDemo();
                    NielsenFeedback.showToast("Demostración restablecida con éxito.", "info");
                    this.updateMesaStats();
                    this.resetVoterFlow();
                }
            });
        }
    },

    /**
     * Teclado numérico virtual para quioscos accesibles.
     * Soporta números (0-9), punto (.) y guion (-).
     */
    bindKeypad() {
        const inputDoc = document.getElementById("input-voter-doc");
        if (!inputDoc) return;

        document.querySelectorAll(".keypad-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const key = e.currentTarget.getAttribute("data-key");
                NielsenFeedback.playSound('select');

                if (key === "clear") {
                    inputDoc.value = "";
                    this.validateDniInput(false);
                } else if (key === "backspace") {
                    inputDoc.value = inputDoc.value.slice(0, -1);
                    this.validateDniInput(false);
                } else if (key === "." || key === "-") {
                    const currentVal = inputDoc.value;
                    if (currentVal.length === 0 || /[.\-]$/.test(currentVal)) {
                        this.showDniFeedback("No se puede colocar un punto o guion al inicio ni de forma consecutiva.", "warning");
                        NielsenFeedback.playSound('warning');
                        this.triggerInputShake(inputDoc);
                    } else {
                        inputDoc.value += key;
                        this.validateDniInput(false);
                    }
                } else {
                    // Tecla numérica 0-9
                    const currentDigits = inputDoc.value.replace(/\D/g, "");
                    if (currentDigits.length >= 8) {
                        this.showDniFeedback("⚠️ El DNI no acepta más de 8 números.", "warning");
                        NielsenFeedback.playSound('warning');
                        this.triggerInputShake(inputDoc);
                    } else {
                        inputDoc.value += key;
                        this.validateDniInput(false);
                    }
                }
                inputDoc.focus();
            });
        });
    },

    /**
     * Valida en tiempo real la carga del DNI según las reglas:
     * - No acepta más de 8 números.
     * - Permite números, puntos (.) y guiones (-).
     * - Muestra advertencias claras y visuales ante formato incorrecto.
     * @param {boolean} isSubmission - Si se está intentando avanzar de paso
     * @returns {{ valid: boolean, cleanDigits: string }}
     */
    validateDniInput(isSubmission = false) {
        const inputDoc = document.getElementById("input-voter-doc");
        const feedback = document.getElementById("dni-feedback-msg");
        if (!inputDoc || !feedback) return { valid: false, cleanDigits: "" };

        let val = inputDoc.value;

        // 1. Detectar y filtrar caracteres no permitidos
        if (/[^0-9.\-]/.test(val)) {
            val = val.replace(/[^0-9.\-]/g, "");
            inputDoc.value = val;
            this.showDniFeedback(
                "Solo se permiten números, puntos (.) o guiones (-). Se eliminaron caracteres no válidos.",
                "warning"
            );
            NielsenFeedback.playSound('warning');
            this.triggerInputShake(inputDoc);
        }

        // 2. Limitar a un máximo estricto de 8 números
        const digits = val.replace(/\D/g, "");
        if (digits.length > 8) {
            let count = 0;
            let truncated = "";
            for (let i = 0; i < val.length; i++) {
                const char = val[i];
                if (/\d/.test(char)) {
                    if (count < 8) {
                        truncated += char;
                        count++;
                    }
                } else {
                    truncated += char;
                }
            }
            inputDoc.value = truncated;
            val = truncated;
            this.showDniFeedback(
                "⚠️ El DNI no puede tener más de 8 números.",
                "warning"
            );
            NielsenFeedback.playSound('warning');
            this.triggerInputShake(inputDoc);
        }

        const currentDigits = val.replace(/\D/g, "");

        // 3. Campo vacío
        if (val.trim().length === 0) {
            feedback.classList.add("hidden");
            inputDoc.classList.remove("input-error", "input-success");
            return { valid: false, cleanDigits: "" };
        }

        // 4. Verificación de sintaxis de separadores
        const hasDoubleSymbols = /\.{2,}|-{2,}|\.-|-\./.test(val);
        const startsWithSymbol = /^[.\-]/.test(val);

        if (hasDoubleSymbols || startsWithSymbol) {
            this.showDniFeedback("Formato incorrecto. Evite puntos o guiones al inicio o consecutivos.", "error");
            inputDoc.classList.add("input-error");
            inputDoc.classList.remove("input-success");
            return { valid: false, cleanDigits: currentDigits };
        }

        // 5. Verificación de cantidad de números
        if (currentDigits.length < 7) {
            if (isSubmission) {
                this.showDniFeedback(
                    `⚠️ DNI incompleto: Ingrese 7 u 8 números (actualmente tiene ${currentDigits.length}).`,
                    "error"
                );
                inputDoc.classList.add("input-error");
                inputDoc.classList.remove("input-success");
                this.triggerInputShake(inputDoc);
            } else {
                this.showDniFeedback(
                    `Faltan ${8 - currentDigits.length} número(s) para completar el DNI (mínimo 7).`,
                    "warning"
                );
                inputDoc.classList.remove("input-error", "input-success");
            }
            return { valid: false, cleanDigits: currentDigits };
        } else if (currentDigits.length >= 7 && currentDigits.length <= 8) {
            this.showDniFeedback(
                `✓ DNI con formato válido (${currentDigits.length} números ingresados).`,
                "success"
            );
            inputDoc.classList.remove("input-error");
            inputDoc.classList.add("input-success");
            return { valid: true, cleanDigits: currentDigits };
        }

        return { valid: false, cleanDigits: currentDigits };
    },

    /**
     * Despliega el aviso visual bajo el campo de DNI.
     */
    showDniFeedback(message, type) {
        const feedback = document.getElementById("dni-feedback-msg");
        if (!feedback) return;

        feedback.className = `dni-feedback-msg dni-feedback-${type}`;
        const icons = {
            warning: "⚠️",
            error: "🚫",
            success: "✅"
        };
        feedback.innerHTML = `<span aria-hidden="true">${icons[type] || "ℹ️"}</span> <span>${message}</span>`;
        feedback.classList.remove("hidden");
    },

    /**
     * Aplica animación de sacudida visual ante error.
     */
    triggerInputShake(inputElement) {
        inputElement.classList.remove("input-error-shake");
        void inputElement.offsetWidth;
        inputElement.classList.add("input-error-shake");
    },

    /**
     * Valida la habilitación del votante y su unicidad.
     */
    async handleVerifyVoter() {
        const inputDoc = document.getElementById("input-voter-doc");
        const docValue = inputDoc ? inputDoc.value.trim() : "";

        // Validar DNI antes de proceder
        const validation = this.validateDniInput(true);
        if (!validation.valid) {
            NielsenFeedback.playSound('error');
            NielsenFeedback.showToast(
                "DNI incorrecto: Debe tener 7 u 8 números válidos.",
                "error"
            );
            inputDoc.focus();
            return;
        }

        // Feedback de verificación en curso
        const btnVerify = document.getElementById("btn-verify-voter");
        btnVerify.disabled = true;
        btnVerify.innerHTML = `Verificando en padrón anónimo...`;

        const check = await ElectionStore.checkVoter(docValue);

        btnVerify.disabled = false;
        btnVerify.innerHTML = `Ingresar al Cuarto Oscuro &rarr;`;

        if (!check.allowed) {
            this.showDniFeedback(check.reason, "error");
            this.triggerInputShake(inputDoc);
            NielsenFeedback.showToast(check.reason, "error", 6000);
            return;
        }

        // Votante habilitado
        this.activeVoterDoc = docValue;
        NielsenFeedback.showToast("Votante habilitado. CERO datos personales almacenados en sistema.", "success");
        this.goToStep(2);
    },

    /**
     * Maneja la selección visual de una boleta.
     */
    selectCandidate(candidate, cardElement) {
        this.selectedCandidate = candidate;
        NielsenFeedback.playSound('select');

        // Actualizar estados visuales de las tarjetas
        document.querySelectorAll(".candidate-card").forEach(c => {
            c.classList.remove("selected");
            c.setAttribute("aria-pressed", "false");
            const indicatorText = c.querySelector(".indicator-text");
            if (indicatorText) indicatorText.textContent = "Seleccionar";
        });

        cardElement.classList.add("selected");
        cardElement.setAttribute("aria-pressed", "true");
        const activeText = cardElement.querySelector(".indicator-text");
        if (activeText) activeText.textContent = "Seleccionado";

        // Habilitar botón de continuar a revisión
        const btnGoToReview = document.getElementById("btn-goto-review");
        if (btnGoToReview) {
            btnGoToReview.disabled = false;
            btnGoToReview.classList.remove("btn-disabled");
            btnGoToReview.focus();
        }

        NielsenFeedback.showToast(`Ha seleccionado: ${candidate.name}`, "info", 2000);
    },

    clearSelectionVisuals() {
        document.querySelectorAll(".candidate-card").forEach(c => {
            c.classList.remove("selected");
            c.setAttribute("aria-pressed", "false");
            const indicatorText = c.querySelector(".indicator-text");
            if (indicatorText) indicatorText.textContent = "Seleccionar";
        });

        const btnGoToReview = document.getElementById("btn-goto-review");
        if (btnGoToReview) {
            btnGoToReview.disabled = true;
            btnGoToReview.classList.add("btn-disabled");
        }
    },

    /**
     * Emite el voto final tras la pantalla de revisión.
     */
    async handleCastVote() {
        if (!this.activeVoterDoc || !this.selectedCandidate) {
            NielsenFeedback.showToast("Error de sesión: Datos de votación incompletos.", "error");
            this.goToStep(1);
            return;
        }

        const btnConfirm = document.getElementById("btn-confirm-final-vote");
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = `Depositando en urna digital...`;

        const result = await ElectionStore.castVote(this.activeVoterDoc, this.selectedCandidate.id);

        btnConfirm.disabled = false;
        btnConfirm.innerHTML = `Confirmar e Ingresar a Urna &check;`;

        if (result.success) {
            NielsenFeedback.playSound('confirm');
            this.showReceiptScreen(result.receipt);
            this.goToStep(4);
            this.updateMesaStats();
            this.updatePresidentView();
        } else {
            NielsenFeedback.showToast(result.message || "No fue posible registrar el voto.", "error");
        }
    },

    /**
     * Muestra la pantalla de comprobante anónimo y temporizador seguro de limpieza.
     */
    showReceiptScreen(receiptCode) {
        const receiptElem = document.getElementById("receipt-token-display");
        if (receiptElem) {
            receiptElem.textContent = receiptCode;
        }

        // Iniciar temporizador de reseteo para el siguiente votante
        if (this.resetTimer) clearInterval(this.resetTimer);
        this.countdownSeconds = 12;
        
        const countdownSpan = document.getElementById("reset-countdown");
        if (countdownSpan) countdownSpan.textContent = this.countdownSeconds.toString();

        this.resetTimer = setInterval(() => {
            this.countdownSeconds--;
            if (countdownSpan) countdownSpan.textContent = this.countdownSeconds.toString();

            if (this.countdownSeconds <= 0) {
                clearInterval(this.resetTimer);
                this.resetVoterFlow();
            }
        }, 1000);
    },

    /**
     * Limpia la sesión del votante para el siguiente elector.
     */
    resetVoterFlow() {
        if (this.resetTimer) clearInterval(this.resetTimer);
        this.activeVoterDoc = "";
        this.selectedCandidate = null;
        
        const inputDoc = document.getElementById("input-voter-doc");
        if (inputDoc) {
            inputDoc.value = "";
            inputDoc.classList.remove("input-error", "input-success", "input-error-shake");
        }

        const feedback = document.getElementById("dni-feedback-msg");
        if (feedback) feedback.classList.add("hidden");

        this.clearSelectionVisuals();
        this.goToStep(1);
        NielsenFeedback.showToast("Mesa lista para el siguiente votante.", "info");
    },

    /**
     * Cambia de paso en el flujo de votación con transición y actualización de barra de pasos.
     */
    goToStep(stepNumber) {
        this.currentStep = stepNumber;
        this.updateStepView();

        if (stepNumber === 3) {
            this.renderReviewSummary();
        }
    },

    /**
     * Actualiza la visibilidad de pantallas y los indicadores de paso (Heurística #1).
     */
    updateStepView() {
        // Ocultar todos los pasos y mostrar solo el activo
        document.querySelectorAll(".step-panel").forEach(panel => {
            panel.classList.add("hidden");
            panel.setAttribute("aria-hidden", "true");
        });

        const activePanel = document.getElementById(`step-${this.currentStep}`);
        if (activePanel) {
            activePanel.classList.remove("hidden");
            activePanel.setAttribute("aria-hidden", "false");
        }

        // Actualizar barra de progreso de pasos
        document.querySelectorAll(".stepper-item").forEach(item => {
            const stepNum = parseInt(item.getAttribute("data-step"), 10);
            item.classList.remove("active", "completed");

            if (stepNum === this.currentStep) {
                item.classList.add("active");
                item.setAttribute("aria-current", "step");
            } else if (stepNum < this.currentStep) {
                item.classList.add("completed");
                item.removeAttribute("aria-current");
            } else {
                item.removeAttribute("aria-current");
            }
        });

        window.scrollTo({ top: 0, behavior: "auto" });
    },

    /**
     * Renderiza el resumen visual en el Paso 3 (Reconocimiento antes que recuerdo).
     */
    renderReviewSummary() {
        const container = document.getElementById("review-summary-card");
        if (!container || !this.selectedCandidate) return;

        const cand = this.selectedCandidate;
        const isBlank = cand.id === "blank";

        container.innerHTML = `
            <div class="review-card-inner" style="border-top: 6px solid ${cand.colorTheme}">
                <div class="review-image-col">
                    <img src="${cand.photo}" alt="${cand.name}" class="review-photo">
                </div>
                <div class="review-details-col">
                    <span class="review-badge" style="background-color: ${cand.badgeColor}">
                        ${isBlank ? "OPCIÓN OFICIAL" : `LISTA ${cand.number}`}
                    </span>
                    <h2 class="review-name">${cand.name}</h2>
                    <p class="review-party">${cand.party}</p>
                    <p class="review-slogan">"${cand.slogan}"</p>
                    <div class="review-alert-box">
                        <span class="review-alert-icon">ℹ️</span>
                        <span>Verifique que sea la opción deseada. Podrá deshacer su voto si desea cambiarlo.</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Cambia entre pestañas de Votante, Presidente de Mesa y Tribunal.
     */
    switchTab(tabId) {
        this.activeTab = tabId;

        document.querySelectorAll(".nav-tab-btn").forEach(btn => {
            const isTarget = btn.getAttribute("data-tab") === tabId;
            btn.classList.toggle("active", isTarget);
            btn.setAttribute("aria-selected", isTarget.toString());
        });

        document.querySelectorAll(".tab-content-section").forEach(sec => {
            sec.classList.add("hidden");
            sec.setAttribute("aria-hidden", "true");
        });

        const targetSec = document.getElementById(`tab-content-${tabId}`);
        if (targetSec) {
            targetSec.classList.remove("hidden");
            targetSec.setAttribute("aria-hidden", "false");
        }

        NielsenFeedback.playSound('select');

        if (tabId === "mesa") {
            const loginPanel = document.getElementById("president-login-panel");
            const dashPanel = document.getElementById("president-dashboard-panel");
            if (this.presidentAuthenticated) {
                if (loginPanel) loginPanel.classList.add("hidden");
                if (dashPanel) dashPanel.classList.remove("hidden");
                this.updatePresidentView();
            } else {
                if (loginPanel) loginPanel.classList.remove("hidden");
                if (dashPanel) dashPanel.classList.add("hidden");
            }
        } else if (tabId === "tribunal") {
            this.updateMesaStats();
        }
    },

    /**
     * Valida el acceso del Presidente de Mesa.
     */
    handlePresidentLogin() {
        const inputTable = document.getElementById("input-president-table");
        const inputCode = document.getElementById("input-president-code");
        const feedback = document.getElementById("president-login-feedback");

        const tableVal = inputTable ? inputTable.value.trim() : "";
        const codeVal = inputCode ? inputCode.value.trim() : "";

        if (!tableVal || !codeVal) {
            if (feedback) {
                feedback.className = "dni-feedback-msg dni-feedback-warning";
                feedback.innerHTML = `<span>⚠️</span> <span>Por favor, ingrese el número de mesa y el código de verificación.</span>`;
                feedback.classList.remove("hidden");
            }
            NielsenFeedback.playSound('warning');
            return;
        }

        const isValid = PadronStore.authenticate(tableVal, codeVal);

        if (!isValid) {
            if (feedback) {
                feedback.className = "dni-feedback-msg dni-feedback-error";
                feedback.innerHTML = `<span>🚫</span> <span>Credenciales no válidas. Verifique el número de mesa (${PadronStore.TABLE_NUMBER}) y el código (${PadronStore.PRESIDENT_CODE}).</span>`;
                feedback.classList.remove("hidden");
            }
            if (inputCode) this.triggerInputShake(inputCode);
            NielsenFeedback.playSound('error');
            return;
        }

        // Login exitoso
        this.presidentAuthenticated = true;
        if (feedback) feedback.classList.add("hidden");

        const loginPanel = document.getElementById("president-login-panel");
        const dashPanel = document.getElementById("president-dashboard-panel");
        if (loginPanel) loginPanel.classList.add("hidden");
        if (dashPanel) dashPanel.classList.remove("hidden");

        NielsenFeedback.playSound('confirm');
        NielsenFeedback.showToast(`Bienvenido/a. Sesión de Presidente de Mesa ${PadronStore.TABLE_NUMBER} iniciada.`, "success");
        this.updatePresidentView();
    },

    /**
     * Cierra la sesión del Presidente de Mesa.
     */
    handlePresidentLogout() {
        this.presidentAuthenticated = false;

        const inputCode = document.getElementById("input-president-code");
        if (inputCode) inputCode.value = "";

        const loginPanel = document.getElementById("president-login-panel");
        const dashPanel = document.getElementById("president-dashboard-panel");
        if (loginPanel) loginPanel.classList.remove("hidden");
        if (dashPanel) dashPanel.classList.add("hidden");

        NielsenFeedback.playSound('select');
        NielsenFeedback.showToast("Sesión de Presidente de Mesa finalizada.", "info");
    },

    /**
     * Registra la anulación de un voto por infracción de Voto Cantado.
     */
    handleConfirmAnnulVote() {
        const selectReason = document.getElementById("select-annul-reason");
        const reason = selectReason ? selectReason.value : "Voto Cantado / Infracción electoral";

        const modalAnnul = document.getElementById("annul-modal-overlay");
        if (modalAnnul) {
            modalAnnul.classList.add("hidden");
            modalAnnul.setAttribute("aria-hidden", "true");
        }

        const res = ElectionStore.annulVote(reason);

        NielsenFeedback.playSound('confirm');
        NielsenFeedback.showToast(`Voto anulado formalmente en la urna (${reason}).`, "warning", 5000);

        this.updateMesaStats();
        this.updatePresidentView();
    },

    /**
     * Actualiza la vista completa del panel de Presidente de Mesa.
     */
    async updatePresidentView() {
        this.updateMesaStats();
        await this.renderPadronTable();
    },

    /**
     * Renderiza el Padrón oficial de la mesa y muestra qué personas ya votaron.
     * CERO información sobre la preferencia electoral (secreto absoluto del voto).
     */
    async renderPadronTable() {
        const tableBody = document.getElementById("padron-table-body");
        const statsPill = document.getElementById("padron-stats-pill");
        if (!tableBody) return;

        const electors = await PadronStore.getRollWithStatus();
        const totalElectors = electors.length;
        const votedElectors = electors.filter(e => e.hasVoted).length;
        const turnoutPct = totalElectors > 0 ? ((votedElectors / totalElectors) * 100).toFixed(1) : "0.0";

        if (statsPill) {
            statsPill.textContent = `${votedElectors} / ${totalElectors} votaron (${turnoutPct}%)`;
        }

        // Filtrado por estado (todos, ya votaron, pendientes) y búsqueda por texto
        let filtered = electors.filter(e => {
            if (this.padronFilter === "voted" && !e.hasVoted) return false;
            if (this.padronFilter === "pending" && e.hasVoted) return false;

            if (this.padronSearchTerm) {
                const term = this.padronSearchTerm;
                const matchName = e.name.toLowerCase().includes(term);
                const matchDni = e.dni.includes(term) || e.formattedDni.includes(term);
                if (!matchName && !matchDni) return false;
            }

            return true;
        });

        tableBody.innerHTML = "";

        if (filtered.length === 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td colspan="5" class="empty-list-note">
                    No se encontraron electores que coincidan con la búsqueda o el filtro seleccionado.
                </td>
            `;
            tableBody.appendChild(tr);
            return;
        }

        filtered.forEach(elector => {
            const tr = document.createElement("tr");
            const statusHtml = elector.hasVoted
                ? `<span class="badge-voted">✓ VOTÓ</span>`
                : `<span class="badge-pending">⏳ PENDIENTE</span>`;

            tr.innerHTML = `
                <td style="font-weight: 700; color: var(--text-muted);">#${elector.order}</td>
                <td><strong>${elector.name}</strong></td>
                <td><code style="color: #67e8f9; font-weight: 700;">${elector.formattedDni}</code></td>
                <td><span style="color: var(--text-secondary);">${elector.gender}</span></td>
                <td style="text-align: center;">${statusHtml}</td>
            `;
            tableBody.appendChild(tr);
        });
    },

    /**
     * Renderiza la tarjeta destacada con la estadística de la opción más votada.
     */
    renderMostVotedOption(results) {
        const container = document.getElementById("most-voted-highlight-card");
        if (!container) return;

        if (results.totalVotes === 0) {
            container.className = "most-voted-card is-empty";
            container.innerHTML = `
                <div style="font-size: 32px; margin-bottom: 6px;" aria-hidden="true">🗳️</div>
                <h4 style="font-size: 1.15rem; font-weight: 700; color: #ffffff;">Urna sin sufragios registrados aún</h4>
                <p style="font-size: 0.9rem; margin-top: 4px;">A medida que los electores voten en la mesa, aquí se exhibirá la opción líder y la estadística de la preferencia mayoritaria.</p>
            `;
            return;
        }

        const leader = results.leaderInfo;

        if (!leader) {
            container.className = "most-voted-card is-empty";
            container.innerHTML = `<p>Sin datos computados.</p>`;
            return;
        }

        if (leader.isTie) {
            container.className = "most-voted-card";
            container.innerHTML = `
                <div class="most-voted-header">
                    <span class="tie-badge">⚖️ EMPATE EN EL PRIMER LUGAR</span>
                    <span style="font-size: 0.85rem; color: #38bdf8; font-weight: 700;">Misma cantidad de sufragios</span>
                </div>
                <div class="leader-main-content">
                    <div class="leader-name-group">
                        <h4>${leader.tiedNames}</h4>
                        <p class="leader-party">Opciones igualadas en la preferencia del escrutinio</p>
                    </div>
                    <div class="leader-stats-group">
                        <span class="leader-pct">${leader.percentage}%</span>
                        <span class="leader-votes">(${leader.votes} votos cada una)</span>
                    </div>
                </div>
            `;
        } else {
            container.className = "most-voted-card";
            container.innerHTML = `
                <div class="most-voted-header">
                    <span class="leader-badge">🏆 OPCIÓN MÁS VOTADA DE LA MESA</span>
                    <span style="font-size: 0.85rem; color: #f59e0b; font-weight: 700;">Líder de la elección</span>
                </div>
                <div class="leader-main-content">
                    <div class="leader-name-group">
                        <h4>${leader.option.name}</h4>
                        <p class="leader-party">${leader.option.party} ${leader.option.number !== '---' ? `(Lista ${leader.option.number})` : ''}</p>
                    </div>
                    <div class="leader-stats-group">
                        <span class="leader-pct">${leader.percentage}%</span>
                        <span class="leader-votes">(${leader.votes} de ${results.totalVotes} votos)</span>
                    </div>
                </div>
                <div class="leader-margin-note">
                    ${leader.marginVotes > 0 
                      ? `📈 Registra una ventaja de <strong>+${leader.marginVotes} voto(s)</strong> por encima de la siguiente opción más votada.` 
                      : `Opción con registro mayoritario en la urna digital.`}
                </div>
            `;
        }
    },

    /**
     * Actualiza las estadísticas y datos de auditoría de la mesa.
     */
    updateMesaStats() {
        const results = ElectionStore.getResults();
        const rollSize = PadronStore ? PadronStore.DEFAULT_ELECTORS.length : 15;
        const turnoutPct = ((results.totalVotes / rollSize) * 100).toFixed(1);

        // 1. Estadísticas numéricas
        const statTotal = document.getElementById("stat-total-votes");
        const statTurnout = document.getElementById("stat-turnout-pct");
        const statRemaining = document.getElementById("stat-roll-size");
        const statHashed = document.getElementById("stat-hashed-voters");
        const tableStatusBadge = document.getElementById("table-status-badge");
        const btnToggleTable = document.getElementById("btn-toggle-table-state");

        if (statTotal) statTotal.textContent = results.totalVotes.toString();
        if (statTurnout) statTurnout.textContent = `${turnoutPct}%`;
        if (statRemaining) statRemaining.textContent = rollSize.toString();
        if (statHashed) statHashed.textContent = results.hashedVotersCount.toString();

        if (tableStatusBadge) {
            tableStatusBadge.textContent = results.isOpen ? "MESA ABIERTA" : "MESA CERRADA";
            tableStatusBadge.className = `status-pill ${results.isOpen ? "status-open" : "status-closed"}`;
        }

        if (btnToggleTable) {
            btnToggleTable.textContent = results.isOpen ? "Cerrar Mesa Electoral" : "Reabrir Mesa Electoral";
            btnToggleTable.className = `btn ${results.isOpen ? "btn-danger" : "btn-primary"}`;
        }

        // 2. Estadística destacada de la opción más votada
        this.renderMostVotedOption(results);

        // 3. Gráfico de barras de escrutinio
        const resultsContainer = document.getElementById("scrutiny-results-bars");
        if (resultsContainer) {
            resultsContainer.innerHTML = "";
            results.breakdown.forEach(item => {
                const row = document.createElement("div");
                row.className = "scrutiny-bar-row";
                row.innerHTML = `
                    <div class="scrutiny-label">
                        <strong>${item.name}</strong> (${item.party})
                        <span class="scrutiny-count">${item.votes} votos (${item.percentage}%)</span>
                    </div>
                    <div class="scrutiny-bar-track">
                        <div class="scrutiny-bar-fill" style="width: ${item.percentage}%; background-color: ${item.colorTheme}"></div>
                    </div>
                `;
                resultsContainer.appendChild(row);
            });
        }

        // 4. Padrón de Hashes Anónimos (Tribunal)
        const hashesList = document.getElementById("hashes-audit-list");
        if (hashesList) {
            const state = ElectionStore.getState();
            hashesList.innerHTML = "";
            if (state.hashedVoters.length === 0) {
                hashesList.innerHTML = `<li class="empty-list-note">Aún no se han registrado sufragios en esta mesa.</li>`;
            } else {
                state.hashedVoters.forEach((hash, idx) => {
                    const li = document.createElement("li");
                    li.className = "hash-item";
                    li.innerHTML = `
                        <span class="hash-index">#${idx + 1}</span>
                        <code class="hash-code">${hash}</code>
                        <span class="hash-badge">Voto único registrado (Sin datos personales)</span>
                    `;
                    hashesList.appendChild(li);
                });
            }
        }

        // 5. Urna Desacoplada (Tribunal)
        const ballotsList = document.getElementById("ballots-audit-list");
        if (ballotsList) {
            const state = ElectionStore.getState();
            ballotsList.innerHTML = "";
            if (state.ballotBox.length === 0) {
                ballotsList.innerHTML = `<li class="empty-list-note">La urna digital está vacía.</li>`;
            } else {
                state.ballotBox.forEach((b, idx) => {
                    const cand = CANDIDATES.find(c => c.id === b.candidateId);
                    const li = document.createElement("li");
                    li.className = "ballot-audit-item";
                    li.innerHTML = `
                        <span class="ballot-id">Token: <strong>${b.receiptId}</strong></span>
                        <span class="ballot-choice" style="color: ${cand ? cand.colorTheme : '#333'}">
                            Opción: <strong>${cand ? cand.name : b.candidateId}</strong>
                        </span>
                        <span class="ballot-time">${new Date(b.timestamp).toLocaleTimeString()}</span>
                    `;
                    ballotsList.appendChild(li);
                });
            }
        }
    }
};

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
