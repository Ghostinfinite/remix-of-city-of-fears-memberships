CREATE OR REPLACE FUNCTION public.leaderboard_top(_limit integer DEFAULT 10)
RETURNS TABLE (display_name text, credits integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p.display_name, 'Member') AS display_name, p.credits
  FROM public.profiles p
  WHERE p.is_banned = false
  ORDER BY p.credits DESC, p.created_at ASC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 10), 1), 50);
$$;

REVOKE ALL ON FUNCTION public.leaderboard_top(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leaderboard_top(integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.community_stats()
RETURNS TABLE (members bigint, credits bigint, posts bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.profiles),
    (SELECT COALESCE(sum(credits), 0) FROM public.profiles),
    (SELECT count(*) FROM public.forum_posts WHERE is_removed = false);
$$;

REVOKE ALL ON FUNCTION public.community_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.community_stats() TO anon, authenticated;