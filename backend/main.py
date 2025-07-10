from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import os
import jwt
import datetime
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'moja_tajna_kljuc')

# Dozvoli CORS samo za frontend origin
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5500"]}}, supports_credentials=True)

db_config = {
    'host': os.getenv('DB_HOST', '185.202.236.69'),
    'user': os.getenv('DB_USER', 'aniel'),
    'password': os.getenv('DB_PASSWORD', 'Aniel2025.'),
    'database': os.getenv('DB_NAME', 'aniel_DB')
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

def token_required(f):
    from functools import wraps
    def verify_token(token):
        try:
            decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            return decoded['user_id']
        except Exception:
            return None

    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            parts = auth_header.split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        if not token:
            return jsonify({'msg': 'Token nije pronađen!', 'status': 'error'}), 401

        user_id = verify_token(token)
        if not user_id:
            return jsonify({'msg': 'Nevažeći token!', 'status': 'error'}), 401

        return f(user_id, *args, **kwargs)
    return decorated

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'msg': 'Sva polja su obavezna!', 'status': 'error'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM korisnici WHERE email=%s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'msg': 'Korisnik već postoji!', 'status': 'error'}), 409

        hashed_pw = generate_password_hash(password)
        cursor.execute("INSERT INTO korisnici (email, password) VALUES (%s, %s)", (email, hashed_pw))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'msg': 'Registracija uspješna!', 'status': 'success'}), 201
    except Exception as e:
        return jsonify({'msg': 'Greška na serveru', 'status': 'error'}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'msg': 'Email i lozinka su obavezni', 'status': 'error'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM korisnici WHERE email=%s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user and check_password_hash(user['password'], password):
            token = jwt.encode({
                'user_id': user['id'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12)
            }, app.config['SECRET_KEY'], algorithm="HS256")

            return jsonify({'msg': 'Login uspješan', 'status': 'success', 'token': token}), 200
        else:
            return jsonify({'msg': 'Pogrešan email ili lozinka', 'status': 'error'}), 401

    except Exception as e:
        return jsonify({'msg': 'Greška na serveru', 'status': 'error'}), 500

@app.route('/logout', methods=['POST'])
@token_required
def logout(user_id):
    # Kod JWT logout se obično radi samo na frontend strani (brisanje tokena)
    return jsonify({'msg': 'Odjava uspješna', 'status': 'success'}), 200

@app.route('/unos', methods=['POST'])
@token_required
def unos_artikla(user_id):
    data = request.get_json()
    naziv = data.get('naziv')
    kategorija_id = data.get('kategorija')
    proizvodjac_id = data.get('proizvodjac_id')
    lokacije_id = data.get('lokacije_id')
    cijena = data.get('cijena')

    if not naziv or not kategorija_id or not lokacije_id or cijena is None:
        return jsonify({'msg': 'Sva obavezna polja moraju biti popunjena!', 'status': 'error'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO oprema (naziv, cijena, kategorija_id, proizvodjac_id, lokacije_id, datum_objave)
               VALUES (%s, %s, %s, %s, %s, NOW())""",
            (naziv, cijena, kategorija_id, proizvodjac_id, lokacije_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'msg': 'Artikal uspješno dodan!', 'status': 'success'}), 201
    except Exception as e:
        return jsonify({'msg': 'Greška pri unosu u bazu', 'status': 'error'}), 500

@app.route('/kategorije', methods=['GET'])
def get_kategorije():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, naziv FROM kategorija ORDER BY naziv")
        data = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'data': data, 'status': 'success'}), 200
    except Exception:
        return jsonify({'msg': 'Greška pri dohvaćanju kategorija', 'status': 'error'}), 500

@app.route('/proizvodjaci', methods=['GET'])
def get_proizvodjaci():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, naziv FROM proizvodjac ORDER BY naziv")
        data = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'data': data, 'status': 'success'}), 200
    except Exception:
        return jsonify({'msg': 'Greška pri dohvaćanju proizvođača', 'status': 'error'}), 500

@app.route('/lokacije', methods=['GET'])
def get_lokacije():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, naziv FROM lokacije ORDER BY naziv")
        data = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'data': data, 'status': 'success'}), 200
    except Exception:
        return jsonify({'msg': 'Greška pri dohvaćanju lokacija', 'status': 'error'}), 500

@app.route('/oprema', methods=['GET'])
def get_oprema():
    # Ovo možeš nadograditi kasnije po filtrima
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT o.id,
                   CONCAT_WS(' ', p.naziv, o.naziv) AS naziv,
                   o.cijena,
                   k.naziv AS kategorija,
                   l.naziv AS lokacija,
                   o.datum_objave
            FROM oprema o
            LEFT JOIN proizvodjac p ON o.proizvodjac_id = p.id
            LEFT JOIN kategorija k ON o.kategorija_id = k.id
            LEFT JOIN lokacije l ON o.lokacije_id = l.id
            ORDER BY o.id DESC
        """)
        data = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'data': data, 'status': 'success'}), 200
    except Exception:
        return jsonify({'msg': 'Greška pri dohvaćanju opreme', 'status': 'error'}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
