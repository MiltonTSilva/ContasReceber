/* import { createClient } from "npm:@supabase/supabase-js";
import { createTransport } from "npm:nodemailer";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Configuração do transporte
const transporter = createTransport({
  service: "Gmail",
  auth: {
    user: Deno.env.get("SMTP_USER") ?? "",
    pass: Deno.env.get("SMTP_PASS") ?? "",
  },
});

// Função principal

const hoje = new Date();
const daquiDoisDias = new Date();
daquiDoisDias.setDate(hoje.getDate() + 2);
const dataFinalLocal = daquiDoisDias.toLocaleDateString("sv-SE");

// Buscar no Supabase
const { data: registros } = await supabase.from("accounts_receivable_view")
  .select("*").eq("received_date", dataFinalLocal).eq(
    "receive_billing_email",
    true,
  );

for (const registro of registros ?? []) {
  if (registro && !registro.email_send) {
    await transporter.sendMail({
      from: "miltontsilva@gmail.com",
      to: registro.email,
      subject: "Lembrete de pagamento",
      text:
        `Olá ${registro.name}, queremos lembrar que faltam 2 dias para o pagamento de sua aula de inglês.

      \n Qualquer dúvida entrar em contato com Teacher Lethicya (11) 94580-4260`,
    });
    await supabase.from("accounts_receivable").update({
      email_send: true,
    }).eq("id", registro.id);
  }
}
 */
