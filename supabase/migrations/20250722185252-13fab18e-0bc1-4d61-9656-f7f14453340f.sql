
-- Add foreign key constraints to establish proper relationships
ALTER TABLE public.client_funnel_position 
ADD CONSTRAINT fk_client_funnel_position_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.client_funnel_position 
ADD CONSTRAINT fk_client_funnel_position_stage_id 
FOREIGN KEY (stage_id) REFERENCES public.sales_funnel_stages(id) ON DELETE CASCADE;

ALTER TABLE public.client_interactions 
ADD CONSTRAINT fk_client_interactions_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.client_interactions 
ADD CONSTRAINT fk_client_interactions_seller_id 
FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.message_templates 
ADD CONSTRAINT fk_message_templates_stage_id 
FOREIGN KEY (stage_id) REFERENCES public.sales_funnel_stages(id) ON DELETE SET NULL;

ALTER TABLE public.automated_tasks 
ADD CONSTRAINT fk_automated_tasks_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.automated_tasks 
ADD CONSTRAINT fk_automated_tasks_seller_id 
FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.automated_tasks 
ADD CONSTRAINT fk_automated_tasks_trigger_stage_id 
FOREIGN KEY (trigger_stage_id) REFERENCES public.sales_funnel_stages(id) ON DELETE SET NULL;

ALTER TABLE public.automated_tasks 
ADD CONSTRAINT fk_automated_tasks_template_id 
FOREIGN KEY (template_id) REFERENCES public.message_templates(id) ON DELETE SET NULL;
