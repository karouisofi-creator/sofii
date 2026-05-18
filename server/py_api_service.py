from flask import Flask, request, jsonify
import pyodbc
import bcrypt
import os

FAILED_DB_SERVERS_LOGGED = set()

app = Flask(__name__)

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    configured_origin = os.getenv('CORS_ALLOW_ORIGIN', '*')
    request_origin = request.headers.get('Origin')
    if configured_origin == '*':
        response.headers['Access-Control-Allow-Origin'] = request_origin or '*'
        response.headers['Vary'] = 'Origin'
    else:
        response.headers['Access-Control-Allow-Origin'] = configured_origin
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    return response

# --- TICKETS ENDPOINTS ---
@app.route('/tickets', methods=['POST'])
def create_ticket():
    data = request.get_json()
    userId = data.get('userId')
    userEmail = data.get('userEmail')
    title = data.get('title')
    description = data.get('description')
    type_ = data.get('type')
    perimeter = data.get('perimeter')
    format_ = data.get('format')
    urgency = data.get('urgency')
    status = data.get('status', 'En attente')
    if not all([title, description, type_, perimeter, format_, urgency]):
        return jsonify({'error': 'Tous les champs obligatoires doivent être remplis'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        INSERT INTO tickets (userId, userEmail, title, description, type, perimeter, format, urgency, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
        ''',
        (userId, userEmail, title, description, type_, perimeter, format_, urgency, status)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Ticket created successfully'}), 201

@app.route('/tickets', methods=['GET'])
def get_tickets():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''SELECT id, userId, userEmail, title, description, type, perimeter, format, urgency, status, createdAt, updatedAt, solution, solvedBy, solvedAt FROM tickets ORDER BY createdAt DESC''')
    tickets = [
        dict(zip([column[0] for column in cursor.description], row))
        for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify(tickets)

@app.route('/tickets/<int:ticket_id>', methods=['PATCH'])
def update_ticket(ticket_id):
    data = request.get_json()
    status = data.get('status')
    solution = data.get('solution')
    solvedBy = data.get('solvedBy')
    update_fields = []
    update_values = []
    if status:
        update_fields.append('status=?')
        update_values.append(status)
    if solution:
        update_fields.append('solution=?')
        update_values.append(solution)
    if solvedBy:
        update_fields.append('solvedBy=?')
        update_values.append(solvedBy)
        update_fields.append('solvedAt=GETDATE()')
    update_fields.append('updatedAt=GETDATE()')
    if not update_fields:
        return jsonify({'error': 'No fields to update'}), 400
    sql = f"UPDATE tickets SET {', '.join(update_fields)} WHERE id=?"
    update_values.append(ticket_id)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, tuple(update_values))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Ticket updated'}), 200


# --- REPORTS ENDPOINTS ---
@app.route('/reports', methods=['POST'])
def create_report():
    data = request.get_json()
    userId = data.get('userId')
    userEmail = data.get('userEmail')
    title = data.get('title')
    description = data.get('description')
    if not title or not description:
        return jsonify({'error': 'Title and description required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        INSERT INTO reports (userId, userEmail, title, description, status, createdAt)
        VALUES (?, ?, ?, ?, 'open', GETDATE())
        ''',
        (userId, userEmail, title, description)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Report created successfully'}), 201

# List all reports
@app.route('/reports', methods=['GET'])
def get_reports():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''SELECT id, userId, userEmail, title, description, status, createdAt, updatedAt, solvedBy, solvedAt, solution FROM reports ORDER BY createdAt DESC''')
    reports = [
        dict(zip([column[0] for column in cursor.description], row))
        for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify(reports)

# Solve a report (admin)
@app.route('/reports/<int:report_id>', methods=['PATCH'])
def solve_report(report_id):
    data = request.get_json()
    solution = data.get('solution')
    solvedBy = data.get('solvedBy')
    if not solution or not solvedBy:
        return jsonify({'error': 'Solution and solvedBy required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        UPDATE reports SET status='solved', solution=?, solvedBy=?, solvedAt=GETDATE(), updatedAt=GETDATE() WHERE id=?
        ''',
        (solution, solvedBy, report_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Report solved'}), 200


# --- LOGS ENDPOINTS ---
@app.route('/logs', methods=['POST'])
def add_log():
    data = request.get_json()
    userId = data.get('userId')
    userEmail = data.get('userEmail')
    action = data.get('action')
    details = data.get('details', '')
    ip = data.get('ip')
    if not action:
        return jsonify({'error': 'Action is required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO logs (userId, userEmail, action, details, ip, createdAt)
        VALUES (?, ?, ?, ?, ?, GETDATE())
        """,
        (userId, userEmail, action, details, ip)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Log added successfully'}), 201

@app.route('/logs', methods=['GET'])
def get_logs():
    limit = int(request.args.get('limit', 100))
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT TOP {limit} id, userId, userEmail, action, details, ip, createdAt FROM logs ORDER BY createdAt DESC")
    logs = [
        dict(zip([column[0] for column in cursor.description], row))
        for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify(logs)


@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    fullName = data.get('fullName', email)
    role = data.get('role', 'user')
    isActive = data.get('isActive', True)

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (email, passwordHash, fullName, role, isActive) VALUES (?, ?, ?, ?, ?)",
        (email, password_hash, fullName, role, isActive)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'User created successfully', 'email': email}), 201

@app.before_request
def log_request_info():
    print('Request:', request.method, request.path)

def get_db_connection():
    def normalize_server_name(raw_server):
        if not raw_server:
            return ""
        current = str(raw_server).strip().strip('"').strip("'")
        current = current.replace('\\\\', '\\')
        if current.lower().startswith('np:') and '\\\\' in current:
            current = current.replace('\\\\', '\\')
        return current

    database = os.getenv('DB_DATABASE', 'DataFlow')
    timeout = int(os.getenv('DB_CONNECT_TIMEOUT', '5'))
    candidate_servers = []

    env_server = os.getenv('DB_SERVER', r'(localdb)\MyInstance')
    if env_server:
        candidate_servers.append(env_server)

    env_named_pipe = os.getenv('DB_NAMED_PIPE')
    if env_named_pipe:
        candidate_servers.append(env_named_pipe)

    for fallback_server in [r'(localdb)\MyInstance', r'(localdb)\MSSQLLocalDB']:
        if fallback_server not in candidate_servers:
            candidate_servers.append(fallback_server)

    normalized_candidates = []
    for server in candidate_servers:
        current = normalize_server_name(server)
        if current and current not in normalized_candidates:
            normalized_candidates.append(current)

    last_error = None
    for server in normalized_candidates:
        conn_str = (
            r'DRIVER={ODBC Driver 17 for SQL Server};'
            f'SERVER={server};'
            f'DATABASE={database};'
            r'Trusted_Connection=yes;'
            r'TrustServerCertificate=yes;'
        )
        try:
            return pyodbc.connect(conn_str, timeout=timeout)
        except Exception as e:
            last_error = e
            if server not in FAILED_DB_SERVERS_LOGGED:
                print(f"[DB CONNECTION TRY FAILED] server={server} error={e}")
                FAILED_DB_SERVERS_LOGGED.add(server)

    print(f"[DB CONNECTION ERROR] Could not connect using servers={normalized_candidates}. Last error: {last_error}")
    raise last_error

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, fullName, role, isActive, passwordHash FROM users WHERE email = ?", email)
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Invalid credentials'}), 401
    user = {
        'id': row[0],
        'email': row[1],
        'fullName': row[2],
        'role': row[3],
        'isActive': row[4],
    }
    password_hash = row[5]
    if not bcrypt.checkpw(password.encode(), password_hash.encode()):
        return jsonify({'error': 'Invalid credentials'}), 401
    return jsonify({'message': 'Login successful', 'user': user})

@app.route('/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, fullName, role, isActive FROM users")
    users = [
        dict(zip([column[0] for column in cursor.description], row))
        for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify(users)

# ============== BATCH PROCESSING ENDPOINTS ==============
@app.route('/api/batch', methods=['GET'])
def get_batches():
    """Get all batch processes from database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, nom, description, categorie, parametres, actif FROM BatchProcesses ORDER BY nom")
        batches = [
            dict(zip([column[0] for column in cursor.description], row))
            for row in cursor.fetchall()
        ]
        conn.close()
        return jsonify(batches)
    except Exception as e:
        print(f"[BATCH ERROR] {e}")
        # Return empty list if table doesn't exist yet
        return jsonify([])

@app.route('/api/batch/<int:batch_id>/execute', methods=['POST'])
def execute_batch(batch_id):
    """Execute a batch process with parameters"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get batch definition
        cursor.execute("SELECT nom, requete_sql, parametres FROM BatchProcesses WHERE id = ?", batch_id)
        batch = cursor.fetchone()
        
        if not batch:
            return jsonify({'error': 'Batch not found'}), 404
        
        batch_name, sql_query, params_str = batch[0], batch[1], batch[2]
        
        # Replace parameters in SQL query
        if data:
            for key, value in data.items():
                if value:
                    sql_query = sql_query.replace(f"{{{key}}}", f"'{value}'")
        
        # Execute the query
        cursor.execute(sql_query)
        rows = cursor.fetchall()
        result = [
            dict(zip([column[0] for column in cursor.description], row))
            for row in rows
        ]
        conn.close()
        
        return jsonify({
            'batch': batch_name,
            'total': len(result),
            'data': result
        })
    except Exception as e:
        print(f"[BATCH EXECUTE ERROR] {e}")
        return jsonify({'error': str(e)}), 500

# ============== DASHBOARD DATA ENDPOINTS ==============
def _rows_to_dicts(cursor):
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def _build_claim_filters(args):
    clauses = []
    params = []

    centre = args.get('centre')
    centres = args.get('centres')
    date_debut = args.get('date_debut') or args.get('dateDebut')
    date_fin = args.get('date_fin') or args.get('dateFin')
    marque = args.get('marque')
    nom_assureur = args.get('nom_assureur') or args.get('nomAssureur')
    team = args.get('team')
    agent = args.get('agent') or args.get('nameAgent')

    if centre:
        clauses.append("site_gestion_theo = ?")
        params.append(centre)
    elif centres:
        values = [value.strip() for value in centres.split(',') if value.strip()]
        if values:
            placeholders = ','.join(['?'] * len(values))
            clauses.append(f"site_gestion_theo IN ({placeholders})")
            params.extend(values)
    if date_debut:
        clauses.append("CAST(date_survenance AS DATE) >= CAST(? AS DATE)")
        params.append(date_debut)
    if date_fin:
        clauses.append("CAST(date_survenance AS DATE) <= CAST(? AS DATE)")
        params.append(date_fin)
    if marque:
        clauses.append("marque = ?")
        params.append(marque)
    if nom_assureur:
        clauses.append("nom_assureur = ?")
        params.append(nom_assureur)
    if team:
        clauses.append("site_gestion_theo = ?")
        params.append(team)
    if agent:
        clauses.append("utilisateur = ?")
        params.append(agent)

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    return where_sql, params


CLAIM_COLUMN_CACHE = {}


def _has_column(conn, table_name, column_name):
    cache_key = f"{table_name}.{column_name}"
    if cache_key in CLAIM_COLUMN_CACHE:
        return CLAIM_COLUMN_CACHE[cache_key]

    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'dbo'
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        """,
        (table_name, column_name),
    )
    exists = cursor.fetchone() is not None
    CLAIM_COLUMN_CACHE[cache_key] = exists
    return exists


def _rejection_reason_expression(has_column):
    if has_column:
        return "NULLIF(LTRIM(RTRIM(c.rejection_reason)), '')"

    return "CASE WHEN UPPER(ISNULL(c.code_etat, '')) IN ('REJETE', 'RJ', 'REJECTED') THEN 'Rejeté' ELSE NULL END"


@app.route('/api/data/filters', methods=['GET'])
def get_filters():
    """Get available filters for dashboard from real claims table."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT DISTINCT marque FROM dbo.claims_closed WHERE marque IS NOT NULL AND LTRIM(RTRIM(marque)) <> '' ORDER BY marque")
        marques = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT nom_assureur FROM dbo.claims_closed WHERE nom_assureur IS NOT NULL AND LTRIM(RTRIM(nom_assureur)) <> '' ORDER BY nom_assureur")
        assureurs = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT site_gestion_theo FROM dbo.claims_closed WHERE site_gestion_theo IS NOT NULL AND LTRIM(RTRIM(site_gestion_theo)) <> '' ORDER BY site_gestion_theo")
        teams = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT utilisateur FROM dbo.claims_closed WHERE utilisateur IS NOT NULL AND LTRIM(RTRIM(utilisateur)) <> '' ORDER BY utilisateur")
        agents = [row[0] for row in cursor.fetchall()]

        conn.close()
        return jsonify({
            'marques': marques,
            'assureurs': assureurs,
            'teams': teams,
            'agents': agents
        })
    except Exception as e:
        print(f"[FILTERS ERROR] {e}")
        return jsonify({'marques': [], 'assureurs': [], 'teams': [], 'agents': []})


@app.route('/api/data/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get dashboard KPI data with filters from real claims table."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        where_sql, params = _build_claim_filters(request.args)

        cursor.execute(
            f"""
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN UPPER(ISNULL(code_etat, '')) IN ('TE', 'CLOSED', 'TERMINE', 'TERMINÉ') THEN 1 ELSE 0 END) AS termines,
                SUM(CASE WHEN UPPER(ISNULL(code_etat, '')) IN ('REJETE', 'REJETE', 'RJ') THEN 1 ELSE 0 END) AS rejetes,
                ISNULL(SUM(ISNULL(montant_rebt_dp, 0)), 0) AS total_rembourse
            FROM dbo.claims_closed
            {where_sql}
            """,
            params
        )
        row = cursor.fetchone()
        total = int(row[0] or 0)
        termines = int(row[1] or 0)
        rejetes = int(row[2] or 0)
        total_rembourse = float(row[3] or 0)

        cursor.execute(
            f"""
            SELECT
                ISNULL(site_gestion_theo, 'N/A') AS centre,
                COUNT(*) AS total
            FROM dbo.claims_closed
            {where_sql}
            GROUP BY site_gestion_theo
            ORDER BY total DESC
            """,
            params
        )
        par_centre = _rows_to_dicts(cursor)

        conn.close()

        return jsonify({
            'sinistres': {
                'total': total,
                'termines': termines,
                'en_cours': max(total - termines, 0),
                'rejetes': rejetes,
                'total_soumis': total_rembourse,
                'total_rembourse': total_rembourse
            },
            'parCentre': par_centre
        })
    except Exception as e:
        print(f"[DASHBOARD ERROR] {e}")
        return jsonify({'sinistres': {}, 'parCentre': []})


@app.route('/api/data/teams', methods=['GET'])
def get_teams():
    """Get team performance data from real claims table."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        where_sql, params = _build_claim_filters(request.args)

        cursor.execute(
            f"""
            SELECT
                ISNULL(c.site_gestion_theo, 'N/A') AS team,
                ISNULL(c.utilisateur, 'N/A') AS agent,
                ISNULL(c.site_gestion_theo, 'N/A') AS centre,
                CAST(AVG(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 20 THEN 100.0 ELSE 0.0 END) AS DECIMAL(10,2)) AS provider_claim_20days,
                SUM(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 20 THEN 1 ELSE 0 END) AS nb_claim_treated_20d,
                SUM(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 30 THEN 1 ELSE 0 END) AS nb_claim_treated_30d,
                COUNT(DISTINCT c.id_sinistre) AS nb_claims_treated,
                COUNT(l.id_ligne) AS nb_ligne_claims_treated,
                COUNT(DISTINCT CASE WHEN l.id_ligne IS NOT NULL THEN c.id_sinistre END) AS nb_claims_ss,
                COUNT(l.id_ligne) AS nb_ligne_claims_ss
                        FROM dbo.claims_closed c
            LEFT JOIN dbo.claims_closed_lines l
              ON l.id_sinistre = c.id_sinistre AND l.num_sinistre = c.num_sinistre
            {where_sql}
            GROUP BY c.site_gestion_theo, c.utilisateur
            ORDER BY nb_claims_treated DESC, team ASC, agent ASC
            """,
            params
        )
        teams = _rows_to_dicts(cursor)
        conn.close()
        return jsonify(teams)
    except Exception as e:
        print(f"[TEAMS ERROR] {e}")
        return jsonify([])


@app.route('/api/data/sinistres', methods=['GET'])
def get_sinistres():
    """Get active claims list from real claims table."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT TOP 500
                id_sinistre,
                num_sinistre,
                code_etat,
                date_survenance AS date_sinistre,
                date_ouverture,
                marque,
                nom_assureur,
                site_gestion_theo AS centre,
                utilisateur,
                montant_rebt_dp
            FROM dbo.claims_closed
            WHERE UPPER(ISNULL(code_etat, '')) NOT IN ('TE', 'CLOSED', 'TERMINE', 'TERMINÉ')
            ORDER BY date_survenance DESC
            """
        )
        sinistres = _rows_to_dicts(cursor)
        conn.close()
        return jsonify(sinistres)
    except Exception as e:
        print(f"[SINISTRES ERROR] {e}")
        return jsonify([])


@app.route('/api/data/sinistres-termines', methods=['GET'])
def get_sinistres_termines():
    """Get closed claims list from real claims table."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT TOP 1000
                id_sinistre,
                num_sinistre,
                code_etat,
                date_survenance AS date_sinistre,
                date_ouverture,
                date_cloture,
                marque,
                nom_assureur,
                site_gestion_theo AS centre,
                utilisateur,
                montant_rebt_dp
            FROM dbo.claims_closed
            WHERE UPPER(ISNULL(code_etat, '')) IN ('TE', 'CLOSED', 'TERMINE', 'TERMINÉ')
            ORDER BY date_cloture DESC
            """
        )
        sinistres = _rows_to_dicts(cursor)
        conn.close()
        return jsonify(sinistres)
    except Exception as e:
        print(f"[SINISTRES TERMINES ERROR] {e}")
        return jsonify([])


@app.route('/api/data/monthly-trends', methods=['GET'])
def get_monthly_trends():
    """Get monthly claim trends from real claims table."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                YEAR(date_cloture) AS annee,
                MONTH(date_cloture) AS mois_num,
                COUNT(*) AS sinistres
            FROM dbo.claims_closed
            WHERE date_cloture IS NOT NULL
            GROUP BY YEAR(date_cloture), MONTH(date_cloture)
            ORDER BY annee, mois_num
            """
        )

        month_labels = {
            1: 'Jan', 2: 'Fév', 3: 'Mar', 4: 'Avr', 5: 'Mai', 6: 'Juin',
            7: 'Juil', 8: 'Aoû', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Déc'
        }
        trends = []
        for row in cursor.fetchall():
            mois_num = int(row[1])
            trends.append({
                'mois': month_labels.get(mois_num, str(mois_num)),
                'sinistres': int(row[2] or 0)
            })

        conn.close()
        return jsonify(trends)
    except Exception as e:
        print(f"[MONTHLY TRENDS ERROR] {e}")
        return jsonify([])


@app.route('/api/data/top-ec-reasons', methods=['GET'])
def get_top_ec_reasons():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        where_sql, params = _build_claim_filters(request.args)
        has_ec_reason = _has_column(conn, 'claims_closed', 'EC_REASON')
        reason_expr = "NULLIF(LTRIM(RTRIM(EC_REASON)), '')" if has_ec_reason else "NULLIF(LTRIM(RTRIM(type_of_log)), '')"

        cursor.execute(
            f"""
            SELECT TOP 10
                COALESCE({reason_expr}, 'Autre') AS name,
                COUNT(*) AS value
            FROM dbo.claims_closed
            {where_sql}
            GROUP BY COALESCE({reason_expr}, 'Autre')
            ORDER BY value DESC, name ASC
            """,
            params,
        )
        rows = _rows_to_dicts(cursor)
        conn.close()
        return jsonify(rows)
    except Exception as e:
        print(f"[TOP EC REASONS ERROR] {e}")
        return jsonify([])


@app.route('/api/data/adjustment-reasons', methods=['GET'])
def get_adjustment_reasons():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        where_sql, params = _build_claim_filters(request.args)
        has_adjustment_reason = _has_column(conn, 'claims_closed', 'ADJUSTMENT_REASON')
        reason_expr = "NULLIF(LTRIM(RTRIM(ADJUSTMENT_REASON)), '')" if has_adjustment_reason else "NULLIF(LTRIM(RTRIM(type_of_log)), '')"

        cursor.execute(
            f"""
            SELECT TOP 10
                COALESCE({reason_expr}, 'Autre') AS name,
                COUNT(*) AS value
            FROM dbo.claims_closed
            {where_sql}
            GROUP BY COALESCE({reason_expr}, 'Autre')
            ORDER BY value DESC, name ASC
            """,
            params,
        )
        rows = _rows_to_dicts(cursor)
        conn.close()
        return jsonify(rows)
    except Exception as e:
        print(f"[ADJUSTMENT REASONS ERROR] {e}")
        return jsonify([])


@app.route('/api/data/top-rejection-reasons', methods=['GET'])
def get_top_rejection_reasons():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        where_sql, params = _build_claim_filters(request.args)
        has_rejection_reason = _has_column(conn, 'claims_closed', 'rejection_reason')
        rejection_expr = _rejection_reason_expression(has_rejection_reason)

        cursor.execute(
            f"""
            SELECT TOP 10
                COALESCE({rejection_expr}, 'Autre') AS name,
                COUNT(*) AS value
            FROM dbo.claims_closed c
            {where_sql}
            GROUP BY COALESCE({rejection_expr}, 'Autre')
            ORDER BY value DESC, name ASC
            """,
            params,
        )
        rows = _rows_to_dicts(cursor)
        conn.close()
        return jsonify(rows)
    except Exception as e:
        print(f"[TOP REJECTION REASONS ERROR] {e}")
        return jsonify([])


@app.route('/api/data/insured-claims-center', methods=['GET'])
def get_insured_claims_center():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        where_sql, params = _build_claim_filters(request.args)

        cursor.execute(
            f"""
            SELECT
                ISNULL(site_gestion_theo, 'N/A') AS centre,
                COUNT(DISTINCT id_sinistre) AS nb_insured_claims_treated,
                SUM(CASE WHEN date_cloture IS NOT NULL AND date_survenance IS NOT NULL AND DATEDIFF(DAY, date_survenance, date_cloture) <= 5 THEN 1 ELSE 0 END) AS nb_insured_claims_treated_5d,
                AVG(CASE WHEN date_cloture IS NOT NULL AND date_survenance IS NOT NULL THEN DATEDIFF(DAY, date_survenance, date_cloture) * 1.0 END) AS tat_5_days,
                CAST(5 AS DECIMAL(10,2)) AS target_5days,
                CAST(5.5 AS DECIMAL(10,2)) AS tolerance_5days
            FROM dbo.claims_closed
            {where_sql}
            GROUP BY site_gestion_theo
            ORDER BY nb_insured_claims_treated DESC, centre ASC
            """,
            params,
        )
        rows = _rows_to_dicts(cursor)
        conn.close()
        return jsonify(rows)
    except Exception as e:
        print(f"[INSURED CLAIMS CENTER ERROR] {e}")
        return jsonify([])


@app.route('/api/data/provider-claims-center', methods=['GET'])
def get_provider_claims_center():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        where_sql, params = _build_claim_filters(request.args)

        cursor.execute(
            f"""
            SELECT
                ISNULL(c.site_gestion_theo, 'N/A') AS centre,
                CAST(AVG(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 20 THEN 100.0 ELSE 0.0 END) AS DECIMAL(10,2)) AS provider_claim_20days,
                SUM(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 20 THEN 1 ELSE 0 END) AS nb_claim_treated_20d,
                SUM(CASE WHEN c.date_cloture IS NOT NULL AND c.date_survenance IS NOT NULL AND DATEDIFF(DAY, c.date_survenance, c.date_cloture) <= 30 THEN 1 ELSE 0 END) AS nb_claim_treated_30d,
                COUNT(DISTINCT c.id_sinistre) AS nb_claims_treated,
                COUNT(l.id_ligne) AS nb_ligne_claims_treated,
                COUNT(DISTINCT CASE WHEN l.id_ligne IS NOT NULL THEN c.id_sinistre END) AS nb_claims_ss,
                COUNT(l.id_ligne) AS nb_ligne_claims_ss
            FROM dbo.claims_closed c
            LEFT JOIN dbo.claims_closed_lines l
              ON l.id_sinistre = c.id_sinistre AND l.num_sinistre = c.num_sinistre
            {where_sql}
            GROUP BY c.site_gestion_theo
            ORDER BY nb_claims_treated DESC, centre ASC
            """,
            params,
        )
        rows = _rows_to_dicts(cursor)
        conn.close()
        return jsonify(rows)
    except Exception as e:
        print(f"[PROVIDER CLAIMS CENTER ERROR] {e}")
        return jsonify([])

print(app.url_map)

if __name__ == '__main__':
    print("STARTING FLASK SERVICE on 0.0.0.0:5001")
    app.run(debug=True, host='0.0.0.0', port=5001)