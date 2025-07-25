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

### 2. Instalirajte MySQL

1. Otvorite stranicu: https://www.apachefriends.org/
2. Preuzmite, instalirajte i pokrenite **XAMPP for Windows**
3. Kliknite START dugme za Apache, a zatim i za MySQL

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

## Postavljanje baze podataka

1. Izvršite skriptu iz /database/db.sql
2. Podesi /backend/.env file na sljedeći način
    ```bash
    DB_HOST=localhost
    DB_USER=<username>
    DB_PASSWORD=<password>
    DB_NAME=<db_name>

## Pokrenite program

1. U Command Prompt-u navigirajte u /backend 
    ```bash
    cd .\backend\
2. Pokrenite backend (upišite u CMD "python main.py")
3. Otvorite Visual Studio Code i instalirajte extenziju "Live Server"
4. Otvorite /frontend i idite na signup.html
5. U donjem desnom uglu ekrana kliknite na "Go Live"

## Kako se koristi program

1. Napravite novi nalog i prijative se na isti
2. Idite na "Dodaj Artikal"
3. Dodajte artikle prateći uputstva sa ekrana
4. po završetku dodavanja artikala idite na "Pogledaj Artikle"