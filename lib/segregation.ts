import type { WasteCategory } from "./waste";

export const SEGREGATION_MAP: Record<
  string,
  { bin: string; note: string }
> = {
  plastic: { bin: "Dry / Recyclable", note: "Empty, rinse if possible, keep dry. Hand to dry-waste collector or recycling point." },
  paper: { bin: "Dry / Recyclable", note: "Keep dry and clean. Soiled paper goes to reject waste." },
  metal: { bin: "Dry / Recyclable", note: "Rinse food residue. Scrap dealers / dry-waste centres accept metals." },
  glass: { bin: "Dry / Recyclable", note: "Wrap broken glass safely, label it, keep separate." },
  ewaste: { bin: "E-waste (separate)", note: "Never mix with general waste. Use authorised e-waste collection." },
  organic: { bin: "Wet / Organic", note: "Compostable. Keep separate from dry waste; compost or wet-waste collection." },
  textile: { bin: "Dry / Donate-Reuse", note: "Clean reusable textiles can be donated; soiled goes to reject." },
  construction: { bin: "C&D waste (separate)", note: "Do not dump roadside. Use designated C&D collection points." },
  hazardous: { bin: "Hazardous (separate)", note: "Do not handle with bare hands. Report to local hazardous-waste channel." },
  sanitary: { bin: "Sanitary / Reject", note: "Wrap securely and mark. Follow local sanitary-waste guidance." },
  mixed: { bin: "Segregate first", note: "Mixed contaminated waste: separate dry/recyclable fraction where safe." },
  debris: { bin: "Reject / Bulk", note: "Sweep, bag, and use bulk-waste pickup where available." },
};

export function segregationFor(categories: WasteCategory[]): string {
  const lines = categories.map((c) => {
    const s = SEGREGATION_MAP[c] ?? SEGREGATION_MAP.debris;
    return `${c} → ${s.bin}: ${s.note}`;
  });
  return (
    lines.join("\n") +
    "\nLocal waste segregation rules may vary by municipality. Follow local guidance."
  );
}
