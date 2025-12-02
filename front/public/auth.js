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
        
        // Salvar dados do usuário (sem token por enquanto)
        localStorage.setItem('user', JSON.stringify({
          email: email,
          username: username
        }));
        
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
        
        // Salvar dados do usuário
        if (remember) {
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
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
  const user = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  if (!user && (window.location.pathname.includes('dashboard') || 
                 window.location.pathname.includes('manage-account') || 
                 window.location.pathname.includes('change-password'))) {
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
      
      // ✅ CORRIGIDO: Username aparece no campo Nome
      if (emailInput) emailInput.value = user.email || '';
      if (nomeInput) nomeInput.value = user.username || ''; // ← USERNAME vai para NOME
      if (sobrenomeInput) sobrenomeInput.value = user.sobrenome || '';
      if (usernameDisplay) usernameDisplay.textContent = user.username || 'Usuário';
      
      // Também atualizar o sidebar se existir
      const userNameSidebar = document.querySelector('.user-name');
      if (userNameSidebar) userNameSidebar.textContent = user.username || 'Usuário';
      
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

    try {
      // Por enquanto, apenas atualizar localmente
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const user = JSON.parse(userStr);
      
      user.email = email;
      user.username = nome; // Salvar como username
      user.sobrenome = sobrenome;
      
      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        sessionStorage.setItem('user', JSON.stringify(user));
      }
      
      showMessage('Dados atualizados com sucesso!', 'success');
      
    } catch (error) {
      console.error('Erro:', error);
      showMessage('Erro ao atualizar dados.');
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

    // Validações
    if (newPassword !== confirmPassword) {
      showMessage('As senhas não coincidem!');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('A nova senha deve ter no mínimo 6 caracteres!');
      return;
    }

    showMessage('Funcionalidade de alteração de senha em desenvolvimento.', 'success');
    
    // Limpar campos
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  });
}

// ==================== LOGOUT ====================
function logout() {
  localStorage.removeItem('user');
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