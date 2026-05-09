@echo off
REM Helper to start the Python API on Windows (cmd.exe)
SET "DB_SERVER=(localdb)\MyInstance"
SET "DB_DATABASE=DataFlow"
CD /D %~dp0
ECHO Starting API with DB_SERVER=%DB_SERVER% DB_DATABASE=%DB_DATABASE%
python py_api_service.py
