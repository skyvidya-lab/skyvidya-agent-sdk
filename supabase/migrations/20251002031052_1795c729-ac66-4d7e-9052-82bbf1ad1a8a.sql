-- Corrigir search_path nas funções para resolver warnings de segurança

-- Recriar update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recriar track_report_edits com search_path
CREATE OR REPLACE FUNCTION public.track_report_edits()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se as recomendações foram modificadas e ainda não foram salvas como originais
  IF NEW.recommendations IS DISTINCT FROM OLD.recommendations AND OLD.original_recommendations IS NULL THEN
    NEW.original_recommendations = OLD.recommendations;
    NEW.human_edited = TRUE;
  END IF;
  RETURN NEW;
END;
$$;