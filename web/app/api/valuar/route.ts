// Endpoint de cálculo directo del motor. Requiere sesión (evita abuso de CPU).
import { NextResponse } from "next/server";
import { valuar, type EngineInput } from "@nexodirecto/engine";
import { getUserId } from "@/lib/session";

export async function POST(req: Request) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const input = (await req.json()) as EngineInput;
    const resultado = valuar(input);
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[api/valuar] error", err);
    return NextResponse.json({ error: "No se pudo calcular." }, { status: 400 });
  }
}
