-- ============================================================
-- i-tafa : amélioration complète de la messagerie
-- ============================================================

-- Modification d'un message
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited_at timestamptz NULL;

-- Réponse à un message
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS reply_to_id uuid NULL;

-- Transfert d'un message
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS forwarded_from_id uuid NULL;

-- Commentaire ajouté lors d'un transfert
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS forward_comment text NULL;

-- Réactions emoji
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS reactions jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Index pour les réponses/transferts
CREATE INDEX IF NOT EXISTS messages_reply_to_id_idx
ON public.messages(reply_to_id);

CREATE INDEX IF NOT EXISTS messages_forwarded_from_id_idx
ON public.messages(forwarded_from_id);

-- ============================================================
-- Realtime
-- ============================================================

-- Vérifie que la table messages est bien dans la publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime
    ADD TABLE public.messages;
  END IF;
END
$$;