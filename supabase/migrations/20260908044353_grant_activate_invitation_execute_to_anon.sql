-- La activación corre desde una Server Action sin sesión (padre deslogueado en /activar),
-- así que `anon` necesita EXECUTE sobre la función. La seguridad la da la propia función
-- (SECURITY DEFINER): solo deja pasar si código+email coinciden, está pending y no venció.
-- Se mantiene revocado el acceso para `authenticated` y `public`.
grant execute on function public.activate_invitation(text, text, uuid) to anon;