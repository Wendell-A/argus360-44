-- Inserir novos templates de WhatsApp para CRM
INSERT INTO message_templates (
  name, 
  category, 
  template_text, 
  variables, 
  is_active,
  tenant_id
) VALUES 
(
  'Felicitações de Aniversário',
  'whatsapp',
  'Olá {cliente_nome}! 🎉

Hoje é um dia muito especial e não poderíamos deixar passar em branco!

A equipe da nossa empresa deseja um FELIZ ANIVERSÁRIO para você! 🎂✨

Que este novo ano de vida seja repleto de realizações, saúde, prosperidade e muitas alegrias ao lado de quem você mais ama.

Aproveitamos para reafirmar nosso compromisso em estar sempre ao seu lado, oferecendo as melhores soluções para seus objetivos.

Mais uma vez, PARABÉNS! 🥳

Atenciosamente,
{vendedor_nome}',
  ARRAY['cliente_nome', 'vendedor_nome'],
  true,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Atrasos no Pagamento',
  'whatsapp',
  'Olá {cliente_nome}, 

Esperamos que esteja tudo bem com você e sua família.

Entramos em contato para informar que identificamos um atraso no pagamento de sua parcela, que tinha vencimento em [DATA DO VENCIMENTO].

Sabemos que imprevistos podem acontecer, e estamos aqui para ajudá-lo a regularizar sua situação da melhor forma possível.

💡 *Opções para regularização:*
• Quitação imediata com condições especiais
• Negociação de nova data de vencimento
• Parcelamento do valor em atraso

Nossa equipe está à disposição para encontrar a melhor solução para seu caso.

Entre em contato conosco o quanto antes para evitar maiores complicações.

Atenciosamente,
{vendedor_nome}',
  ARRAY['cliente_nome', 'vendedor_nome'],
  true,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Lembrete de Vencimentos',
  'whatsapp',
  'Olá {cliente_nome}! 

Esperamos que tenha uma excelente semana! 😊

Este é um lembrete amigável sobre o vencimento de sua parcela no dia [DATA DE VENCIMENTO].

📋 *Informações importantes:*
• Valor: R$ [VALOR DA PARCELA]
• Vencimento: [DATA DE VENCIMENTO]
• Referência: [MÊS/ANO]

Para sua comodidade, você pode realizar o pagamento através de:
💳 PIX
🏦 Transferência bancária
💰 Boleto bancário (solicite o 2ª via se necessário)

Caso já tenha efetuado o pagamento, desconsidere esta mensagem.

Se tiver alguma dúvida ou precisar de qualquer esclarecimento, estamos à disposição.

Agradecemos pela confiança! 🙏

Atenciosamente,
{vendedor_nome}',
  ARRAY['cliente_nome', 'vendedor_nome'],
  true,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Contemplações',
  'whatsapp',
  '🎉 PARABÉNS {cliente_nome}! 🎉

Temos uma EXCELENTE notícia para compartilhar com você!

✨ *VOCÊ FOI CONTEMPLADO!* ✨

Sua cota do consórcio foi sorteada/lanceada com sucesso no grupo [NÚMERO DO GRUPO]!

📋 *Próximos passos:*
1️⃣ Documentação necessária será enviada em breve
2️⃣ Agendamento da análise de crédito
3️⃣ Liberação do seu crédito

Nossa equipe entrará em contato nas próximas horas para orientá-lo sobre todo o processo e documentação necessária.

Este é o momento que você tanto esperava! Agora você está mais próximo de realizar seu sonho! 🏠🚗

Ficamos muito felizes em fazer parte desta conquista especial na sua vida!

Em caso de dúvidas, não hesite em nos procurar.

Atenciosamente,
{vendedor_nome}

*Equipe [NOME DA EMPRESA]*',
  ARRAY['cliente_nome', 'vendedor_nome'],
  true,
  '00000000-0000-0000-0000-000000000000'
);