-- DataFlow Assurance - Script d'initialisation
-- Exécuter dans SQL Server Management Studio (SSMS)

-- Créer la base si elle n'existe pas
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'DataFlowAssurance')
BEGIN
    CREATE DATABASE DataFlowAssurance;
END
GO

USE DataFlowAssurance;
GO

-- Table utilisateurs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL UNIQUE,
        fullName NVARCHAR(255) NOT NULL,
        passwordHash NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
        isActive BIT NOT NULL DEFAULT 1,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_users_email ON users(email);
    CREATE INDEX IX_users_role ON users(role);
END
GO

-- Utilisateur admin par défaut (mot de passe: Admin123!)
-- Le hash bcrypt sera généré par le script seed
-- Exécuter: node scripts/seed-admin.js après avoir configuré .env
