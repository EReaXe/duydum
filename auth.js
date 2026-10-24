/* Supabase Auth: SDK yerel dosyadan yüklenir; yalnız hesap işlemleri ağ kullanır. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  let client, mode = 'login', busy = false, currentUser = null, accountRevision = 0;
  const dialog = byId('auth-dialog');
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  window.DuydumAuth = { ready, getClient: () => client, getUser: () => currentUser };

  const message = text => { byId('auth-message').textContent = text; };
  function renderUser(user) {
    accountRevision++;
    currentUser = user;
    const name = user?.user_metadata?.display_name || (user ? 'Oyuncu' : 'Misafir oyuncu');
    // Metadata yalnız gösterim içindir; yetki veya skor doğrulamasında kullanılmaz.
    document.querySelectorAll('[data-player-name]').forEach(el => { el.textContent = name; });
    document.querySelectorAll('[data-player-avatar]').forEach(el => { el.textContent = name.charAt(0).toLocaleUpperCase('tr'); });
    byId('account-name').textContent = name;
    byId('open-login').hidden = !!user;
    byId('open-signup').hidden = !!user;
    byId('logout').hidden = !user;
    byId('open-profile').hidden = !user;
    const color = ['pink','green','yellow','purple'].includes(user?.user_metadata?.avatar_color) ? user.user_metadata.avatar_color : 'green';
    document.querySelectorAll('[data-player-avatar]').forEach(el => { el.dataset.avatar = color; });
    window.dispatchEvent(new CustomEvent('duydum:account', { detail: { user } }));
  }
  function setMode(next) {
    mode = next;
    const signup = mode === 'signup';
    byId('auth-title').textContent = signup ? 'Sahneye katıl!' : 'Tekrar hoş geldin!';
    byId('auth-submit').textContent = signup ? 'Hesap oluştur →' : 'Giriş yap →';
    byId('auth-switch').textContent = signup ? 'Hesabın var mı? Giriş yap' : 'Yeni misin? Hesap oluştur';
    byId('auth-name-row').hidden = !signup;
    byId('auth-password-confirm-row').hidden = !signup;
    byId('auth-name').required = signup;
    byId('auth-password-confirm').required = signup;
    byId('auth-password').minLength = signup ? 8 : 1;
    byId('auth-password').autocomplete = signup ? 'new-password' : 'current-password';
    byId('auth-mode-note').textContent = signup ? 'Oyuncu adını, e-postanı ve şifreni yaz; sahneye katıl.' : 'E-posta adresin ve şifrenle devam et.';
    message('');
  }
  function open(next) {
    if (busy) return;
    byId('auth-form').reset();
    setMode(next);
    if (!dialog.open) dialog.showModal();
    (mode === 'signup' ? byId('auth-name') : byId('auth-email')).focus();
    if (location.protocol === 'file:') message('Hesap işlemleri için başlat komutuyla localhost:3000 üzerinden aç. Misafir solo dosyadan çalışır.');
  }
  function errorText(error) {
    const code = error?.code;
    if (code === 'invalid_credentials') return 'E-posta veya şifre hatalı.';
    if (code === 'email_not_confirmed') return 'Önce e-postandaki doğrulama bağlantısını açmalısın.';
    if (code === 'user_already_exists') return 'Bu e-postayla kayıtlı bir hesap olabilir. Giriş yapmayı dene.';
    if (code === 'weak_password') return 'Daha güçlü bir şifre seç: en az 8 karakter kullan.';
    if (error?.status === 429 || /rate.limit/i.test(code || '')) return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.';
    if (code === 'email_address_invalid') return 'Geçerli bir e-posta adresi yaz.';
    if (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError) return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.';
    return 'İşlem tamamlanamadı. Bilgilerini kontrol edip tekrar dene.';
  }
  function lock(value) {
    busy = value;
    byId('auth-form').querySelectorAll('input, button').forEach(el => { el.disabled = value; });
    byId('auth-close').disabled = value;
  }
  byId('open-login').addEventListener('click', () => open('login'));
  byId('open-signup').addEventListener('click', () => open('signup'));
  byId('auth-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  byId('auth-switch').addEventListener('click', () => { if (!busy) { byId('auth-form').reset(); setMode(mode === 'login' ? 'signup' : 'login'); } });
  byId('auth-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !byId('auth-form').reportValidity()) return;
    if (!client) { message('Hesap bağlantısı hazırlanamadı. Sayfayı yenileyip tekrar dene.'); return; }
    if (location.protocol === 'file:') { message('Kayıt ve giriş için başlat komutuyla http://localhost:3000 adresini aç.'); return; }
    const email = byId('auth-email').value.trim();
    const password = byId('auth-password').value;
    const name = byId('auth-name').value.trim();
    if (mode === 'signup' && name.length < 2) { message('Görünen adın en az 2 karakter olmalı.'); return; }
    if (mode === 'signup' && password !== byId('auth-password-confirm').value) { message('Şifreler eşleşmiyor.'); return; }
    lock(true); message('Bir saniye, bağlantı kuruluyor…');
    try {
      const result = mode === 'signup'
        ? await client.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: window.DUYDUM_CONFIG.authRedirectUrl } })
        : await client.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      byId('auth-password').value = ''; byId('auth-password-confirm').value = '';
      if (result.data.session) { renderUser(result.data.user); dialog.close(); }
      else message('Kayıt isteğin alındı. E-postandaki doğrulama bağlantısını aç, ardından giriş yap. Gelen kutusunu ve spam klasörünü kontrol et.');
    } catch (error) { message(errorText(error)); }
    finally { lock(false); }
  });
  byId('logout').addEventListener('click', async () => {
    if (!client || busy) return;
    busy = true; byId('logout').disabled = true;
    try {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      renderUser(null);
    } catch { openAfterLogoutError(); }
    finally { busy = false; byId('logout').disabled = false; }
  });
  function openAfterLogoutError() {
    if (!dialog.open) dialog.showModal();
    message('Çıkış tamamlanamadı. Bağlantını kontrol edip tekrar dene.');
  }
  async function initialize() {
    renderUser(null);
    let verificationEpoch = null;
    try {
      const config = window.DUYDUM_CONFIG;
      client = window.supabase.createClient(config.supabaseUrl, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'duydum-auth-v1' }
      });
      client.auth.onAuthStateChange((_event, session) => { renderUser(session?.user || null); });
      const sessionEpoch = accountRevision;
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data.session) {
        if (sessionEpoch !== accountRevision && currentUser?.id !== data.session.user.id) return;
        verificationEpoch = accountRevision;
        const verified = await client.auth.getUser();
        if (verificationEpoch !== accountRevision) return;
        if (verified.error) throw verified.error;
        renderUser(verified.data.user);
      }
      const params = new URLSearchParams(location.hash.slice(1));
      if (params.has('error_description')) { open('login'); message('E-posta doğrulama bağlantısı geçersiz veya süresi dolmuş olabilir.'); history.replaceState(null, '', location.pathname); }
    } catch { if (verificationEpoch === null ? !currentUser : verificationEpoch === accountRevision) renderUser(null); }
    finally { resolveReady(); }
  }
  initialize();
})();
