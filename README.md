# TechInventory

TechInventory je aplikacija za evidenciju tehničke opreme — savršena za škole, firme i servisne radionice. Ova uputstva vas vode korak po korak, čak i ako nikada niste radili programiranje.

---

## Šta vam treba?

Ova aplikacija koristi sljedeće alate:

- **Python** – za backend
- **MySQL** – za čuvanje podataka (oprema, kategorije, korisici, lokacije, proizvođači)

---

## Koraci instalacije (na svježi Windows)

### 1. Instalirajte Python

1. Otvorite stranicu: https://www.python.org/downloads/
2. Kliknite na dugme **Download Python 3.x**
3. Pokrenite instalaciju i **obavezno štiklirajte opciju "Add Python to PATH"**
4. Kliknite na **Install Now**

### 2. Instaliraj MySQL

1. Otvorite stranicu: https://dev.mysql.com/downloads/installer/
2. Preuzmite i pokrenite **MySQL Installer for Windows**
3. Odaberite **Full installation** ili barem **MySQL Server** i **Workbench**
4. Postavite root lozinku (npr. `admin123`) i zapamtite je

### 3. Instalirajte Visual Studio Code (opcionalno)

1. Otvorite stranicu: https://code.visualstudio.com/
2. Preuzmite i instalirajte editor

---

## Preuzimanje projekta

1. Otvorite `Command Prompt` (Windows + R → upišite `cmd`)
2. Navigirajte u željeni folder:
   ```bash
   cd C:\Users\TvojeIme\Documents
3. git clone https://github.com/Aniel-H/TechInventory.git

## postavljanje baze podataka

1. Izvršite skriptu iz /database/db.sql
2. Podesi /backend/.env file na sljedeći način
    ```bash
    DB_HOST=localhost
    DB_USER=<username>
    DB_PASSWORD=<password>
    DB_NAME=<db_name>