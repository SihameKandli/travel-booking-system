// Gestisce la logica per la pagina di gestione delle offerte di viaggio (creazione, modifica, eliminazione).

document.addEventListener('DOMContentLoaded', async () => {

    const form = document.getElementById('viaggioForm');
    const messageArea = document.getElementById('formMessageArea');
    const userInfoDiv = document.getElementById('userInfo');
    const offerteContainer = document.getElementById('offerteContainer');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const viaggioIdInput = document.getElementById('viaggioId');
    
    // Conterrà le informazioni dell'utente loggato.
    let datiUtente = null; 
    
    // Conterrà l'array delle offerte caricate dal server.
    let offerteCache = []; 

    // Controlla se l'utente è loggato e ha il ruolo corretto per accedere a questa pagina.
    try {
        const res = await fetch('/api/get-current-user-status');
        datiUtente = await res.json();

        // Controlla se l'utente non è loggato O se il suo ruolo non è né 'admin' né 'erogatore'.
        if (!datiUtente.isLoggedIn || (datiUtente.ruolo !== 'admin' && datiUtente.ruolo !== 'erogatore')) {
            window.location.href = '/login.html';
            return;
        }
    } catch (error) {
        console.error("Errore di autorizzazione:", error);
        window.location.href = '/login.html';
        return;
    }


    // --- CONFIGURAZIONE DELLA NAVBAR ---
    
    const logoutNavItem = document.getElementById('logoutNav'); 
    const prenotazioni = document.getElementById('miePrenotazioni');
    const Viaggi = document.getElementById('gestioneViaggi');

    if (logoutNavItem) {
        logoutNavItem.style.display = 'block';
        const logoutLink = logoutNavItem.querySelector('a');

        if (logoutLink) {
            logoutLink.addEventListener('click', async (event) => {
                event.preventDefault();
                // Invia una richiesta di logout al server.
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/login.html';
            });
        }
    }
    // Se l'utente ha il ruolo 'fruitore' e il link 'prenotazioni' esiste, rendilo visibile.
    if (datiUtente.ruolo === 'fruitore' && prenotazioni) {
        prenotazioni.style.display = 'block';
    }
    // Se l'utente ha il ruolo 'erogatore' o 'admin' e il link 'Viaggi' esiste, rendilo visibile.
    if ((datiUtente.ruolo === 'erogatore' || datiUtente.ruolo === 'admin') && Viaggi) {
        Viaggi.style.display = 'block';
    }


    // Se l'elemento 'userInfoDiv' esiste, imposta il suo testo per mostrare un messaggio di benvenuto.
    if (userInfoDiv) {
        userInfoDiv.textContent = 'Benvenuto, ' + datiUtente.userName + ' (' + datiUtente.ruolo + ')';
    }
    
    // Definisce una funzione per resettare il form ai suoi valori di default.
    const resetForm = () => {
        if (!form) return;
        form.reset();

        viaggioIdInput.value = '';
        // Ripristina il testo del titolo e del pulsante di invio alla modalità "Crea".
        if (formTitle) formTitle.textContent = 'Crea una Nuova Offerta';
        if (submitBtn) submitBtn.textContent = 'Crea Viaggio';
        // Nasconde il pulsante "Annulla Modifica".
        if (cancelBtn) cancelBtn.style.display = 'none';
        // Pulisce l'area dei messaggi.
        if (messageArea) {
            messageArea.textContent = '';
            messageArea.className = 'form-message-area';
        }
    };

    // Definisce una funzione per caricare e visualizzare le offerte dell'erogatore.
    const caricaOfferte = async () => {
        try {
            // Invia una richiesta per ottenere le offerte dell'utente loggato.
            const response = await fetch('/api/viaggi/my-offers');
            const data = await response.json();
            
            // Se la richiesta ha avuto successo e il contenitore delle offerte esiste...
            if (data.success && offerteContainer) {
                // ...salva i dati ricevuti nella cache.
                offerteCache = data.viaggi;
                // Pulisce il contenuto precedente del contenitore.
                offerteContainer.innerHTML = '';
                // Se non ci sono viaggi, mostra un messaggio.
                if (data.viaggi.length === 0) {
                    offerteContainer.innerHTML = '<p>Non hai ancora pubblicato nessuna offerta.</p>';
                } else {
                    // Altrimenti, per ogni viaggio ricevuto...
                    data.viaggi.forEach(viaggio => {
                        // ...crea un nuovo elemento 'div'.
                        const card = document.createElement('div');
                        card.className = 'messageViaggi-card';
                        
                        // Costruisce la stringa HTML per la card usando i dati del viaggio.
                        card.innerHTML = 
                            '<div class="cardViaggi-header">' +
                                '<span class="cardViaggi-name">' + viaggio.titolo + ' - ' + viaggio.destinazione + '</span>' +
                            '</div>' +
                            '<div class="cardViaggi-info">' +
                                '<p>Prezzo: ' + viaggio.prezzo + ' € | Disponibilità: ' + viaggio.disponibilita + ' posti</p>' +
                            '</div>' +
                            '<div class="cardViaggi-action">' +
                                '<button class="pulsante edit-btn" data-id="' + viaggio.id + '">Modifica</button>' +
                                '<button class="pulsante delete-btn" data-id="' + viaggio.id + '">Elimina</button>' +
                            '</div>';
                        // Aggiunge la card appena creata al contenitore.
                        offerteContainer.appendChild(card);
                    });
                }
            } else if (offerteContainer) {
                offerteContainer.innerHTML = '<p>' + (data.message || 'Errore sconosciuto.') + '</p>';
            }
        } catch (error) {
            if (offerteContainer) offerteContainer.innerHTML = '<p>Errore di connessione nel caricare le offerte.</p>';
        }
    };

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const data = {
                titolo: form.titolo.value,
                destinazione: form.destinazione.value,
                descrizione: form.descrizione.value,
                prezzo: form.prezzo.value,
                disponibilita: form.disponibilita.value,
                data_partenza: form.data_partenza.value,
                data_ritorno: form.data_ritorno.value,
                immagine_url: form.immagine_url.value,
            };

            const id = viaggioIdInput.value;
            
            let method;
            let url;
            if (id) {
                method = 'PUT';
                url = '/api/viaggi/' + id;
            } else {
                method = 'POST';
                url = '/api/viaggi';
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                // Ottiene la risposta dal server.
                const result = await response.json();

                // Mostra il messaggio di risposta nell'area messaggi.
                messageArea.textContent = result.message;

                if (response.ok) {
                    messageArea.className = 'form-message-area success';
                    // Resetta il form.
                    resetForm();
                    // Ricarica la lista delle offerte per mostrare le modifiche.
                    await caricaOfferte();
                } else {
                    messageArea.className = 'form-message-area error';
                }
            } catch (error) {
                messageArea.textContent = 'Errore di connessione con il server.';
                messageArea.className = 'form-message-area error';
            }
        });
    }

    // Se il contenitore delle offerte esiste...
    if (offerteContainer) {
        // ...aggiungi un ascoltatore di eventi 'click' 
        offerteContainer.addEventListener('click', async (event) => {
            const target = event.target;
            // Ottiene l'ID dal 'data-id' dell'elemento cliccato.
            const id = target.dataset.id;

            // Se l'elemento cliccato ha la classe 'edit-btn'...
            if (target.classList.contains('edit-btn')) {
                // ...trova il viaggio corrispondente nella cache.
                const viaggioDaModificare = offerteCache.find(v => v.id == id);
                
                // Se il viaggio viene trovato...
                if (viaggioDaModificare) {
                    // ...popola i campi del form con i dati del viaggio da modificare.
                    form.titolo.value = viaggioDaModificare.titolo;
                    form.destinazione.value = viaggioDaModificare.destinazione;
                    form.descrizione.value = viaggioDaModificare.descrizione;
                    form.prezzo.value = viaggioDaModificare.prezzo;
                    form.disponibilita.value = viaggioDaModificare.disponibilita;
                    form.data_partenza.value = viaggioDaModificare.data_partenza;
                    form.data_ritorno.value = viaggioDaModificare.data_ritorno;

                    viaggioIdInput.value = id;
                    
                    // Aggiorna l'interfaccia per la modalità "Modifica".
                    if(formTitle) formTitle.textContent = 'Modifica Offerta';
                    if(submitBtn) submitBtn.textContent = 'Salva Modifiche';
                    if(cancelBtn) cancelBtn.style.display = 'block';

                }
            }
            
            // Se l'elemento cliccato ha la classe 'delete-btn'...
            if (target.classList.contains('delete-btn')) {
                // ...mostra una finestra di conferma.
                if (alert('Sei sicuro di voler eliminare questa offerta?')) {
                    // Se l'utente conferma, invia una richiesta di eliminazione al server.
                    try {
                        const response = await fetch('/api/viaggi/' + id, { method: 'DELETE' });
                        const result = await response.json();
                        // Se l'eliminazione ha successo, ricarica la lista delle offerte.
                        if (response.ok) {
                            await caricaOfferte();
                        } else {
                            // Altrimenti, mostra un alert con l'errore.
                            alert('Errore: ' + result.message);
                        }
                    } catch (error) {
                        alert("Errore di connessione durante l'eliminazione.");
                    }
                }
            }
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetForm);
    }

    // Chiama la funzione 'caricaOfferte' una volta all'avvio per popolare la lista.
    caricaOfferte();
});