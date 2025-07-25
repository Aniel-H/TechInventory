from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS, cross_origin
import mysql.connector
from mysql.connector import Error
import os
import jwt
import datetime
from functools import wraps
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from PIL import Image
import uuid
import io

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'tvoj_defaultni_tajni_kljuc_koji_mozes_promijeniti')

# Dozvoli CORS samo za frontend origin
CORS(app,
     resources={r"/*": {"origins": ["http://127.0.0.1:5500"]}},
     supports_credentials=True,
     allow_headers=["Authorization", "Content-Type"],
     expose_headers=["Authorization"])

db_config = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 3306)),  # default ako nije u .env
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME")
}

UPLOAD_FOLDER = r"C:\Users\aniel\OneDrive\Desktop\TechInventory\frontend\images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'jfif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        print("Konekcija na bazu uspješna")  # Debug
        return conn
    except Exception as e:
        print(f"Greška pri konekciji na bazu: {str(e)}")  # Debug
        raise

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
        if request.method == 'OPTIONS':
            return make_response('', 204)

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

    import re
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        return jsonify({'msg': 'Nevažeća email adresa!', 'status': 'error'}), 400
    if len(password) < 6:
        return jsonify({'msg': 'Lozinka mora imati najmanje 6 karaktera!', 'status': 'error'}), 400

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
        print(f"Greška u signup: {str(e)}")
        return jsonify({'msg': f'Greška na serveru: {str(e)}', 'status': 'error'}), 500

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
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=120)
            }, app.config['SECRET_KEY'], algorithm="HS256")

            return jsonify({'msg': 'Login uspješan', 'status': 'success', 'token': token}), 200
        else:
            return jsonify({'msg': 'Pogrešan email ili lozinka', 'status': 'error'}), 401

    except Exception as e:
        print(f"Greška u login: {str(e)}")  # Debug
        return jsonify({'msg': f'Greška na serveru: {str(e)}', 'status': 'error'}), 500

@app.route('/logout', methods=['POST'])
@token_required
def logout(user_id):
    return jsonify({'msg': 'Odjava uspješna', 'status': 'success'}), 200


