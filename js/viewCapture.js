/**
 * viewCapture.js
 * Asistente para captura automatizada de estados visuales del sistema para documentación oficial.
 * Lee el parámetro ?view= de la URL y configura la interfaz de forma determinista y real.
 */

window.addEventListener("load", () => {
    // Desactivar animaciones y transiciones CSS para captura determinista instantánea
    const noAnimStyle = document.createElement("style");
    noAnimStyle.id = "no-anim-capture-style";
    noAnimStyle.innerHTML = "*, *::before, *::after { transition: none !important; animation: none !important; }";
    document.head.appendChild(noAnimStyle);

    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.scrollBehavior = "auto";

    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (!view) return;

    // Función síncrona para sembrar votos y padrón realista en localStorage
    function seedSampleVotesSync() {
        const hashedVoters = [
            "6699b89b6e3ddc3bad15270f77b561f475b6a65566137282e08440ac311dd14e",
            "1217b31e4ebf47a259a957a94a06aaf395420079d6a1befde08403f06973e483",
            "059bf01828a34c6a624e489b74b1569be2099c4d16528f0d1ae9d7c01b91cb99",
            "3b0c70f4c264f7e4884a77ce4c7c82f974af39aff6206aa758f4d25b5b3ec018",
            "e3547f6c3587c0a9218317f2bf340936c92df1ceae1f49acc70256cb1603f248",
            "5305efc33f271873ca3a8ab388cf427561108fffb9b0be07881fdcf17ce25174",
            "498dd0c70501b2653746cca12f915e1cd3c00d67b7d5297d206cf486c97875a0"
        ];
        const ballotBox = [
            { receiptId: "VOTO-9142-J8A1-2026", candidateId: "cand-1", timestamp: new Date(Date.now() - 3600000).toISOString() },
            { receiptId: "VOTO-3329-L1B4-2026", candidateId: "cand-2", timestamp: new Date(Date.now() - 3000000).toISOString() },
            { receiptId: "VOTO-7814-K4C9-2026", candidateId: "cand-1", timestamp: new Date(Date.now() - 2400000).toISOString() },
            { receiptId: "VOTO-4521-M2D8-2026", candidateId: "cand-1", timestamp: new Date(Date.now() - 1800000).toISOString() },
            { receiptId: "VOTO-1980-N7E3-2026", candidateId: "blank",  timestamp: new Date(Date.now() - 1200000).toISOString() },
            { receiptId: "VOTO-6243-P5F2-2026", candidateId: "cand-2", timestamp: new Date(Date.now() - 600000).toISOString() },
            { receiptId: "VOTO-8874-Q9G7-2026", candidateId: "cand-1", timestamp: new Date().toISOString() }
        ];
        // Guardar en los STORAGE_KEYS separados que usa ElectionStore
        localStorage.setItem("elecciones_hashed_voters_v1", JSON.stringify(hashedVoters));
        localStorage.setItem("elecciones_ballot_box_v1", JSON.stringify(ballotBox));
        localStorage.setItem("elecciones_table_state_v1", JSON.stringify(true));
        localStorage.setItem("elecciones_audit_log_v1", JSON.stringify([]));

        // Renderizado síncrono del padrón con electores ya votados y pendientes
        const tableBody = document.getElementById("padron-table-body");
        const statsPill = document.getElementById("padron-stats-pill");
        if (tableBody && PadronStore && PadronStore.DEFAULT_ELECTORS) {
            tableBody.innerHTML = "";
            PadronStore.DEFAULT_ELECTORS.forEach((elector, idx) => {
                const hasVoted = idx < 7;
                const tr = document.createElement("tr");
                tr.className = hasVoted ? "elector-voted-row" : "elector-pending-row";
                tr.innerHTML = `
                    <td style="font-weight: 600; color: var(--text-muted); text-align: center;">#${elector.order}</td>
                    <td><strong>${elector.name}</strong></td>
                    <td><code class="padron-dni-code">${PadronStore.formatDni(elector.dni)}</code></td>
                    <td style="text-align: center;">${elector.gender}</td>
                    <td style="text-align: center;">
                        <span class="status-badge ${hasVoted ? "badge-voted" : "badge-pending"}">
                            ${hasVoted ? "✓ YA VOTÓ" : "⏳ PENDIENTE"}
                        </span>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
            if (statsPill) {
                statsPill.textContent = "7 / 15 votaron (46.7%)";
            }
        }
    }

    switch (view) {
        case "step1":
            App.goToStep(1);
            break;

        case "step1_warning":
            App.goToStep(1);
            const input = document.getElementById("input-voter-doc");
            if (input) {
                input.value = "381234569";
                App.validateDniInput(false);
            }
            break;

        case "step2":
            App.activeVoterDoc = "38123456";
            App.goToStep(2);
            const card = document.querySelector('[data-candidate-id="cand-1"]');
            if (card && typeof CANDIDATES !== "undefined") {
                App.selectCandidate(CANDIDATES[0], card);
            }
            break;

        case "step3":
            App.activeVoterDoc = "38123456";
            App.selectedCandidate = CANDIDATES[0];
            App.goToStep(3);
            break;

        case "step3_warning":
            App.activeVoterDoc = "38123456";
            App.selectedCandidate = CANDIDATES[0];
            App.goToStep(3);
            NielsenFeedback.showUndoWarningModal(
                CANDIDATES[0],
                () => {},
                () => {}
            );
            break;

        case "step4":
            App.showReceiptScreen("VOTO-7842-K9L1-2026");
            App.goToStep(4);
            break;

        case "contrast":
            Accessibility.toggleContrast();
            App.activeVoterDoc = "38123456";
            App.goToStep(2);
            const candCard = document.querySelector('[data-candidate-id="cand-1"]');
            if (candCard && typeof CANDIDATES !== "undefined") {
                App.selectCandidate(CANDIDATES[0], candCard);
            }
            break;

        case "help":
            App.goToStep(1);
            const helpModal = document.getElementById("help-modal-overlay");
            if (helpModal) {
                helpModal.classList.remove("hidden");
                helpModal.setAttribute("aria-hidden", "false");
            }
            break;

        case "mesa_login":
            App.switchTab("mesa");
            const inputTable = document.getElementById("input-president-table");
            const inputCode = document.getElementById("input-president-code");
            if (inputTable) inputTable.value = "042";
            if (inputCode) inputCode.value = "2026";
            break;

        case "mesa_padron":
            seedSampleVotesSync();
            App.switchTab("mesa");
            App.presidentAuthenticated = true;
            document.getElementById("president-login-panel").classList.add("hidden");
            document.getElementById("president-dashboard-panel").classList.remove("hidden");
            App.updateMesaStats();
            break;

        case "mesa_anulacion":
            seedSampleVotesSync();
            App.switchTab("mesa");
            App.presidentAuthenticated = true;
            document.getElementById("president-login-panel").classList.add("hidden");
            document.getElementById("president-dashboard-panel").classList.remove("hidden");
            App.updateMesaStats();
            const annulModal = document.getElementById("annul-modal-overlay");
            if (annulModal) {
                annulModal.classList.remove("hidden");
                annulModal.setAttribute("aria-hidden", "false");
            }
            break;

        case "mesa_escrutinio":
            seedSampleVotesSync();
            App.switchTab("mesa");
            App.presidentAuthenticated = true;
            document.getElementById("president-login-panel").classList.add("hidden");
            document.getElementById("president-dashboard-panel").classList.remove("hidden");
            App.updateMesaStats();
            // Ocultar sección del padrón para mostrar sólo el escrutinio en el viewport
            const padronCard = document.querySelector(".president-section-card");
            if (padronCard) padronCard.style.display = "none";
            break;

        case "tribunal":
            seedSampleVotesSync();
            App.switchTab("tribunal");
            // updateMesaStats populates the audit lists from localStorage
            App.updateMesaStats();
            // switchTab -> updateStepView hides ALL .step-panel including the tribunal one; unhide it
            const tribunalPanel = document.querySelector("#tab-content-tribunal .step-panel");
            if (tribunalPanel) {
                tribunalPanel.classList.remove("hidden");
                tribunalPanel.setAttribute("aria-hidden", "false");
            }
            break;
    }

    if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
    }
    window.scrollTo(0, 0);
});
