import environment from '../../config/environment';

export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const getCSRFToken = () => {
  const tokenName = environment.security.csrfTokenName;
  let token = sessionStorage.getItem(tokenName);
  
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem(tokenName, token);
  }
  
  return token;
};

export const attachCSRFToken = (headers = {}) => {
  const token = getCSRFToken();
  const tokenName = environment.security.csrfTokenName;
  
  return {
    ...headers,
    [tokenName]: token
  };
};

export const getCSRFTokenFromForm = (formElement) => {
  const input = formElement?.querySelector(`input[name="${environment.security.csrfTokenName}"]`);
  return input?.value || getCSRFToken();
};

export const validateCSRFToken = (token, sessionToken) => {
  if (!token || !sessionToken) {
    return false;
  }
  return token === sessionToken;
};
