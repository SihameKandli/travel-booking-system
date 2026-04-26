document.addEventListener('DOMContentLoaded', async () => {

    let currentUser = null;
    try {
        const res = await fetch('/api/get-current-user-status');
        if (res.ok) {
            currentUser = await res.json();
        } else {
            currentUser = { isLoggedIn: false };
        }
    } catch (error) {
        console.error("Errore nel verificare lo stato utente:", error);
        currentUser = { isLoggedIn: false }; 
    }

    // --- CONFIGURAZIONE DELLA NAVBAR ---
    const loginLink = document.getElementById('loginNav');
    const logoutNavItem = document.getElementById('logoutNav'); 
    const prenotazioni = document.getElementById('miePrenotazioni');
    const Viaggi = document.getElementById('gestioneViaggi');

    if (currentUser.isLoggedIn) {
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
        if (currentUser.ruolo === 'fruitore' && prenotazioni) {
            prenotazioni.style.display = 'list-item';
        }
        if ((currentUser.ruolo === 'erogatore' || currentUser.ruolo === 'admin') && Viaggi) {
            Viaggi.style.display = 'list-item';
        }
    } else {
        // Logica per utente non loggato
        if (loginLink) loginLink.style.display = 'list-item';
    }


    // --- LOGICA SPECIFICA DELLA PAGINA VIAGGI ---
    const viaggiContainer = document.getElementById('viaggi-container');
    const viaggiStatus = document.getElementById('viaggi-status');

    // Funzione per visualizzare le card dei viaggi
    function displayViaggi(viaggi) {
        if (!viaggiContainer) return;
        viaggiContainer.innerHTML = '';
        viaggi.forEach(viaggio => {
            const card = document.createElement('div');
            card.className = 'attrazioni-viaggi';
            
            const dataPartenza = viaggio.data_partenza_fmt || 'N/D';
            const dataRitorno = viaggio.data_ritorno_fmt || 'N/D';

            // Costruiamo la sezione di prenotazione
            let prenotazioneHtml;
            if (currentUser && currentUser.isLoggedIn && currentUser.ruolo === 'fruitore') {
                
                prenotazioneHtml =
                    '<form class="form-prenotazione" data-viaggio-id="' + viaggio.id + '">' +
                        '<div class="form-group">' +
                            '<label for="persone-' + viaggio.id + '">Numero persone:</label>' +
                            '<input type="number" name="numeroPersone" id="persone-' + viaggio.id + '" value="1" min="1" max="' + viaggio.disponibilita + '">' +
                        '</div>' +
                        '<button type="submit" class="pulsante">Prenota Ora</button>' +
                        '<p class="prenota-feedback" id="feedback-' + viaggio.id + '"></p>' +
                    '</form>';

            } else if (currentUser && currentUser.isLoggedIn) {
                prenotazioneHtml = '<p><i>Accesso come ' + currentUser.ruolo + '. Solo i fruitori possono prenotare.</i></p>';
            } else {
                prenotazioneHtml = '<p><i><a href="/login.html">Accedi come fruitore</a> per prenotare.</i></p>';
            }

            // Costruiamo l'HTML della card
            card.innerHTML = 
                '<div class="attrazioni-image">' +
                    '<img src="' + (viaggio.immagine_url || '/immagini/viaggi/merzouga.jpg') + '" alt="' + viaggio.titolo + '">' +
                '</div>' +
                '<div class="info-attrazioni">' +
                    '<h3>' + viaggio.titolo + '</h3>' +
                    '<p><strong>Destinazione:</strong> ' + viaggio.destinazione + '</p>' +
                    '<p>' + viaggio.descrizione + '</p>' +
                    '<p><strong>Partenza:</strong> ' + dataPartenza + ' | <strong>Ritorno:</strong> ' + dataRitorno + '</p>' +
                    '<p><strong>Prezzo per persona:</strong> ' + viaggio.prezzo + ' €</p>' +
                    '<p><strong>Disponibilità:</strong> ' + viaggio.disponibilita + ' posti</p>' +
                    '<p><strong>Offerto da:</strong> ' + viaggio.nome_erogatore + '</p>' +
                    '<hr>' +
                    prenotazioneHtml +
                '</div>';
            viaggiContainer.appendChild(card);
        });
    }
    
    // Caricamento iniziale dei viaggi
    try {
        const response = await fetch('/api/viaggi');
        const data = await response.json();
        if (data.success && data.viaggi.length > 0) {
            if (viaggiStatus) viaggiStatus.remove();
            displayViaggi(data.viaggi);
        } else {
            if (viaggiStatus) viaggiStatus.textContent = "Al momento non ci sono offerte di viaggio disponibili.";
        }
    } catch (error) {
        console.error("Errore caricamento viaggi:", error);
        if (viaggiStatus) {
            viaggiStatus.textContent = "Errore nel caricare le offerte. Riprova più tardi.";
            viaggiStatus.style.color = 'red';
        }
    }

    if (viaggiContainer) {
        viaggiContainer.addEventListener('submit', async (event) => {
            if (event.target.classList.contains('form-prenotazione')) {
                event.preventDefault(); 
                const form = event.target;

                const viaggioId = form.dataset.viaggioId;

                const numeroPersone = form.numeroPersone.value;
                const feedbackEl = document.getElementById('feedback-' + viaggioId);
                const submitBtn = form.querySelector('button[type="submit"]');

                feedbackEl.textContent = 'Prenotazione in corso...';

                try {
                    const res = await fetch('/api/prenotazioni', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ viaggio_id: viaggioId, numero_persone: numeroPersone })
                    });
                    const result = await res.json();
                    if (res.ok) {
                        feedbackEl.textContent = result.message;
                        feedbackEl.style.color = 'green';
                        submitBtn.textContent = 'Prenotato!';
                        submitBtn.disabled = true;
                        form.numeroPersone.disabled = true;
                    } else {
                        feedbackEl.textContent = result.message || "Errore sconosciuto.";
                        feedbackEl.style.color = 'red';
                    }
                } catch (error) {
                    feedbackEl.textContent = "Errore di connessione.";
                    feedbackEl.style.color = 'red';
                }
            }
        });
    }
});