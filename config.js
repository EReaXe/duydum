// Public browser configuration. Never put secret/service_role keys here.
window.DUYDUM_CONFIG = Object.freeze({
  supabaseUrl: 'https://binissqzmhxnqlftwlnj.supabase.co',
  authRedirectUrl: location.protocol === 'file:' ? 'http://localhost:3000/' : new URL('./', document.baseURI).href,
  publishableKey: 'sb_publishable_BMXsENQwxJ4spXNxcYKasQ_F_DouE4r'
});
