from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pyodbc
import bcrypt

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

def get_db_connection():
    # Try default LocalDB instance
    return pyodbc.connect(
        r'DRIVER={ODBC Driver 17 for SQL Server};'
        r'SERVER=(localdb)\\MSSQLLocalDB;'
        r'DATABASE=DataFlow;'
        r'Trusted_Connection=yes;'
    )
    # If that fails, try using the named pipe (uncomment below and update the pipe name as needed):
    # return pyodbc.connect(
    #     r'DRIVER={ODBC Driver 17 for SQL Server};'
    #     r'SERVER=np:\\.\pipe\LOCALDB#F6B5B5A0\tsql\query;'
    #     r'DATABASE=DataFlow;'
    #     r'Trusted_Connection=yes;'
    # )

@router.post("/api/login")
def login(data: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT passwordHash FROM users WHERE email = ?", data.email)
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(data.password.encode(), row.passwordHash.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful"}
