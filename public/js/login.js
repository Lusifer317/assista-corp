'use strict';

(() => {
  const loginForm = document.getElementById('login-form');
  const authAlert = document.getElementById('auth-alert');
  const mfaGroup = document.getElementById('mfa-group');
  const totpInput = document.getElementById('totp_code');
  const loginBtn = document.getElementById('login-btn');

  if (!loginForm || !authAlert || !mfaGroup || !totpInput || !loginBtn) return;

  let mfaRequired = false;

  function showAlert(message, type = 'error') {
    authAlert.textContent = message;
    authAlert.className = `auth-alert ${type}`;
    authAlert.style.display = 'block';
  }

  function setBusy(isBusy) {
    loginBtn.disabled = isBusy;
    if (isBusy) {
      loginBtn.textContent = 'Verifying credentials…';
    } else {
      loginBtn.textContent = mfaRequired ? 'Verify code & sign in →' : 'Sign in to Operations →';
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authAlert.style.display = 'none';
    setBusy(true);

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const totp_code = totpInput.value.trim();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, totp_code })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error('The authentication service returned an unexpected response. Please contact your administrator.');
      }

      if (response.ok && data.mfa_required === true) {
        mfaRequired = true;
        mfaGroup.style.display = 'block';
        totpInput.required = true;
        showAlert('Multi-factor authentication is required. Enter the current 6-digit code from your authenticator app.', 'info');
        setBusy(false);
        totpInput.focus();
        return;
      }

      if (response.ok && data.success === true) {
        loginBtn.textContent = 'Opening Operations Portal…';
        window.location.assign('/admin');
        return;
      }

      showAlert(data.error || 'Sign-in failed. Check your credentials and try again.');
      setBusy(false);
      if (mfaRequired) totpInput.focus();
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Unable to reach the authentication service. Please try again.');
      setBusy(false);
    }
  });
})();
