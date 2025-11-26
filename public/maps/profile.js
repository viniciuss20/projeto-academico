// Carrega dados do usuário
const savedUser = JSON.parse(localStorage.getItem("usuarioDetalhes")) || {};

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const profilePreview = document.getElementById("profilePreview");
const profileInput = document.getElementById("profileInput");
const removePhotoBtn = document.getElementById("removePhotoBtn");

// Preenche os campos
if (usernameInput) usernameInput.value = savedUser.username || "";
if (emailInput) emailInput.value = savedUser.email || "";
if (profilePreview) profilePreview.src = savedUser.foto || "./public/default-user.png";

// === Atualizar foto de perfil ===
if (profileInput) {
    profileInput.addEventListener("change", () => {
        const file = profileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                profilePreview.src = reader.result;
                savedUser.foto = reader.result;
                localStorage.setItem("usuarioDetalhes", JSON.stringify(savedUser));
            };
            reader.readAsDataURL(file);
        }
    });
}

// === Remover foto ===
if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", () => {
        profilePreview.src = "./public/default-user.png";
        savedUser.foto = "";
        localStorage.setItem("usuarioDetalhes", JSON.stringify(savedUser));
    });
}

// === Salvar nome e email ===
const accountForm = document.getElementById("accountForm");
if (accountForm) {
    accountForm.addEventListener("submit", (e) => {
        e.preventDefault();

        savedUser.username = usernameInput.value;
        savedUser.email = emailInput.value;

        localStorage.setItem("usuarioDetalhes", JSON.stringify(savedUser));

        alert("Informações atualizadas com sucesso!");
        window.location.href = "dashboard.html";
    });
}

// === Atualizar senha ===
const passwordForm = document.getElementById("passwordForm");
if (passwordForm) {
    passwordForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const oldPass = document.getElementById("oldPassword").value;
        const newPass = document.getElementById("newPassword").value;
        const confirmPass = document.getElementById("confirmPassword").value;

        if (oldPass !== savedUser.senha) {
            alert("Senha atual incorreta!");
            return;
        }

        if (newPass !== confirmPass) {
            alert("As novas senhas não coincidem!");
            return;
        }

        savedUser.senha = newPass;
        localStorage.setItem("usuarioDetalhes", JSON.stringify(savedUser));

        alert("Senha atualizada com sucesso!");
        window.location.href = "dashboard.html";
    });
}
