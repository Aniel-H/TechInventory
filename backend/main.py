from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import mysql.connector
import os
import traceback
from dotenv import load_dotenv

# Učitaj .env varijable
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "tajna_lozinka")

# ✅ PRAVILAN CORS setup - samo jedan poziv!
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5500"]}}, supports_credentials=True)

bcrypt = Bcrypt(app)

# Konfiguracija baze
db_config = {
    'host': os.getenv('DB_HOST', '185.202.236.69'),
    'user': os.getenv('DB_USER', 'aniel'),
    'password': os.getenv('DB_PASSWORD', 'Aniel2025.'),
    'database': os.getenv('DB_NAME', 'aniel_DB')
}

def get_db_connection():
    try:
        return mysql.connector.connect(**db_config)
    except mysql.connector.Error as err:
        print(f"Greška prilikom konekcije: {err}")
        raise

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
        cursor.execute("SELECT * FROM korisnici WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user and bcrypt.check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            return jsonify({'msg': 'Login uspješan', 'status': 'success', 'redirect': '/oprema'}), 200
        else:
            return jsonify({'msg': 'Pogrešan email ili lozinka', 'status': 'error'}), 401
    except mysql.connector.Error as err:
        return jsonify({'msg': f'Database error: {str(err)}', 'status': 'error'}), 500

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'msg': 'Sva polja su obavezna!', 'status': 'error'}), 400

    if '@' not in email or '.' not in email:
        return jsonify({'msg': 'Nevažeći email format!', 'status': 'error'}), 400

    if len(password) < 6:
        return jsonify({'msg': 'Lozinka mora imati najmanje 6 karaktera!', 'status': 'error'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM korisnici WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'msg': 'Korisnik već postoji!', 'status': 'error'}), 409

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        cursor.execute("INSERT INTO korisnici (email, password) VALUES (%s, %s)", (email, hashed_password))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'msg': 'Registracija uspješna!', 'status': 'success'}), 201
    except mysql.connector.Error as err:
        return jsonify({'msg': f'Database error: {str(err)}', 'status': 'error'}), 500

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'status': 'success'}), 200

@app.route('/unos', methods=['POST'])
def unos_artikla():
    if 'user_id' not in session:
        return jsonify({'msg': 'Morate biti prijavljeni!', 'status': 'error'}), 401

    data = request.get_json()
    naziv = data.get('naziv')
    kategorija_id = data.get('kategorija')
    proizvodjac_id = data.get('proizvodjac_id')
    lokacije_id = data.get('lokacije_id')
    cijena = data.get('cijena')

    if not naziv or not kategorija_id or cijena is None or not lokacije_id:
        return jsonify({'msg': 'Sva obavezna polja moraju biti popunjena!', 'status': 'error'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO oprema (naziv, cijena, kategorija_id, proizvodjac_id, lokacije_id, datum_objave)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """
        cursor.execute(query, (naziv, cijena, kategorija_id, proizvodjac_id, lokacije_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'msg': 'Artikal uspješno dodan!', 'status': 'success'}), 201
    except mysql.connector.Error as err:
        return jsonify({'msg': f'Database error: {str(err)}', 'status': 'error'}), 500

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
    except mysql.connector.Error as err:
        return jsonify({'msg': f'Database error: {str(err)}', 'status': 'error'}), 500

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
    except mysql.connector.Error as err:
        return jsonify({'msg': f'Database error: {str(err)}', 'status': 'error'}), 500

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
    except mysql.connector.Error as err:
        return jsonify({'msg': f'Database error: {str(err)}', 'status': 'error'}), 500

@app.route('/oprema', methods=['GET'])
def get_dijelovi():
    naziv = request.args.get('naziv', '')
    kategorija_naziv = request.args.get('kategorija', '')
    cijena_min = request.args.get('cijena_min', type=float)
    cijena_max = request.args.get('cijena_max', type=float)
    sort = request.args.get('sort', '')
    order = request.args.get('order', 'asc')
    lokacije_id = request.args.get('lokacije_id', type=int)

    # Dozvoljena sortiranja
    sort_map = {
        'cijena': 'o.cijena',
        'datum_objave': 'o.datum_objave'
    }
    allowed_order = ['asc', 'desc']
    sort_field = sort_map.get(sort, 'o.id')  # Default: sortiranje po ID-u
    order = order if order in allowed_order else 'asc'

    query = """
        SELECT 
            o.id,
            CONCAT_WS(' ', p.naziv, o.naziv) AS naziv,
            IFNULL(o.cijena, 0) AS cijena,
            k.naziv AS kategorija,
            o.datum_objave,
            l.naziv AS lokacija
        FROM oprema o
        JOIN kategorija k ON o.kategorija_id = k.id
        LEFT JOIN proizvodjac p ON o.proizvodjac_id = p.id
        LEFT JOIN lokacije l ON o.lokacije_id = l.id
        WHERE 1=1
    """
    params = []

    if naziv:
        query += " AND LOWER(CONCAT_WS(' ', p.naziv, o.naziv)) LIKE %s"
        params.append(f"%{naziv.lower()}%")
    if kategorija_naziv:
        query += " AND k.naziv = %s"
        params.append(kategorija_naziv)
    if cijena_min is not None:
        query += " AND o.cijena >= %s"
        params.append(cijena_min)
    if cijena_max is not None:
        query += " AND o.cijena <= %s"
        params.append(cijena_max)
    if lokacije_id:
        query += " AND o.lokacije_id = %s"
        params.append(lokacije_id)

    query += f" ORDER BY {sort_field} {order}"

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'data': result, 'status': 'success'}), 200
    except mysql.connector.Error as err:
        return jsonify({'msg': f'Database error: {str(err)}', 'status': 'error'}), 500

if __name__ == '__main__':
    app.run(debug=False, port=5000)
