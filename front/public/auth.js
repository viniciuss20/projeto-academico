// URL do backend - AJUSTE AQUI SE NECESSÁRIO
const API_URL = 'https://projeto-academico-production.up.railway.app';

// Função para mostrar mensagens
function showMessage(message, type = 'error') {
  const messageDiv = document.getElementById('message');
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    messageDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    messageDiv.style.color = type === 'success' ? '#155724' : '#721c24';
    messageDiv.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`;
  } else {
    alert(message);
  }
}

// ==================== REGISTRO ====================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const terms = document.getElementById('terms').checked;

    // Validações
    if (!email || !username || !password) {
      showMessage('Preencha todos os campos!');
      return;
    }

    if (!terms) {
      showMessage('Você precisa aceitar os termos de uso!');
      return;
    }

    if (password.length < 6) {
      showMessage('A senha deve ter no mínimo 6 caracteres!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Conta criada com sucesso! Redirecionando...', 'success');
        
        // Salvar token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirecionar para o dashboard após 1.5 segundos
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1500);
      } else {
        showMessage(data.message || 'Erro ao criar conta. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro:', error);
      showMessage('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
    }
  });
}

// ==================== LOGIN ====================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember')?.checked || false;

    // Validações
    if (!email || !password) {
      showMessage('Preencha todos os campos!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Login realizado com sucesso! Redirecionando...', 'success');
        
        // Salvar token e dados do usuário
        if (remember) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Redirecionar para o dashboard após 1 segundo
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1000);
      } else {
        showMessage(data.message || 'Email ou senha incorretos!');
      }
    } catch (error) {
      console.error('Erro:', error);
      showMessage('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
    }
  });
}

// ==================== PROTEÇÃO DO DASHBOARD ====================
// Verifica se o usuário está autenticado (para páginas protegidas)
function checkAuth() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token && window.location.pathname.includes('dashboard')) {
    window.location.href = '/login.html';
    return false;
  }
  
  return true;
}

// ==================== CARREGAR DADOS DO USUÁRIO ====================
function loadUserData() {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      
      // Preencher campos se existirem na página
      const emailInput = document.getElementById('emailInput');
      const nomeInput = document.getElementById('nomeInput');
      const sobrenomeInput = document.getElementById('sobrenomeInput');
      const usernameDisplay = document.getElementById('usernameDisplay');
      
      if (emailInput) emailInput.value = user.email || '';
      if (nomeInput) nomeInput.value = user.nome || '';
      if (sobrenomeInput) sobrenomeInput.value = user.sobrenome || '';
      if (usernameDisplay) usernameDisplay.textContent = user.username || 'Usuário';
      
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  }
}

// ==================== ATUALIZAR DADOS DA CONTA ====================
const accountForm = document.getElementById('accountForm');
if (accountForm) {
  // Carregar dados ao abrir a página
  loadUserData();
  
  accountForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('emailInput').value.trim();
    const nome = document.getElementById('nomeInput').value.trim();
    const sobrenome = document.getElementById('sobrenomeInput').value.trim();
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, nome, sobrenome }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Dados atualizados com sucesso!', 'success');
        
        // Atualizar localStorage
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
        user.email = data.user.email;
        user.nome = data.user.nome;
        user.sobrenome = data.user.sobrenome;
        
        if (localStorage.getItem('token')) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('user', JSON.stringify(user));
        }
      } else {
        showMessage(data.message || 'Erro ao atualizar dados.');
      }
    } catch (error) {
      console.error('Erro:', error);
      showMessage('Erro ao conectar com o servidor.');
    }
  });
}

// ==================== ALTERAR SENHA ====================
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Validações
    if (newPassword !== confirmPassword) {
      showMessage('As senhas não coincidem!');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('A nova senha deve ter no mínimo 6 caracteres!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Senha alterada com sucesso!', 'success');
        
        // Limpar campos
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
      } else {
        showMessage(data.message || 'Erro ao alterar senha.');
      }
    } catch (error) {
      console.error('Erro:', error);
      showMessage('Erro ao conectar com o servidor.');
    }
  });
}

// ==================== LOGOUT ====================
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Adicionar evento ao botão de logout se existir
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

// Executar verificação de autenticação ao carregar a página
if (window.location.pathname.includes('dashboard') || 
    window.location.pathname.includes('manage-account') || 
    window.location.pathname.includes('change-password')) {
  checkAuth();
  loadUserData();
}