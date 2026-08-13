import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Corrige o item Iron Bamboo: a conclusao anterior ("sem fonte encontrada")
// estava errada - achei a geracao real dentro de ParadisChunkGenerator
// (generateIronBambooPatches/generateIronBambooPatch), so nao tinha
// procurado nesse arquivo especifico antes. Mecanismo real, decompilado:
// grid de 200x200 blocos, 20% de chance por celula, so dentro do bioma
// Giant Forest, prefere nascer em musgo, evita copa de arvore.
export async function POST(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key || key !== process.env.DOWNLOAD_PASSWORD) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing service role env" }, { status: 500 });
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: itemData, error: itemError } = await admin
    .from("items")
    .update({
      location: {
        dimension: "Paradis",
        biome: "Giant Forest (só esse bioma — fica bem longe do centro do mapa, fora do Muro Maria)",
        method: "Nasce em patches raros gerados junto com o terreno: mundo dividido numa grade de 200x200 blocos, só 20% das células tentam um patch, e só conta se cair dentro do Giant Forest. Dentro do patch (raio 8-16 blocos), prefere nascer em cobertura de musgo (chance bem maior que em grama comum) e evita ficar embaixo de copa de árvore. Uma fração já nasce crescida, o resto cresce com tempo/luz solar.",
        alternative: "Se não quiser caçar, peça pra um operador dar via /give <nick> dannys-aot:iron_bamboo.",
      },
      notes: "Correção: uma pesquisa anterior nossa concluiu errado que esse item não tinha fonte nenhuma — a geração existe, só é rara e fica embutida direto no gerador de chunk customizado do Paradis (não aparece em loot table nem feature de bioma comuns, por isso passou despercebido na primeira checagem).",
    })
    .eq("slug", "iron-bamboo")
    .select("slug");

  const { data: problemData, error: problemError } = await admin
    .from("common_problems")
    .update({
      question: "Onde eu acho Iron Bamboo pra fazer Ultrahard Steel?",
      causes: [
        "A geração é rara de propósito: grade de 200x200 blocos, 20% de chance por célula, só dentro do bioma Giant Forest (que fica bem longe do centro do mapa).",
      ],
      solution: "Vá até o bioma Giant Forest e procure clareiras com musgo no chão, sem árvore por cima — é onde a chance de spawn é maior. Se não quiser caçar, peça pra um operador dar via /give <nick> dannys-aot:iron_bamboo.",
    })
    .eq("question", "Onde eu acho/consigo Iron Bamboo pra fazer Ultrahard Steel?")
    .select("id");

  return NextResponse.json({ ok: true, item: { data: itemData, error: itemError }, problem: { data: problemData, error: problemError } });
}
