
const express = require('express');  // Framework per la creazione del server e la gestione delle rotte API
const cookieParser = require("cookie-parser");  // Middleware per leggere i cookie inviati dal client
const mysql = require('mysql2');  
const jwt = require('jsonwebtoken');  // Libreria per la creazione e la verifica dei JSON Web Tokens, usati per l'autenticazione

// Inizializzazione dell'applicazione Express
const app = express();
const PORT = 3000;
const JWT_SECRET = "mia_chiave_super_segreta";

// --- Configurazione del Pool MySQL ---
// Viene utilizzato un pool di connesioni per migliorare le prestazioni
const pool = mysql.createPool({
    host: 'localhost',
    user: 'sihame',
    password: 'scopri_marocco',
    database: 'scopri_marocco_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}); 

// --- Middleware Globali ---
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// --- Middleware di Autenticazione e Autorizzazione ---
function authenticateToken(req, res, next) {
    const tokenValue = req.cookies['token'];  // Estrae il valore del token dal cookie

    // Se il token non è presente allora l'utente non è loggato e di conseguenza viene reindirizzato alla pagina di login
    if (!tokenValue) {
        return res.redirect("/login.html");
    }
    
    try {
        req.user = jwt.verify(tokenValue, JWT_SECRET);  // Verifica il token usando la chiave segreta
        next();
    } catch (err) { // Se il token è scaduto o non valido
        res.clearCookie('token'); // Pulisce il cookie non valido.
        return res.redirect("/login.html"); // Reindirizza al login.
    }
}

//  Middleware di autorizzazione per verificare se l'utente ha il ruolo di 'admin'
function isAdmin(req, res, next) {
    if (req.user.ruolo !== 'admin') {
        // Se l'utente non è un admin, restituisce un errore 403 
        return res.status(403).send('<h1>Accesso Negato</h1><p>Area riservata agli amministratori.</p>');
    }
    next();
}

// Middleware di autorizzazione per verificare se l'utente è un 'erogatore' o un 'admin'
function isErogatoreOrAdmin(req, res, next) {
    if (req.user.ruolo !== 'admin' && req.user.ruolo !== 'erogatore') {
        return res.status(403).send('<h1>Accesso Negato</h1><p>Area riservata agli erogatori o amministratori.</p>');
    }
    next();
}


// --- API per Utenti (Registrazione, Login, Logout) ---

// Registrazione di un nuovo utente
app.post("/api/register", async (req, res) => {
    const { nome, email, password, confirmPassword } = req.body;
    
    if (!nome || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: "Tutti i campi sono obbligatori." });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ 
            success: false, 
            message: "Le password non coincidono." });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: "La password deve essere di almeno 6 caratteri." 
        });
    }

    try {
         // Controlla se un utente con la stessa email è già presente nel database per evitare duplicati.
        const [existing] = await pool.promise().execute("SELECT id FROM utenti WHERE email = ?", [email]);

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Email già registrata." 
            });
        }

        await pool.promise().execute("INSERT INTO utenti (nome, email, password, ruolo) VALUES (?, ?, ?, 'fruitore')", [nome, email, password]);
        
        res.status(201).json({ 
            success: true, 
            message: "Registrazione completata! Ora puoi effettuare il login." 
        });
    
    } catch (error) {
        console.error("Errore API registrazione:", error);
        res.status(500).json({ 
            success: false, 
            message: "Errore del server durante la registrazione." 
        });
    }
});

