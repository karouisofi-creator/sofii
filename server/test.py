import pyodbc

conn_str = (
    r'DRIVER={ODBC Driver 17 for SQL Server};'
    r'SERVER=np:\\.\pipe\LOCALDB#3175037C\tsql\query;'
    r'DATABASE=master;'
    r'Trusted_Connection=yes;'
)
try:
    with pyodbc.connect(conn_str, timeout=5) as conn:
        print("Connection successful!")
except Exception as e:
    print(f"Connection failed: {e}")