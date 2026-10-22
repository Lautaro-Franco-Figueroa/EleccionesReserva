/**
 * candidates.js
 * Definición oficial de candidatos de prueba para la elección a Intendente.
 * Diseñado bajo el principio de Nielsen: Reconocimiento antes que recuerdo (fotos, listas, colores).
 */

const CANDIDATES = [
    {
        id: "cand-1",
        number: "101",
        name: "Dra. Valeria Gómez",
        party: "Frente Ciudadano y Futuro",
        slogan: "Innovación, Salud y Participación Vecinal",
        photo: "assets/candidate1.svg",
        colorTheme: "#2563eb",
        badgeColor: "#1d4ed8",
        proposals: [
            "Modernización integral de centros de salud barriales",
            "Plan de transporte público ecológico e interconectado",
            "Presupuesto participativo y gobierno abierto digital"
        ]
    },
    {
        id: "cand-2",
        number: "202",
        name: "Ing. Roberto Martínez",
        party: "Unión por la Transformación",
        slogan: "Infraestructura, Seguridad y Desarrollo Productivo",
        photo: "assets/candidate2.svg",
        colorTheme: "#059669",
        badgeColor: "#047857",
        proposals: [
            "Pavimentación, iluminación LED y obras pluviales estratégicas",
            "Centro integral de monitoreo y seguridad ciudadana inteligente",
            "Parque tecnológico y fomento al empleo para jóvenes"
        ]
    },
    {
        id: "blank",
        number: "---",
        name: "Voto en Blanco",
        party: "Opción Electoral Institucional",
        slogan: "Manifiesto de abstención de preferencia electoral",
        photo: "assets/blank-vote.svg",
        colorTheme: "#475569",
        badgeColor: "#334155",
        proposals: [
            "Opción válida y oficial prevista por el régimen electoral",
            "Permite manifestar disconformidad o falta de preferencia partidaria"
        ]
    },
    {
        id: "null",
        number: "---",
        name: "Voto Nulo",
        party: "Opción Electoral no Computable",
        slogan: "Emisión deliberada de boleta no computable",
        photo: "assets/null-vote.svg",
        colorTheme: "#b91c1c",
        badgeColor: "#991b1b",
        proposals: [
            "Expresa la anulación formal del sufragio por decisión del elector",
            "Registrado en el acta oficial de escrutinio como voto nulo"
        ]
    }
];

if (typeof module !== "undefined" && module.exports) {
    module.exports = { CANDIDATES };
}
