import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Rota temporaria de admin — mesmo padrao de sempre. Dessa vez: o Deilton
// testou no servidor de verdade (nao vem de datapack, e relato de teste
// real) que Elytrian nao consegue usar ODM Gear de jeito nenhum, nenhum
// tipo. O tip antigo dava a entender que era uma escolha ("quer os dois
// sistemas juntos?") quando na pratica nem da pra tentar.
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

  const { data, error } = await admin
    .from("origins")
    .update({
      weaknesses: [
        {
          title: "Armadura leve",
          impact: "Só pode usar armaduras leves — peças mais protetoras ficam fora de alcance, limitando o teto de defesa.",
        },
        {
          title: "Não usa ODM Gear",
          impact: "Testado no servidor: não equipa/usa o ODM Gear de jeito nenhum, nenhuma peça — incompatibilidade total com essa origem, não é so questão de preferência.",
        },
        {
          title: "Claustrofobia",
          impact: "Sofre penalidade em espaços fechados/apertados — cavernas estreitas e masmorras viram desafio extra.",
        },
        {
          title: "Mais dano cinético",
          impact: "Recebe mais dano de queda/impacto que o normal — precisa administrar melhor os pousos.",
        },
      ],
      not_recommended_for:
        "Quem quer usar o ODM Gear (incompatível com essa origem — testado, não funciona nenhuma peça), pretende passar muito tempo em masmorras/cavernas fechadas, ou quer usar armadura pesada.",
      tip:
        "Elytrian e ODM Gear não se combinam — testado no servidor, nenhuma peça do ODM funciona com essa origem. Se seu plano era usar o ODM Gear, escolhe outra origem (ou nenhuma) e deixa a elytra do Elytrian pra quem realmente vai voar sem o gancho.",
    })
    .eq("slug", "elytrian")
    .select("slug");

  return NextResponse.json({ ok: true, data, error });
}
