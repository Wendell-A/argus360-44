-- Deletar os templates existentes para evitar duplicatas
DELETE FROM message_templates 
WHERE name IN (
  'Felicitações de Aniversário',
  'Atrasos no Pagamento', 
  'Lembrete de Vencimentos',
  'Contemplações'
);

-- Inserir os novos templates para todos os tenants existentes
INSERT INTO message_templates (tenant_id, name, template_text, category, variables, is_active)
SELECT 
  t.id as tenant_id,
  template_data.name,
  template_data.template_text,
  'whatsapp' as category,
  template_data.variables,
  true as is_active
FROM tenants t
CROSS JOIN (
  VALUES 
    (
      'Felicitações de Aniversário',
      'Olá {cliente_nome}! 🎉

Hoje é um dia muito especial - seu aniversário! 🎂

A equipe da {empresa_nome} gostaria de desejar um feliz aniversário e muitas felicidades nesta data tão especial.

Que este novo ano de vida seja repleto de:
✨ Conquistas e realizações
💰 Prosperidade financeira  
❤️ Saúde e alegria
🎯 Sonhos alcançados

Aproveitamos para lembrar que estamos sempre aqui para ajudar você a realizar seus objetivos financeiros.

Um grande abraço,
{vendedor_nome}
{empresa_nome}',
      '["cliente_nome", "empresa_nome", "vendedor_nome"]'::jsonb
    ),
    (
      'Atrasos no Pagamento',
      'Olá {cliente_nome}, 

Esperamos que esteja bem! 😊

Notamos que sua parcela com vencimento em {data_vencimento} ainda não foi quitada.

📋 **Detalhes:**
• Valor: R$ {valor_parcela}
• Vencimento: {data_vencimento}
• Dias em atraso: {dias_atraso}

Entendemos que imprevistos podem acontecer. Por favor, entre em contato conosco para:
🔄 Regularizar o pagamento
📞 Negociar condições especiais
💬 Esclarecer dúvidas

Estamos aqui para ajudar você!

Atenciosamente,
{vendedor_nome}
{empresa_nome}',
      '["cliente_nome", "data_vencimento", "valor_parcela", "dias_atraso", "vendedor_nome", "empresa_nome"]'::jsonb
    ),
    (
      'Lembrete de Vencimentos',
      'Olá {cliente_nome}! 😊

Este é um lembrete amigável sobre o vencimento da sua parcela:

📅 **Informações:**
• Valor: R$ {valor_parcela}
• Vencimento: {data_vencimento}
• Dias restantes: {dias_restantes}

Para facilitar seu pagamento, você pode:
🏦 Pagar no banco com o boleto
💳 Via PIX ou cartão
📱 Pelo app do seu banco
🏢 Em nossas lojas físicas

Em caso de dúvidas ou dificuldades, estamos à disposição para conversar e encontrar a melhor solução!

Obrigado,
{vendedor_nome}
{empresa_nome}',
      '["cliente_nome", "valor_parcela", "data_vencimento", "dias_restantes", "vendedor_nome", "empresa_nome"]'::jsonb
    ),
    (
      'Contemplações',
      '🎉 **PARABÉNS {cliente_nome}!** 🎉

Temos uma EXCELENTE notícia para você! 

✨ **VOCÊ FOI CONTEMPLADO!** ✨

📋 **Detalhes da sua contemplação:**
• Grupo: {numero_grupo}
• Cota: {numero_cota}
• Valor do crédito: R$ {valor_credito}
• Data da contemplação: {data_contemplacao}

🚗 Agora você pode realizar o sonho de adquirir seu veículo!

📞 **Próximos passos:**
1. Entre em contato conosco o mais rápido possível
2. Organize sua documentação
3. Escolha seu veículo dos sonhos
4. Vamos finalizar todo o processo juntos!

Este é um momento especial e estamos muito felizes por você! 

Parabéns novamente! 🎊

{vendedor_nome}
{empresa_nome}',
      '["cliente_nome", "numero_grupo", "numero_cota", "valor_credito", "data_contemplacao", "vendedor_nome", "empresa_nome"]'::jsonb
    )
) AS template_data(name, template_text, variables);