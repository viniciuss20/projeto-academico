// ===============================
//  AUTH SIMPLES (FRONT-END ONLY)
// ===============================

// Redirecionar após login
if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Preencha todos os campos");
            return;
        }

        // Aqui você pode validar com backend depois.
        // Por enquanto apenas redireciona:
        window.location.href = "dashboard.html";
    });
}

// Redirecionar após cadastro
if (document.getElementById("registerForm")) {
    document.getElementById("registerForm").addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !username || !password) {
            alert("Preencha todos os campos");
            return;
        }

        // Aqui você pode integrar com backend depois.
        // Por enquanto apenas redireciona:
        window.location.href = "login.html";
    });
}
