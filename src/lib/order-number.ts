import { prisma } from "@/lib/prisma";

// Human-readable sequential order numbers (PRD §6). nextval() is race-free and
// never rolls back, so gaps can appear — that is fine and expected.
export async function nextOrderNumber(): Promise<string> {
  const [row] = await prisma.$queryRaw<[{ nextval: bigint }]>`SELECT nextval('order_number_seq')`;
  return `MT-${row.nextval.toString().padStart(6, "0")}`;
}
