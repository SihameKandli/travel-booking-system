
document.addEventListener('DOMContentLoaded', async () => {

    // Questa parte gestisce quali link mostrare nella navbar in base al ruolo dell'utente.
    const loginLink = document.getElementById('loginNav');
    const logoutNavItem = document.getElementById('logoutNav'); 
    const prenotazioni = document.getElementById('miePrenotazioni');
    const Viaggi = document.getElementById('gestioneViaggi');

    try {
        // Chiama un'API di servizio per ottenere lo stato dell'utente corrente.
        const res = await fetch('/api/get-current-user-status');
        const data = await res.json();

        if (data.isLoggedIn) {
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
            if (data.ruolo === 'fruitore' && prenotazioni) {
                prenotazioni.style.display = 'list-item';
            }
            if ((data.ruolo === 'erogatore' || data.ruolo === 'admin') && Viaggi) {
                Viaggi.style.display = 'list-item';
            }
        } else {
            // Logica per utente non loggato
            if (loginLink) loginLink.style.display = 'list-item';
        }
    } catch (error) {
        console.error("Errore nel setup della navbar:", error);
        if (loginLink) loginLink.style.display = 'list-item';
    }



    // Questa parte rende interattivi tutti gli slider di immagini.
    const tuttiIContenitoriSlider = document.querySelectorAll('.mini-slider');  // Seleziona tutti gli elementi con la classe '.mini-slider'
    
    tuttiIContenitoriSlider.forEach(contenitoreSingoloSlider => {
        const immaginiDiQuestoSlider = contenitoreSingoloSlider.querySelectorAll('img.slide');
        const bottonePrecedente = contenitoreSingoloSlider.querySelector('button.slider.prev');
        const bottoneSuccessivo = contenitoreSingoloSlider.querySelector('button.slider.next');
        let indiceSlideCorrente = 0; // Tiene traccia dell'immagine attualmente visibile.

        // Funzione per mostrare solo l'immagine corretta
        function aggiornaVistaSlide() {
            immaginiDiQuestoSlider.forEach((immagineSingola, indiceDellImmagine) => {
                // Aggiunge la classe 'active-slide' solo all'immagine corrente per renderla visibile.
                if(indiceDellImmagine === indiceSlideCorrente){
                    immagineSingola.classList.add('active-slide');
                } else {
                    immagineSingola.classList.remove('active-slide');
                }
            });
        }

        // Aggiunge l'evento al pulsante "successivo"
        if (bottoneSuccessivo) {
            bottoneSuccessivo.addEventListener('click', function() {
                indiceSlideCorrente++;
                if(indiceSlideCorrente >= immaginiDiQuestoSlider.length){
                    indiceSlideCorrente = 0; // Torna alla prima immagine
                }
                aggiornaVistaSlide();
            });
        }

        // Aggiunge l'evento al pulsante "precedente"
        if (bottonePrecedente) {
            bottonePrecedente.addEventListener('click', function() {
                indiceSlideCorrente--;
                if(indiceSlideCorrente < 0){
                    indiceSlideCorrente = immaginiDiQuestoSlider.length - 1; // Va all'ultima immagine
                }
                aggiornaVistaSlide();
            });
        }

        // Mostra la prima immagine all'avvio
        if (immaginiDiQuestoSlider.length > 0) {
            aggiornaVistaSlide();
        }
    });
});