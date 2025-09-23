-- Corrigir tenant_id dos novos templates para o tenant correto
UPDATE message_templates 
SET tenant_id = 'a93f441e-db89-40ac-9954-cca5a415fdc4'
WHERE name IN (
  'Felicitações de Aniversário',
  'Atrasos no Pagamento', 
  'Lembrete de Vencimentos',
  'Contemplações'
) 
AND tenant_id = '00000000-0000-0000-0000-000000000000';