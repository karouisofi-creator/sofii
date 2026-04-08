from flask import Flask, request, jsonify
import pyodbc
import bcrypt

app = Flask(__name__)

app = Flask(__name__)

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
    try:
        conn_str = (
            r'DRIVER={ODBC Driver 17 for SQL Server};'
            r'SERVER=np:\\.\pipe\LOCALDB#1DEF2BEF\tsql\query;'
            r'DATABASE=DataFlow;'
            r'Trusted_Connection=yes;'
        )
        return pyodbc.connect(conn_str)
    except Exception as e:
        print(f"[DB CONNECTION ERROR] {e}")
        raise

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

print(app.url_map)

if __name__ == '__main__':
    print("STARTING FLASK SERVICE on 0.0.0.0:5001")
    app.run(debug=True, host='0.0.0.0', port=5001)