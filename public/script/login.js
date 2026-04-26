document.addEventListener('DOMContentLoaded', () => {
    // Seleziona il form di login e l'area per i messaggi di feedback.
    const loginForm = document.getElementById('loginForm');
    const messageArea = document.getElementById('loginMessageArea');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Impedisce il ricaricamento della pagina.
            const email = loginForm.loginEmail.value;
            const password = loginForm.loginPassword.value;

            // Fornisce un feedback visivo all'utente durante l'attesa.
            if (messageArea) {
                messageArea.textContent = 'Autenticazione in corso...';
                messageArea.className = 'form-message-area info';
            }

            try {
                // Invia le credenziali all'endpoint API /api/login.
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                // Gestisce la risposta del server.
                if (response.ok && data.success) {
                    messageArea.textContent = data.message;
                    messageArea.className = 'form-message-area success';
                    
                    // Dopo un breve ritardo, reindirizza l'utente alla pagina appropriata in base al suo ruolo
                    setTimeout(() => {
                        if (!data.user || !data.user.ruolo) {
                            window.location.href = '/';
                            return;
                        }
                        switch (data.user.ruolo) {
                            case 'admin':
                                window.location.href = '/visualizza_messaggi_admin.html';
                                break;
                            case 'erogatore':
                                window.location.href = '/gestione_viaggi.html';
                                break;
                            case 'fruitore':
                                window.location.href = '/viaggi.html';
                                break;
                            default:
                                window.location.href = '/';
                        }
                    }, 1500);
                } else {
                    // Se il login fallisce, mostra il messaggio di errore
                    messageArea.textContent = data.message || 'Errore del server.';
                    messageArea.className = 'form-message-area error';
                }
            } catch (error) {
                messageArea.textContent = 'Errore di connessione.';
                messageArea.className = 'form-message-area error';
            }
        });
    }
});