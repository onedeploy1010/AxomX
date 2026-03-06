-- =============================================
-- 010: Fix referral binding for existing users
-- Previously, if a user connected wallet without ref code first,
-- they could never bind a referrer later. This fix allows binding
-- referrer_id when it's still NULL.
-- =============================================

CREATE OR REPLACE FUNCTION auth_wallet(addr TEXT, ref_code TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result profiles%ROWTYPE;
  referrer_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO result FROM profiles WHERE wallet_address = addr;

  -- Resolve referrer if ref_code provided
  IF ref_code IS NOT NULL AND ref_code != '' THEN
    SELECT * INTO referrer_profile FROM profiles WHERE profiles.ref_code = auth_wallet.ref_code;
  END IF;

  IF result.id IS NOT NULL THEN
    -- Existing user: bind referrer if not yet bound and referrer is valid
    IF result.referrer_id IS NULL AND referrer_profile.id IS NOT NULL AND referrer_profile.id != result.id THEN
      UPDATE profiles SET referrer_id = referrer_profile.id WHERE id = result.id
      RETURNING * INTO result;
    END IF;
    RETURN to_jsonb(result);
  END IF;

  -- New user: create profile with referrer
  INSERT INTO profiles (wallet_address, referrer_id)
  VALUES (addr, referrer_profile.id)
  RETURNING * INTO result;

  RETURN to_jsonb(result);
END;
$$;
