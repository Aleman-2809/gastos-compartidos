export const grupoEjemplo = {
  nombre: "Paseo a Guatapé",
  miembros: { ana: "Ana", beto: "Beto", caro: "Caro", dani: "Dani" } as Record<string, string>,
  gastos: [
    {
      id: "1",
      descripcion: "Alojamiento",
      pagadorUid: "ana",
      montoCentavos: 40000000,
      participantes: ["ana", "beto", "caro", "dani"],
    },
    {
      id: "2",
      descripcion: "Mercado",
      pagadorUid: "beto",
      montoCentavos: 18000000,
      participantes: ["ana", "beto", "caro", "dani"],
    },
    {
      id: "3",
      descripcion: "Transporte",
      pagadorUid: "caro",
      montoCentavos: 9000000,
      participantes: ["ana", "caro", "dani"],
    },
  ],
};
