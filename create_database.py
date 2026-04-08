import pyodbc


# Set your database name here
DATABASE_NAME = 'DataFlow'

# Connection string for LocalDB instance 'MyInstance' with Windows Authentication and DataFlow DB
conn_str = (
    r'DRIVER={ODBC Driver 17 for SQL Server};'
    r'SERVER=(localdb)\\MyInstance;'
    r'DATABASE=DataFlow;'
    r'Trusted_Connection=yes;'
)

try:
    # Connect to SQL Server
    with pyodbc.connect(conn_str, autocommit=True) as conn:
        cursor = conn.cursor()
        print(f"Connected to database '{DATABASE_NAME}' successfully.")
except Exception as e:
    print(f"Error: {e}")
