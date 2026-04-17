import type { Transcription } from "@/types/transcription";

const TOTAL_DURATION_MS = 492_000; // 8min 12s

const TURNS_TEXT = [
  {
    speakerId: "s1",
    text: "Estamos aquí reunidos en virtud de un caso que tiene el número 78274. La fiscalía está trabajando la investigación de ese caso, para lo cual estaba prevista la discusión de los hechos como corresponde en un juicio oral y público para ver si corresponde o no que las personas respondamos penalmente. Hasta ese momento resultamos todas las personas inocentes. Lo que me hicieron saber es que usted tenía una pretensión, y es que se analice la posibilidad de que el caso no avance y se efectúe ese juicio oral y público a resultas de un ofrecimiento.",
  },
  {
    speakerId: "s2",
    text: "Nosotros lo que solicitamos es la suspensión del presente juicio a prueba en la primera parte del artículo 76 del código penal. A los efectos de la suspensión lo que propuso mi cliente fue el pago de 100.000 pesos en cuatro cuotas de 25.000 pesos, además de las pautas que considere la fiscalía respecto de la suspensión.",
  },
  {
    speakerId: "s1",
    text: "Tiene alguna propuesta más allá de que las pautas obviamente están supeditadas a que la fiscalía pueda fundar respecto de los hechos y los objetivos?",
  },
  {
    speakerId: "s2",
    text: "Nosotros habíamos pensado en un tipo de tarea comunitaria por un período. No tenemos una propuesta concreta, pero habíamos analizado la posibilidad de que sean 16 horas totales en el año.",
  },
  {
    speakerId: "s1",
    text: "Señor Rodríguez, le voy a pedir que se acerque al micrófono lo más posible. Dígame su nombre completo, su DNI, su fecha de nacimiento, su género y dónde vive.",
  },
];

export function buildFixture(file: File): Transcription {
  const sliceMs = TOTAL_DURATION_MS / TURNS_TEXT.length;

  const turns = TURNS_TEXT.map((t, i) => ({
    id: crypto.randomUUID(),
    speakerId: t.speakerId,
    text: t.text,
    startMs: Math.round(i * sliceMs),
    endMs: Math.round((i + 1) * sliceMs),
  }));

  return {
    id: crypto.randomUUID(),
    title: "Audiencia 10/04/2025",
    audioFileName: file.name,
    audioDurationMs: TOTAL_DURATION_MS,
    audioObjectUrl: URL.createObjectURL(file),
    createdAt: new Date().toISOString(),
    speakers: [
      { id: "s1", label: "Locutor 1", initials: "L1", color: "primary" },
      { id: "s2", label: "Locutor 2", initials: "L2", color: "secondary" },
    ],
    turns,
  };
}
