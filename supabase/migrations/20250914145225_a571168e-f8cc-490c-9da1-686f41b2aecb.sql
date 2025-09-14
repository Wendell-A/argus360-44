-- Grants for public invitation functions to allow anonymous validation and acceptance
-- Date: 2025-09-14

-- Ensure both anon and authenticated roles can execute the RPCs used by the registration flow
GRANT EXECUTE ON FUNCTION public.validate_public_invitation_token(p_token character varying) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_public_invitation(p_token character varying, p_user_id uuid, p_email character varying, p_full_name character varying) TO anon, authenticated;
