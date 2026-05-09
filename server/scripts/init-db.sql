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

-- Table tickets
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tickets')
BEGIN
    CREATE TABLE tickets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NULL,
        userEmail NVARCHAR(255) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NULL,
        type NVARCHAR(100) NULL,
        perimeter NVARCHAR(100) NULL,
        format NVARCHAR(50) NULL,
        urgency NVARCHAR(50) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'open',
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        solution NVARCHAR(MAX) NULL,
        solvedBy NVARCHAR(255) NULL,
        solvedAt DATETIME2 NULL
    );
END
GO

-- Table reports
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'reports')
BEGIN
    CREATE TABLE reports (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NULL,
        userEmail NVARCHAR(255) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'open',
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        solvedBy NVARCHAR(255) NULL,
        solvedAt DATETIME2 NULL,
        solution NVARCHAR(MAX) NULL
    );
END
GO

-- Table logs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'logs')
BEGIN
    CREATE TABLE logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NULL,
        userEmail NVARCHAR(255) NULL,
        action NVARCHAR(255) NOT NULL,
        details NVARCHAR(MAX) NULL,
        ip NVARCHAR(100) NULL,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Table BatchProcesses
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BatchProcesses')
BEGIN
    CREATE TABLE BatchProcesses (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nom NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NULL,
        categorie NVARCHAR(100) NULL,
        parametres NVARCHAR(MAX) NULL,
        actif BIT NOT NULL DEFAULT 1,
        requete_sql NVARCHAR(MAX) NOT NULL
    );

    INSERT INTO BatchProcesses (nom, description, categorie, parametres, actif, requete_sql) VALUES
    ('Claims in Progress', 'List active claims', 'Sinistres', 'date_debut,date_fin', 1, 'SELECT * FROM Claims WHERE status <> ''terminé'''),
    ('Claims Closed', 'List completed claims', 'Sinistres', 'date_debut,date_fin', 1, 'SELECT * FROM Claims WHERE status = ''terminé'' OR status = ''closed'''),
    ('Team Performance Summary', 'Team performance overview', 'Adhérents', '', 1, 'SELECT * FROM team_performance');
END
GO

-- Table Claims
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Claims')
BEGIN
    CREATE TABLE Claims (
        id INT IDENTITY(1,1) PRIMARY KEY,
        date_sinistre DATE NULL,
        centre NVARCHAR(100) NULL,
        MARQUE NVARCHAR(100) NULL,
        Nom_Assureur NVARCHAR(255) NULL,
        status NVARCHAR(50) NULL,
        montant_soumis DECIMAL(18,2) NULL,
        montant_rembourse DECIMAL(18,2) NULL,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );

    INSERT INTO Claims (date_sinistre, centre, MARQUE, Nom_Assureur, status, montant_soumis, montant_rembourse) VALUES
    (DATEADD(day, -2, GETDATE()), 'DUBAI', 'Toyota', 'AXA', 'en cours', 1250.00, 0.00),
    (DATEADD(day, -5, GETDATE()), 'PARIS', 'Renault', 'Allianz', 'en cours', 980.00, 0.00),
    (DATEADD(day, -8, GETDATE()), 'TUNIS', 'BMW', 'AXA', 'terminé', 2100.00, 1800.00),
    (DATEADD(day, -12, GETDATE()), 'CALGARY', 'Mercedes', 'Zurich', 'closed', 3400.00, 3400.00),
    (DATEADD(day, -1, GETDATE()), 'KL', 'Honda', 'AIG', 'en cours', 760.00, 0.00),
    (DATEADD(day, -15, GETDATE()), 'SHANGHAI', 'Nissan', 'AXA', 'terminé', 1900.00, 1750.00);
END
GO

-- Table team_performance
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'team_performance')
BEGIN
    CREATE TABLE team_performance (
        id INT IDENTITY(1,1) PRIMARY KEY,
        team NVARCHAR(100) NOT NULL,
        agent NVARCHAR(255) NULL,
        centre NVARCHAR(100) NULL,
        provider_claim_20days DECIMAL(10,2) NULL,
        nb_claim_treated_20d INT NULL,
        nb_claim_treated_30d INT NULL,
        nb_claims_treated INT NULL,
        nb_ligne_claims_treated INT NULL,
        nb_claims_ss INT NULL,
        nb_ligne_claims_ss INT NULL,
        Name_agent NVARCHAR(255) NULL
    );

    INSERT INTO team_performance
    (team, agent, centre, provider_claim_20days, nb_claim_treated_20d, nb_claim_treated_30d, nb_claims_treated, nb_ligne_claims_treated, nb_claims_ss, nb_ligne_claims_ss, Name_agent)
    VALUES
    ('DUBAI', 'Ahmed Hassan', 'DUBAI', 96.50, 12, 18, 45, 60, 22, 28, 'Ahmed Hassan'),
    ('DUBAI', 'Fatima Al-Mansouri', 'DUBAI', 94.10, 10, 14, 38, 52, 19, 24, 'Fatima Al-Mansouri'),
    ('PARIS', 'Jean Dupont', 'PARIS', 97.20, 15, 20, 52, 70, 25, 31, 'Jean Dupont'),
    ('PARIS', 'Marie Laurent', 'PARIS', 93.80, 11, 17, 41, 57, 21, 26, 'Marie Laurent'),
    ('TUNIS', 'Karim Ben Miled', 'TUNIS', 91.30, 9, 13, 35, 49, 16, 20, 'Karim Ben Miled'),
    ('CALGARY', 'Robert Smith', 'CALGARY', 89.70, 8, 11, 28, 40, 13, 18, 'Robert Smith'),
    ('KL', 'Tan Wei Ming', 'KL', 92.40, 9, 15, 32, 46, 17, 23, 'Tan Wei Ming'),
    ('SHANGHAI', 'Liu Chen', 'SHANGHAI', 95.10, 10, 16, 39, 54, 20, 25, 'Liu Chen');
END
GO
