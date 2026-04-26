
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const messageArea = document.getElementById('registerMessageArea');

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const nome = registerForm.registerNome.value;
            const email = registerForm.registerEmail.value;
            const password = registerForm.registerPassword.value;
            const confirmPassword = registerForm.registerConfirmPassword.value;

            if (password !== confirmPassword) {
                messageArea.textContent = 'Le password non coincidono.';
                messageArea.className = 'form-message-area error';
                return;
            }

            messageArea.textContent = 'Registrazione in corso...';
            messageArea.className = 'form-message-area info';

            try {
                // Invia i dati di registrazione all'API.
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, password, confirmPassword })
                });

                const result = await response.json();

                if (response.ok) {
                     // Se la registrazione ha successo, informa l'utente e lo reindirizza al login.
                    messageArea.textContent = result.message + ' Verrai reindirizzato al login.';
                    messageArea.className = 'form-message-area success';
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                } else {
                    messageArea.textContent = result.message || 'Errore sconosciuto.';
                    messageArea.className = 'form-message-area error';
                }
            } catch (error) {
                messageArea.textContent = 'Errore di connessione con il server.';
                messageArea.className = 'form-message-area error';
            }
        });
    }
});