document.addEventListener('DOMContentLoaded', async () => {

    let datiUtente = null;
    try {
        const res = await fetch('/api/get-current-user-status');
        datiUtente = await res.json();
    } catch (error) {
        console.error("Errore critico nel fetch dello stato utente:", error);
        datiUtente = { isLoggedIn: false };
    }

    // --- CONFIGURAZIONE DELLA NAVBAR ---
    const loginLink = document.getElementById('loginNav');
    const logoutNavItem = document.getElementById('logoutNav'); 
    const prenotazioni = document.getElementById('miePrenotazioni');
    const Viaggi = document.getElementById('gestioneViaggi');

    if (datiUtente.isLoggedIn) {
        // Logica per utente loggato
        if (logoutNavItem) {
            logoutNavItem.style.display = 'list-item';
            const logoutLink = logoutNavItem.querySelector('a');
            if (logoutLink) {
                logoutLink.addEventListener('click', async (event) => {
                    event.preventDefault();
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.href = '/login.html';
                });
            }
        }
        if (datiUtente.ruolo === 'fruitore' && prenotazioni) {
            prenotazioni.style.display = 'list-item';
        }
        if ((datiUtente.ruolo === 'erogatore' || datiUtente.ruolo === 'admin') && Viaggi) {
            Viaggi.style.display = 'list-item';
        }
    } else {
        // Logica per utente non loggato
        if (loginLink) loginLink.style.display = 'list-item';
    }


    // ---  LOGICA SPECIFICA DELLA PAGINA CONTATTI ---
    const elementoInfoUtente = document.getElementById('infoUserContatti'); 
    const formContatti = document.getElementById('contactForm');            
    const areaMessaggiForm = document.getElementById('contactFormMessageArea'); 
    const titoloPagina = document.getElementById('paginaTitleContatti');
    
    if (datiUtente.isLoggedIn) {
        // Se l'utente è loggato, personalizza la pagina e mostra il form per inviare messaggi.
        if (titoloPagina) {
            titoloPagina.textContent = "Contattaci, " + datiUtente.userName + "!";
        }
        if (elementoInfoUtente) {
            elementoInfoUtente.innerHTML = "<p>Stai inviando questo messaggio come: <strong>" + datiUtente.userName + "</strong></p>";
        }
        if (formContatti) {
            formContatti.style.display = 'block';
            formContatti.addEventListener('submit', async (eventoInvioForm) => {
                eventoInvioForm.preventDefault(); 
                areaMessaggiForm.textContent = 'Invio in corso...';
                areaMessaggiForm.className = 'form-message-area info';
                const oggettoMessaggio = formContatti.contactOggetto.value;
                const testoMessaggio = formContatti.contactMessaggio.value;
                try {
                    const rispostaInvioMsg = await fetch('/api/invia-messaggio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ oggetto: oggettoMessaggio, messaggio: testoMessaggio })
                    });
                    const risultatoInvio = await rispostaInvioMsg.json();
                    areaMessaggiForm.textContent = risultatoInvio.message;
                    
                    if (risultatoInvio.success) {
                        areaMessaggiForm.className = 'form-message-area success';
                        formContatti.reset();  // Pulisce il form dopo l'invio.
                    } else {
                        areaMessaggiForm.className = 'form-message-area error';
                    }
                } catch (erroreInvio) {
                    console.error("Errore durante l'invio del messaggio:", erroreInvio);
                    areaMessaggiForm.textContent = "Errore di connessione durante l'invio.";
                    areaMessaggiForm.className = 'form-message-area error';
                }
            });
        }
    } else {

        // Se l'utente non è loggato, nasconde il form e mostra un messaggio che invita al login/registrazione.
        if (titoloPagina) {
            titoloPagina.textContent = "Contattaci";
        }
        if (elementoInfoUtente) {
            elementoInfoUtente.innerHTML = '<p>Devi <a href="/login.html">effettuare il login</a> per poter inviare un messaggio. Se non hai un account, puoi <a href="/registrazione.html">registrarti</a>.</p>';
        }
        if (formContatti) {
            formContatti.style.display = 'none';
        }
    }
});