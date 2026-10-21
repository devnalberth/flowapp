// Presentation only: preserve stored project colors and map the six choices to tokens.
const PROJECT_COLORS = {
  ff9500: "brasa",
  ff7a00: "brasa",
  ff6e02: "brasa",
  laranja: "brasa",
  "007aff": "azul",
  "3b82f6": "azul",
  "3d6fe0": "azul",
  azul: "azul",
  "34c759": "verde",
  "16a34a": "verde",
  "1f9d55": "verde",
  verde: "verde",
  ff2d55: "rosa",
  e03e7b: "rosa",
  rosa: "rosa",
  af52de: "violeta",
  "8b5cf6": "violeta",
  "8b55e0": "violeta",
  roxo: "violeta",
  "8e8e93": "tinta",
  "5f5a54": "tinta",
  cinza: "tinta",
};
export const projectColorToken = (value) =>
  `var(--fa-p-${
    PROJECT_COLORS[
      String(value || "")
        .replace("#", "")
        .toLowerCase()
    ] || "brasa"
  }-500)`;
