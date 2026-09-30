import { NextResponse } from 'next/server';
import { researchNews } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Texte manquant" }, { status: 400 });
    }

    const content = await researchNews(text);

    return NextResponse.json({ content });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erreur go-further:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}