// Login dell'utente registrato
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: "Email e password obbligatori." 
        });
    }

    try {
        // Cerca l'utente nel database tramite l'email.
        const [rows] = await pool.promise().execute("SELECT id, nome, email, password, ruolo FROM utenti WHERE email = ?", [email]);

        if (rows.length === 0) {
             // Se l'utente non viene trovato, si restituisce un errore
            return res.status(401).json({ 
                success: false, 
                message: "Credenziali non valide." 
            });
        }

        const user = rows[0];
        if (password !== user.password) {
            return res.status(401).json({ 
                success: false, 
                message: "Credenziali non valide." 
            });
        }

        // Se le credenziali sono corrette, viene creato il payload
        const payload = { 
            userId: user.id, 
            userName: user.nome, 
            email: user.email, 
            ruolo: user.ruolo 
        };
        
        // Il token viene firmato con la chiave segreta e ha una scadenza di 1 ora
        const token = jwt.sign( payload, JWT_SECRET, { expiresIn: '1h' });

        res.cookie("token", token, { 
            httpOnly: true, 
            secure: false, 
            sameSite: 'Strict', 
            maxAge: 3600000 
        });
        
        // Risposta di successo con i dati dell'utente per l'aggiornamento dell'interfaccia.
        res.json({ 
            success: true, 
            message: "Login effettuato con successo!", 
            user: { 
                userName: user.nome, 
                ruolo: user.ruolo 
            } 
        });
    } catch (error) {
        console.error("Errore API login:", error);
        res.status(500).json({ 
            success: false, 
            message: "Errore del server durante il login." 
        });
    }
});

// Logout 
app.post('/api/logout', (req, res) => {
    res.clearCookie('token'); // Il logout consiste semplicemente nel cancellare il cookie contenente il token.
    res.json({ 
        success: true, 
        message: "Logout effettuato con successo." 
    });
});


app.get('/api/get-current-user-status', (req, res) => {
    const token = req.cookies['token'];

    if (!token) {
        return res.json({ 
            isLoggedIn: false 
        });
    }

    try {
        // Verifica il token e restituisce i dati dell'utente se valido
        const data = jwt.verify(token, JWT_SECRET);
        res.json({ 
            isLoggedIn: true, 
            userName: data.userName, 
            ruolo: data.ruolo 
        });
    } catch {
        // Se il token non è valido (es. scaduto), informa il client che l'utente non è loggato.
        res.json({ 
            isLoggedIn: false 
        });
    }
});

// --- API per Viaggi ---
// Recupera tutte le offerte di viaggio disponibili
app.get('/api/viaggi', async (req, res) => {
    try {
         // La query unisce le tabelle 'viaggi' e 'utenti' 
        const query = `
             SELECT 
                v.id, v.titolo, v.descrizione, v.destinazione, 
                v.prezzo, v.disponibilita, v.immagine_url,
                u.nome AS nome_erogatore,
                DATE_FORMAT(v.data_partenza, '%d/%m/%Y') AS data_partenza_fmt,
                DATE_FORMAT(v.data_ritorno, '%d/%m/%Y') AS data_ritorno_fmt
            FROM viaggi v
            JOIN utenti u ON v.erogatore_id = u.id
            ORDER BY v.data_partenza ASC`;
        
        const [viaggi] = await pool.promise().execute(query);
        
        res.json({ success: true, viaggi });
    } catch (error) {
        console.error("Errore API get/viaggi:", error);
        res.status(500).json({ 
            success: false, 
            message: "Errore recupero viaggi." 
        });
    }
});

// Recuperare le offerte create da un specifico erogatore 
app.get('/api/viaggi/my-offers', authenticateToken, isErogatoreOrAdmin, async (req, res) => {
    try {
        // La query seleziona solo i viaggi dove 'erogatore_id' corrisponde all'ID dell'utente loggato.
        const [viaggi] = await pool.promise().execute(` SELECT 
                id, titolo, destinazione, descrizione, prezzo, disponibilita, 
                immagine_url,
                DATE_FORMAT(data_partenza, '%Y-%m-%d') AS data_partenza,
                DATE_FORMAT(data_ritorno, '%Y-%m-%d') AS data_ritorno
            FROM viaggi 
            WHERE erogatore_id = ? 
            ORDER BY data_partenza DESC`, [req.user.userId]);
        res.json({ success: true, viaggi });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Errore recupero offerte." 
        });
    }
});

