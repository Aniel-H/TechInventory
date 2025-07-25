# TechInventory

TechInventory je aplikacija za evidenciju tehničke opreme — savršena za škole, firme i servisne radionice. Ova uputstva te vode korak po korak, čak i ako nikada nisi radio/la s programiranjem.

---

## 📦 Šta ti treba?

Ova aplikacija koristi sljedeće alate:

- **Python** – za backend
- **MySQL** – za čuvanje podataka (oprema, lokacije, proizvođači)

---

## 🖥️ Koraci instalacije (na svježi Windows)

### 1. Instaliraj Python

1. Otvori stranicu: https://www.python.org/downloads/
2. Klikni na dugme **Download Python 3.x**
3. Pokreni instalaciju i **obavezno štikliraj opciju "Add Python to PATH"**
4. Klikni na **Install Now**

### 2. Instaliraj MySQL

1. Otvori: https://dev.mysql.com/downloads/installer/
2. Preuzmi i pokreni **MySQL Installer for Windows**
3. Odaberi **Full installation** ili barem **MySQL Server** i **Workbench**
4. Postavi root lozinku (npr. `admin123`) i zapamti je

### 3. Instaliraj Visual Studio Code (opcionalno)

1. Otvori: https://code.visualstudio.com/
2. Preuzmi i instaliraj editor

---

## 📁 Preuzimanje projekta

1. Otvori `Command Prompt` (Windows + R → upiši `cmd`)
2. Idi u željeni folder:
   ```bash
   cd C:\Users\TvojeIme\Documents
3. git clone https://github.com/Aniel-H/TechInventory.git

## postavljanje baze podataka

1. Izvrši skriptu iz /database/db.sql
2. Podesi /backend/.env file na sljedeći način

DB_HOST=localhost
DB_USER=<username>
DB_PASSWORD=<password>
DB_NAME=<db_name>