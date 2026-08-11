// Endpoint de calculo: ejecuta el motor de valuacion.
// Prueba de integracion web <-> @nexodirecto/engine.
// (En la version final validara la sesion y persistira ResultadoCalculo.)
import { NextResponse } from "next/server";
import { valuar, type EngineInput } from "@nexodirecto/engine";

export async function POST(req: Request) {
  try {
    const input = (await req.json()) as EngineInput;
    const resultado = valuar(input);
    return NextResponse.json(resultado);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error de calculo";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
