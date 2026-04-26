-- 1. CREAZIONE DEL DATABASE
CREATE DATABASE IF NOT EXISTS scopri_marocco_db;
USE event_management; -- O il nome del tuo db

-- 2. CREAZIONE UTENTE (Opzionale, ma utile per documentazione)
CREATE USER IF NOT EXISTS 'sihame'@'localhost' IDENTIFIED BY 'scopri_marocco';
GRANT ALL PRIVILEGES ON scopri_marocco_db.* TO 'sihame'@'localhost';
FLUSH PRIVILEGES;

-- 3. TABELLA UTENTI
CREATE TABLE utenti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    ruolo ENUM('utente', 'admin', 'fruitore') DEFAULT 'utente'
);

-- 4. TABELLA MESSAGGI
CREATE TABLE messaggi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_form VARCHAR(100) NOT NULL, 
    email_form VARCHAR(255) NOT NULL,
    oggetto VARCHAR(255),
    messaggio TEXT NOT NULL,
    data_invio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    utente_id INT,
    FOREIGN KEY (utente_id) REFERENCES utenti(id) ON DELETE SET NULL
);

-- 5. AGGIUNGI QUI LE TABELLE VIAGGI E PRENOTAZIONI
CREATE TABLE viaggi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titolo VARCHAR(255),
    descrizione TEXT,
    prezzo DECIMAL(10,2)
);

-- 6. INSERIMENTO DATI DI TEST
INSERT INTO utenti (nome, email, password, ruolo) VALUES
('Amministratore', 'sihame@marocco.com', 'admin123', 'admin'),
('Marco Rossi', 'marco.rossi@gmail.com', 'utente12345', 'utente');

INSERT INTO messaggi (nome_form, email_form, oggetto, messaggio, utente_id) VALUES
('Marco Rossi', 'mario.rossi@gmail.com', 'Info Marrakech', 'Buongiorno, info escursioni?', 2);