// Creazione di una nuova offerta di viaggio
app.post('/api/viaggi', authenticateToken, isErogatoreOrAdmin, async (req, res) => {
    const { titolo, destinazione, descrizione, prezzo, disponibilita, data_partenza, data_ritorno, immagine_url } = req.body;

    try {
        // Inserisce una nuova riga nella tabella 'viaggi'
        const query = `INSERT INTO viaggi (erogatore_id, titolo, descrizione, destinazione, prezzo, disponibilita, data_partenza, data_ritorno, immagine_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await pool.promise().execute(query, [
            req.user.userId,
            titolo,
            descrizione || null,
            destinazione,
            prezzo,
            disponibilita,
            data_partenza,
            data_ritorno || null,
            immagine_url || null
        ]);
        res.status(201).json({ 
            success: true, 
            message: "Offerta di viaggio creata!" 
        });
    } catch (error) {
        console.error("Errore creazione viaggio:", error);
        res.status(500).json({ 
            success: false, 
            message: "Errore creazione viaggio." 
        });
    }
});

// Modificare un'offerta di viaggio esistente
app.put('/api/viaggi/:id', authenticateToken, isErogatoreOrAdmin, async (req, res) => {
    const { id } = req.params;
    const { titolo, destinazione, descrizione, prezzo, disponibilita, immagine_url, data_partenza, data_ritorno } = req.body;
    try {
        // verifica che il viaggio esista e che l'utente abbia i permessi per modificarlo
        const [viaggio] = await pool.promise().execute("SELECT erogatore_id FROM viaggi WHERE id = ?", [id]);

        if (viaggio.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Viaggio non trovato." 
            });
        }
         // Solo l'erogatore del viaggio o un admin possono modificarlo.
        if (viaggio[0].erogatore_id !== req.user.userId && req.user.ruolo !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Non autorizzato a modificare questo viaggio." 
            });
        }
        
        // Esegue l'aggiornamento dei dati del viaggio.
        const query = `UPDATE viaggi SET titolo = ?, destinazione = ?, descrizione = ?, prezzo = ?, disponibilita = ?, immagine_url = ?, data_partenza = ?, data_ritorno = ? WHERE id = ?`;
        await pool.promise().execute(query, [titolo, destinazione, descrizione, prezzo, disponibilita, immagine_url, data_partenza, data_ritorno, id]);
        res.json({ 
            success: true, 
            message: "Offerta aggiornata!" 
        });
    } catch (error) {
        console.error("Errore aggiornamento viaggio:", error);
        res.status(500).json({ 
            success: false, 
            message: "Errore aggiornamento viaggio." 
        });
    }
});

// Elimina un'offerta di viaggio
app.delete('/api/viaggi/:id', authenticateToken, isErogatoreOrAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [viaggio] = await pool.promise().execute("SELECT erogatore_id FROM viaggi WHERE id = ?", [id]);

        if (viaggio.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Viaggio non trovato." });
        }
        
        if (viaggio[0].erogatore_id !== req.user.userId && req.user.ruolo !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Non autorizzato a eliminare questo viaggio." });
        }

        // Prima di eliminare il viaggio, si eliminano le prenotazioni ad esso collegate per mantenere l'integrità referenziale.
        await pool.promise().execute("DELETE FROM prenotazioni WHERE viaggio_id = ?", [id]);
        await pool.promise().execute("DELETE FROM viaggi WHERE id = ?", [id]);
        
        res.json({ 
            success: true, 
            message: "Offerta eliminata con successo." });
    
        } catch (error) {
        
            res.status(500).json({ 
            success: false, 
            message: "Errore eliminazione viaggio." });
    }
});

// --- API per Prenotazioni ---
app.post('/api/prenotazioni', authenticateToken, async (req, res) => {
    const { viaggio_id, numero_persone } = req.body;
    
    // Solo gli utenti con ruolo 'fruitore' possono effettuare prenotazioni.
    if (req.user.ruolo !== 'fruitore') {
        return res.status(403).json({ 
            success: false, 
            message: "Solo i fruitori possono prenotare." 
        });
    }

    try {
        // Controlla se il viaggio esiste e se c'è disponibilità sufficiente.
        const [viaggi] = await pool.promise().execute("SELECT prezzo, disponibilita FROM viaggi WHERE id = ?", [viaggio_id]);
        
        if (viaggi.length === 0) {
            throw new Error("Viaggio non trovato o non attivo.");
        }
        if (viaggi[0].disponibilita < numero_persone) {
            throw new Error("Disponibilità insufficiente.");
        }

        // Aggiorna la disponibilità del viaggio (sottrae i posti prenotati).
        await pool.promise().execute("UPDATE viaggi SET disponibilita = disponibilita - ? WHERE id = ?", [numero_persone, viaggio_id]);

        try {
            const prezzo_totale = viaggi[0].prezzo * numero_persone;
            await pool.promise().execute(
                "INSERT INTO prenotazioni (viaggio_id, fruitore_id, numero_persone, prezzo_totale) VALUES (?, ?, ?, ?)", 
                [viaggio_id, req.user.userId, numero_persone, prezzo_totale]
            );
            
            res.status(201).json({ 
                success: true, 
                message: "Prenotazione effettuata!" 
            });

        } catch (insertError) {

            console.error("ERRORE: L'INSERT della prenotazione è fallito. Tentativo di compensazione manuale...");
            
            await pool.promise().execute("UPDATE viaggi SET disponibilita = disponibilita + ? WHERE id = ?", [numero_persone, viaggio_id]);
            console.log("Compensazione eseguita: la disponibilità del viaggio è stata ripristinata.");

            throw new Error("Impossibile completare la prenotazione a causa di un errore del server.");
        }

    } catch (error) {

        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// recuperare le prenotazioni di un fruitore 
app.get('/api/prenotazioni/mie', authenticateToken, async (req, res) => {
    if (req.user.ruolo !== 'fruitore') {
        return res.status(403).json({ success: false, message: "Accesso negato." });
    }

    try {
        // La query unisce 'prenotazioni' e 'viaggi' per ottenere i dettagli del viaggio prenotato.
        const query = `
            SELECT 
                p.id, p.numero_persone, p.prezzo_totale,
                DATE_FORMAT(p.data_prenotazione, '%d/%m/%Y %H:%i') AS data_prenotazione_fmt,
                v.titolo, v.destinazione,
                DATE_FORMAT(v.data_partenza, '%d/%m/%Y') AS data_partenza_fmt  
            FROM prenotazioni p
            JOIN viaggi v ON p.viaggio_id = v.id
            WHERE p.fruitore_id = ?
            ORDER BY p.data_prenotazione DESC
        `;
        const [prenotazioni] = await pool.promise().execute(query, [req.user.userId]);
        res.json({ success: true, prenotazioni });
    } catch (error) {
        console.error("SERVER: Errore grave durante recupero prenotazioni utente:", error);
        res.status(500).json({ 
            success: false, 
            message: "Errore nel recupero delle prenotazioni." 
        });
    }
});

// --- API per Admin Messaggi ---
// Qui l'admin può visualizzare tutti i messaggi inviati tramite form di contatto
app.get('/api/admin/get-messages', authenticateToken, isAdmin, async (req, res) => {
    try {
        const query = `SELECT m.id, m.nome as nome_form, m.email as email_form, m.oggetto, m.messaggio, DATE_FORMAT(m.data_invio, '%d-%m-%Y %H:%i') AS data_invio_fmt, u.nome as nome_utente_db FROM messaggi m LEFT JOIN utenti u ON m.utente_id = u.id ORDER BY m.data_invio DESC`;
        const [messages] = await pool.promise().execute(query);
        res.json({ 
            success: true, 
            messages, adminName: req.user.userName
         });
    } catch (error) {
        console.error("Errore API admin get-messages:", error);
        res.status(500).json({ 
            success: false, 
            message: "Errore server recupero messaggi." 
        });
    }
});


app.get('/visualizza_messaggi_admin.html', authenticateToken, isAdmin, (req, res) => {
    res.sendFile(__dirname + '/public/visualizza_messaggi_admin.html');
});

app.get('/gestione_viaggi.html', authenticateToken, isErogatoreOrAdmin, (req, res) => {
    res.sendFile(__dirname + '/public/gestione_viaggi.html');
});

app.get('/mie_prenotazioni.html', authenticateToken, (req, res) => {
    if (req.user.ruolo !== 'fruitore') {
        return res.status(403).send('<h1>Accesso Negato</h1><p>Questa pagina è riservata ai fruitori.</p>');
    }
    res.sendFile(__dirname + '/public/mie_prenotazioni.html');
});

// --- Gestione 404 e Avvio Server ---
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/Scopri_il_Marocco.html');
});

app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

app.listen(PORT, () => {
    console.log("Server in ascolto su http://localhost:" + PORT);
});