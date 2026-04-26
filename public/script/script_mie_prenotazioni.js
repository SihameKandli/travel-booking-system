
document.addEventListener('DOMContentLoaded', async () => {

    let datiUtente = null;
    try {
        const res = await fetch('/api/get-current-user-status');
        datiUtente = await res.json();
    } catch (error) {
        console.error("Errore critico nel fetch dello stato utente:", error);
        // Se non possiamo contattare il server, reindirizziamo al login per sicurezza.
        window.location.href = '/login.html';
        return; 
    }

    // Se l'utente non è un fruitore loggato, viene reindirizzato.
    if (!datiUtente.isLoggedIn || datiUtente.ruolo !== 'fruitore') {
        window.location.href = '/login.html';
        return; 
    }
    
    // --- CONFIGURAZIONE DINAMICA DELLA NAVBAR ---
    const loginLink = document.getElementById('loginNav');
    const logoutNavItem = document.getElementById('logoutNav'); 
    const prenotazioniLink = document.getElementById('miePrenotazioni');
    const viaggiLink = document.getElementById('gestioneViaggi');

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

    if (datiUtente.ruolo === 'fruitore' && prenotazioniLink) {
        prenotazioniLink.style.display = 'list-item';
    }
    if ((datiUtente.ruolo === 'erogatore' || datiUtente.ruolo === 'admin') && viaggiLink) {
        viaggiLink.style.display = 'list-item';
    }


    const container = document.getElementById('prenotazioni-container');
    if (!container) {
        console.error("ERRORE CRITICO: Elemento #prenotazioni-container non trovato.");
        return;
    }

    try {
        const prenotazioniRes = await fetch('/api/prenotazioni/mie');
        const data = await prenotazioniRes.json();

        if (data.success && data.prenotazioni.length > 0) {
            container.innerHTML = '';
            // Crea una card per ciascuna prenotazione
            data.prenotazioni.forEach(p => {
                const card = document.createElement('div');
                card.className = 'messagePrenotazioni-card';
                card.innerHTML = 
                    '<div class="cardPrenotazioni-header">' +
                        '<span class="cardPrenotazioni-name">' + p.titolo + ' - ' + p.destinazione + '</span>' +
                        '<span class="cardPrenotazioni-date">Prenotato il: ' + p.data_prenotazione_fmt + '</span>' +
                    '</div>' +
                    '<div class="cardPrenotazioni-info">' +
                        '<p><strong>Data Partenza:</strong> ' + p.data_partenza_fmt + '</p>' +
                        '<p><strong>Partecipanti:</strong> ' + p.numero_persone + '</p>' +
                        '<p><strong>Prezzo Totale:</strong> ' + parseFloat(p.prezzo_totale).toFixed(2) + ' €</p>' +
                    '</div>';
                container.appendChild(card);
            });
        } else if (data.success) {
            container.innerHTML = '<p>Non hai ancora effettuato nessuna prenotazione.</p>';
        } else {
            container.innerHTML = '<p>Errore dal server: ' + data.message + '</p>';
        }
    } catch (error) {
        console.error("ERRORE NEL CARICARE LE PRENOTAZIONI:", error);
        container.innerHTML = '<p>Errore di connessione nel caricare le prenotazioni: ' + error.message + '</p>';
    }
});