@app.route('/unos', methods=['POST', 'OPTIONS'])
def unos_artikla():
    if request.method == 'OPTIONS':
        # Ovdje jednostavno vratite praznu 204 reakciju da preflight prođe
        return '', 204

    # Ostatak funkcije ide sa token_required dekoratorom i logikom unosa...
    # Pošto ste koristili @token_required, premjestite ga ovdje "ručno"

    proizvodjac_id = request.form.get('proizvodjac_id')

    if not proizvodjac_id or proizvodjac_id.strip().lower() in ["", "0", "null", "none"]:
        proizvodjac_id = None
    else:
        try:
            proizvodjac_id = int(proizvodjac_id)
        except (TypeError, ValueError):
            proizvodjac_id = None

    # Provjerite i validirajte token ovdje:
    token = None
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        parts = auth_header.split()
        if len(parts) == 2 and parts[0] == 'Bearer':
            token = parts[1]
    if not token:
        return jsonify({'msg': 'Token nije pronađen!', 'status': 'error'}), 401

    try:
        user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])['user_id']
    except Exception:
        return jsonify({'msg': 'Nevažeći token!', 'status': 'error'}), 401

    try:
        naziv = request.form.get('naziv')
        kategorija_id = request.form.get('kategorija')
        proizvodjac_id = request.form.get('proizvodjac_id')
        lokacije_id = request.form.get('lokacije_id')
        stanje = request.form.get('stanje')
        cijena = request.form.get('cijena')
        status = request.form.get('status', 0)
        slika = request.files.get('slika')

        if not all([naziv, kategorija_id, lokacije_id, stanje, cijena]):
            return jsonify({'msg': 'Sva obavezna polja moraju biti popunjena!', 'status': 'error'}), 400

        slika_ime = None
        if slika and allowed_file(slika.filename):
            ekstenzija = os.path.splitext(slika.filename)[1]
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            random_str = uuid.uuid4().hex[:6]
            slika_ime = f"slika_{timestamp}_{random_str}{ekstenzija}"

            slika_path = os.path.join(UPLOAD_FOLDER, slika_ime)
            slika.save(slika_path)

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO oprema (naziv, cijena, kategorija_id, proizvodjac_id, lokacije_id, datum_objave, stanje, status, slika)
               VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s)""",
            (naziv, cijena, kategorija_id, proizvodjac_id, lokacije_id, stanje, status, slika_ime)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"msg": "Artikal uspješno dodan!"}), 201

    except Exception as e:
        print(f"Greška u unos_artikla: {str(e)}")
        return jsonify({'msg': f'Greška pri unosu u bazu: {str(e)}', 'status': 'error'}), 500

@app.route("/artikal/<int:id>", methods=["GET", "PUT"])
@token_required
def pojedinacni_artikal(current_user_id, id):
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
        )
        cursor = conn.cursor(dictionary=True)

        if request.method == "GET":
            cursor.execute("SELECT * FROM oprema WHERE id = %s", (id,))
            artikal = cursor.fetchone()
            if artikal:
                return jsonify(artikal)
            else:
                return jsonify({"message": "Artikal nije pronađen"}), 404

        if request.method == "PUT":
            data = request.get_json()
            naziv = data.get("naziv")
            kategorija_id = data.get("kategorija_id")
            proizvodjac_id = data.get("proizvodjac_id")
            lokacije_id = data.get("lokacije_id")
            stanje = data.get("stanje")
            status = data.get("status")
            cijena = data.get("cijena")

            update_query = """
                UPDATE oprema SET
                    naziv = %s,
                    kategorija_id = %s,
                    proizvodjac_id = %s,
                    lokacije_id = %s,
                    stanje = %s,
                    status = %s,
                    cijena = %s
                WHERE id = %s
            """
            cursor.execute(update_query, (
                naziv, kategorija_id, proizvodjac_id,
                lokacije_id, stanje, status, cijena, id
            ))
            conn.commit()
            return jsonify({"message": "Artikal ažuriran"}), 200

    except mysql.connector.Error as err:
        return jsonify({"message": f"Greška u bazi: {err}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/stanja', methods=['GET'])
def get_stanja():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT DISTINCT stanje FROM oprema WHERE stanje IS NOT NULL")
        rows = cursor.fetchall()
        data = [{'naziv': row['stanje']} for row in rows]
        cursor.close()
        conn.close()
        return jsonify({'data': data, 'status': 'success'}), 200
    except Exception as e:
        print(f"Greška u get_stanja: {str(e)}")
        return jsonify({'msg': f'Greška pri dohvaćanju stanja: {str(e)}', 'status': 'error'}), 500

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
    except Exception as e:
        print(f"Greška u get_kategorije: {str(e)}")
        return jsonify({'msg': f'Greška pri dohvaćanju kategorija: {str(e)}', 'status': 'error'}), 500

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
    except Exception as e:
        print(f"Greška u get_proizvodjaci: {str(e)}")
        return jsonify({'msg': f'Greška pri dohvaćanju proizvođača: {str(e)}', 'status': 'error'}), 500

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
    except Exception as e:
        print(f"Greška u get_lokacije: {str(e)}")
        return jsonify({'msg': f'Greška pri dohvaćanju lokacija: {str(e)}', 'status': 'error'}), 500

@app.route('/delete/<int:id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_oprema(user_id, id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM oprema WHERE id = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'msg': 'Artikal uspješno obrisan.', 'status': 'success'}), 200
    except Exception as e:
        print(f"Greška u delete_oprema: {str(e)}")
        return jsonify({'msg': f'Greška pri brisanju: {str(e)}', 'status': 'error'}), 500

@app.route('/oprema', methods=['GET'])
def get_oprema():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        kategorija = request.args.get('kategorija')
        lokacije_id = request.args.get('lokacije_id')
        cijena_od = request.args.get('cijena_od')
        cijena_do = request.args.get('cijena_do')
        stanje = request.args.get('stanje')
        status = request.args.get('status')
        sort = request.args.get('sort', 'cijena')
        order = request.args.get('order', 'asc')
        search = request.args.get('search', '').strip()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        datum_od = request.args.get('datum_od')
        datum_do = request.args.get('datum_do')

        query = """
            SELECT o.id,
                   CONCAT(COALESCE(p.naziv, ''), 
                       CASE WHEN p.naziv IS NOT NULL THEN ' ' ELSE '' END, 
                       o.naziv) AS naziv,
                   o.cijena,
                   k.naziv AS kategorija,
                   l.naziv AS lokacija,
                   o.datum_objave,
                   o.stanje,
                   o.status,
                   o.slika
            FROM oprema o
            LEFT JOIN proizvodjac p ON o.proizvodjac_id = p.id
            LEFT JOIN kategorija k ON o.kategorija_id = k.id
            LEFT JOIN lokacije l ON o.lokacije_id = l.id
            WHERE 1=1
        """
        params = []

        if search:
            like = f"%{search}%"
            query += """
                AND (
                    o.naziv LIKE %s
                    OR p.naziv LIKE %s
                    OR CONCAT_WS(' ', p.naziv, o.naziv) LIKE %s
                )
            """
            params.extend([like, like, like])

        if kategorija:
            query += " AND k.naziv = %s"
            params.append(kategorija)
        if lokacije_id:
            query += " AND o.lokacije_id = %s"
            params.append(lokacije_id)
        if cijena_od:
            query += " AND o.cijena >= %s"
            params.append(float(cijena_od))
        if cijena_do:
            query += " AND o.cijena <= %s"
            params.append(float(cijena_do))
        if stanje:
            query += " AND o.stanje = %s"
            params.append(stanje)
        if status in ['0', '1']:
            query += " AND o.status = %s"
            params.append(int(status))

        # Dodaj filtraciju po datumu objave
        from datetime import datetime
        if datum_od:
            try:
                # Provjeri format, odbaci ako ne valja
                datetime.strptime(datum_od, "%Y-%m-%d")
                query += " AND o.datum_objave >= %s"
                params.append(datum_od)
            except ValueError:
                return jsonify({'msg': 'Neispravan format datum_od (koristi YYYY-MM-DD)', 'status': 'error'}), 400

        if datum_do:
            try:
                datetime.strptime(datum_do, "%Y-%m-%d")
                query += " AND o.datum_objave <= %s"
                params.append(datum_do)
            except ValueError:
                return jsonify({'msg': 'Neispravan format datum_do (koristi YYYY-MM-DD)', 'status': 'error'}), 400

        allowed_sorts = ['id', 'naziv', 'cijena', 'datum_objave']
        if sort not in allowed_sorts:
            sort = 'id'
        order = order.upper()
        if order not in ['ASC', 'DESC']:
            order = 'DESC'

        query += f" ORDER BY o.{sort} {order.upper()}"

        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])

        cursor.execute(query, params)
        data = cursor.fetchall()

        # COUNT query
        count_query = """
            SELECT COUNT(*) as total FROM oprema o
            LEFT JOIN proizvodjac p ON o.proizvodjac_id = p.id
            LEFT JOIN kategorija k ON o.kategorija_id = k.id
            LEFT JOIN lokacije l ON o.lokacije_id = l.id
            WHERE 1=1
        """
        count_params = []

        if search:
            count_query += """
                AND (
                    o.naziv LIKE %s
                    OR p.naziv LIKE %s
                    OR CONCAT_WS(' ', p.naziv, o.naziv) LIKE %s
                )
            """
            count_params.extend([like, like, like])

        if kategorija:
            count_query += " AND k.naziv = %s"
            count_params.append(kategorija)
        if lokacije_id:
            count_query += " AND o.lokacije_id = %s"
            count_params.append(lokacije_id)
        if cijena_od:
            count_query += " AND o.cijena >= %s"
            count_params.append(float(cijena_od))
        if cijena_do:
            count_query += " AND o.cijena <= %s"
            count_params.append(float(cijena_do))
        if stanje:
            count_query += " AND o.stanje = %s"
            count_params.append(stanje)
        if status in ['0', '1']:
            count_query += " AND o.status = %s"
            count_params.append(int(status))

        # I filter za datum u count_query
        if datum_od:
            count_query += " AND o.datum_objave >= %s"
            count_params.append(datum_od)
        if datum_do:
            count_query += " AND o.datum_objave <= %s"
            count_params.append(datum_do)

        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']

        cursor.close()
        conn.close()

        total_pages = (total + per_page - 1) // per_page  # zaokruživanje naviše
        return jsonify({
            'data': data,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'status': 'success'
        }), 200

        return jsonify({'data': data, 'total': total, 'page': page, 'per_page': per_page, 'status': 'success'}), 200

    except Exception as e:
        print(f"Greška u get_oprema: {str(e)}")
        return jsonify({'msg': f'Greška pri dohvaćanju opreme: {str(e)}', 'status': 'error'}), 500

@app.route('/oprema/<int:id>', methods=['GET'])
def get_oprema_by_id(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM oprema WHERE id = %s", (id,))
    item = cursor.fetchone()
    cursor.close()
    conn.close()
    if item:
        return jsonify({'status': 'success', 'data': item}), 200
    else:
        return jsonify({'status': 'error', 'msg': 'Artikal nije pronađen'}), 404

@app.route('/oprema/<int:id>', methods=['PUT'])
def update_oprema(id):
    data = request.get_json()
    # Validacija i priprema polja
    naziv = data.get('naziv')
    kategorija = data.get('kategorija')
    proizvodjac_id = data.get('proizvodjac_id')
    lokacije_id = data.get('lokacije_id')
    stanje = data.get('stanje')
    status = data.get('status')
    cijena = data.get('cijena')

    if not proizvodjac_id or proizvodjac_id in ["", "null", "None", "0"]:
        proizvodjac_id = None

    if not all([naziv, kategorija, lokacije_id, cijena]):
        return jsonify({'status': 'error', 'msg': 'Obavezna polja nedostaju'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE oprema
        SET naziv=%s, kategorija_id=%s, proizvodjac_id=%s, lokacije_id=%s,
            stanje=%s, status=%s, cijena=%s
        WHERE id=%s
    """, (naziv, kategorija, proizvodjac_id, lokacije_id, stanje, status, cijena, id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'status': 'success', 'msg': 'Artikal je ažuriran'}), 200

@app.route('/images/<filename>')
@cross_origin(origins="http://127.0.0.1:5500")
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'msg': 'Nema datoteke'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'error', 'msg': 'Nema imena datoteke'}), 400

    if not allowed_file(file.filename):
        return jsonify({'status': 'error', 'msg': 'Nepodržani format datoteke'}), 400

    try:
        # Otvori sliku pomoću PIL
        image = Image.open(file.stream).convert("RGB")  # RGB zbog WebP podrške

        # Generiši jedinstveno ime
        unique_name = f"{uuid.uuid4().hex[:8]}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.webp"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)

        # Sačuvaj kao webp uz nisku kvalitetu (npr. 50)
        image.save(filepath, "WEBP", quality=50)

        return jsonify({'status': 'success', 'filepath': f'images/{unique_name}'})
    except Exception as e:
        return jsonify({'status': 'error', 'msg': f'Greška pri obradi slike: {str(e)}'}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
