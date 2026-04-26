
document.addEventListener('DOMContentLoaded', async () => {
    
    const messageTableContainer = document.getElementById('messageTableContainer');
    const adminUserInfo = document.getElementById('adminUserInfo');
    const adminLogoutButton = document.getElementById('adminLogoutButton');
    const adminMessageStatus = document.getElementById('adminMessageStatus');

    if (adminLogoutButton) {
        
        adminLogoutButton.addEventListener('click', async () => {
            try {
                
                const response = await fetch('/api/logout', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    alert("Logout effettuato.");
                    window.location.href = '/login.html';
                } else {
                    alert(result.message || "Errore logout.");
                }
            } catch (err) {
                alert("Errore connessione logout.");
            }
        });
    }

    // Per il responsive
    function createMobileCards(messages) {
        const cardsContainer = document.getElementById('messageCards');
        
        cardsContainer.innerHTML = '';
        
        messages.forEach(msg => {
            const card = document.createElement('div');
            card.className = 'message-card';
            card.innerHTML =
                    
                    '<div class="card-header">' +
                        '<div class="card-name">' +'<strong>' + msg.nome_form + '</strong>' + '</div>' +
                        '<div class="card-date">' + msg.data_invio_fmt + '</div>' +
                    '</div>' +
                    
                    '<div class="card-info">' +
                        '<div class="card-info-row">' +
                            '<div class="card-label"><strong> Email</strong>:</div>' +
                            '<div class="card-value">' + msg.email_form + '</div>' +
                        '</div>' +
                        
                        '<div class="card-info-row">' +
                            '<div class="card-label"> <strong> Oggetto</strong>:</div>' +
                            '<div class="card-value">' + (msg.oggetto || "-") + '</div>' + 
                        '</div>' +
                        
                        '<div class="card-info-row">' +
                            '<div class="card-label"> <strong>Utente</strong>:</div>' +
                            '<div class="card-value">' + msg.nome_utente_db + '</div>' + 
                        '</div>' +
                    '</div>' +
                    
                    '<div class="card-message">' +
                        '<div class="card-message-label"> <strong>Messaggio</strong>:</div>' +
                        '<div>' + msg.messaggio + '</div>' +
                    '</div>';
            
            cardsContainer.appendChild(card);
        });
    }


    try {
    
        const userStatusRes = await fetch('/api/get-current-user-status');
        const userStatusData = await userStatusRes.json();

        if (!userStatusData.isLoggedIn || !userStatusData.isErogatoreOrAdmin) {
            alert("Accesso non autorizzato.");
            window.location.href = '/login.html';
            return;
        }

        if (adminUserInfo && userStatusData.userName) {
            adminUserInfo.textContent = "Benvenuto," + userStatusData.userName + "(Admin)";
        }


        adminMessageStatus.textContent = 'Caricamento messaggi...';
        const messagesResponse = await fetch('/api/admin/get-messages');
        const messagesResult = await messagesResponse.json();

        messageTableContainer.innerHTML = ''; // Pulisci "Caricamento..."

        if (messagesResult.success && messagesResult.messages) {
            if (messagesResult.messages.length > 0) {
                const table = document.createElement('table');
                table.className = 'admin-messages-table'; 
                const thead = document.createElement('thead');
                thead.innerHTML = 
                    '<tr>' +
                        '<th>ID</th>' +
                        '<th>Data Invio</th>' +
                        '<th>Nome</th>' +
                        '<th>Email</th>' +
                        '<th>Oggetto</th>' +
                        '<th>Messaggio</th>' +
                        '<th>Utente Registrato</th>' +
                    '</tr>';
                ;
                table.appendChild(thead);
                const tbody = document.createElement('tbody');
                
                messagesResult.messages.forEach(msg => {
                    const row = tbody.insertRow();
                    row.innerHTML =
                        '<td>' + msg.id + '</td>' +
                        '<td class="col-data-invio">' + msg.data_invio_fmt + '</td>' + 
                        '<td>' + msg.nome_form + '</td>' +
                        '<td>' + msg.email_form + '</td>' +
                        '<td>' + (msg.oggetto || "-") + '</td>' +
                        '<td>' + msg.messaggio + '</td>' +
                        '<td>' + msg.nome_utente_db + '</td>';
                });
                table.appendChild(tbody);
                messageTableContainer.appendChild(table);
                createMobileCards(messagesResult.messages);
                
                adminMessageStatus.textContent = ''; // Pulisci messaggio di stato
            } else {
                adminMessageStatus.textContent = 'Nessun messaggio trovato.';
                adminMessageStatus.className = 'info';
            }
        } else {
            adminMessageStatus.textContent = messagesResult.message || 'Errore nel caricare i messaggi.';
            adminMessageStatus.className = 'error';
        }

    } catch (err) {
        console.error("Errore pagina admin messaggi:", err);
        if (adminMessageStatus) {
            adminMessageStatus.textContent = 'Errore di connessione o autorizzazione.';
            adminMessageStatus.className = 'error';
        }

    }
});