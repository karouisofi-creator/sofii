/*
  DataFlow - SSMS script
  Creates required tables and inserts sample data (different values)
  Run this script in SSMS.
*/

IF DB_ID('DataFlow') IS NULL
BEGIN
    CREATE DATABASE DataFlow;
END
GO

USE DataFlow;
GO

/* =========================
   1) TABLE: claims_closed
   (from sinistres_ter_NO_TE / sinistres_termines)
   ========================= */
IF OBJECT_ID('dbo.claims_closed', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.claims_closed (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        source_file NVARCHAR(120) NOT NULL,
        id_sinistre BIGINT NOT NULL,
        num_sinistre NVARCHAR(60) NOT NULL,
        code_etat NVARCHAR(20) NULL,
        EC_REASON NVARCHAR(400) NULL,
        ADJUSTMENT_REASON NVARCHAR(400) NULL,
        ADJUSTMENT_DETAIL NVARCHAR(MAX) NULL,
        rejection_reason NVARCHAR(400) NULL,
        rejection_detail NVARCHAR(MAX) NULL,
        date_cloture DATETIME2 NULL,
        date_survenance DATETIME2 NULL,
        date_ouverture DATETIME2 NULL,
        utilisateur NVARCHAR(255) NULL,
        marque NVARCHAR(100) NULL,
        nom_assureur NVARCHAR(255) NULL,
        provider_id NVARCHAR(100) NULL,
        provider_name NVARCHAR(255) NULL,
        site_gestion_dcpt NVARCHAR(100) NULL,
        site_gestion_theo NVARCHAR(100) NULL,
        rep_tiers_conv NVARCHAR(60) NULL,
        type_of_log NVARCHAR(80) NULL,
        traite NVARCHAR(40) NULL,
        encaisseur NVARCHAR(120) NULL,
        devise NVARCHAR(10) NULL,
        montant_rebt_dp DECIMAL(18,2) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Add unique constraint only if it does not already exist
IF OBJECT_ID('UQ_claims_closed', 'UQ') IS NULL
BEGIN
    ALTER TABLE dbo.claims_closed
    ADD CONSTRAINT UQ_claims_closed UNIQUE (id_sinistre, num_sinistre);
END

-- Create indexes if they don't exist
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_claims_closed_num_sinistre' AND object_id = OBJECT_ID('dbo.claims_closed'))
    CREATE INDEX IX_claims_closed_num_sinistre ON dbo.claims_closed(num_sinistre);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_claims_closed_date_cloture' AND object_id = OBJECT_ID('dbo.claims_closed'))
    CREATE INDEX IX_claims_closed_date_cloture ON dbo.claims_closed(date_cloture);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_claims_closed_ec_reason' AND object_id = OBJECT_ID('dbo.claims_closed'))
    CREATE INDEX IX_claims_closed_ec_reason ON dbo.claims_closed(EC_REASON);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_claims_closed_adjustment_reason' AND object_id = OBJECT_ID('dbo.claims_closed'))
    CREATE INDEX IX_claims_closed_adjustment_reason ON dbo.claims_closed(ADJUSTMENT_REASON);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_claims_closed_rejection_reason' AND object_id = OBJECT_ID('dbo.claims_closed'))
    CREATE INDEX IX_claims_closed_rejection_reason ON dbo.claims_closed(rejection_reason);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_claims_closed_provider_name' AND object_id = OBJECT_ID('dbo.claims_closed'))
    CREATE INDEX IX_claims_closed_provider_name ON dbo.claims_closed(provider_name);
GO

IF COL_LENGTH('dbo.claims_closed', 'EC_REASON') IS NULL
    ALTER TABLE dbo.claims_closed ADD EC_REASON NVARCHAR(400) NULL;
IF COL_LENGTH('dbo.claims_closed', 'ADJUSTMENT_REASON') IS NULL
    ALTER TABLE dbo.claims_closed ADD ADJUSTMENT_REASON NVARCHAR(400) NULL;
IF COL_LENGTH('dbo.claims_closed', 'ADJUSTMENT_DETAIL') IS NULL
    ALTER TABLE dbo.claims_closed ADD ADJUSTMENT_DETAIL NVARCHAR(MAX) NULL;
IF COL_LENGTH('dbo.claims_closed', 'rejection_reason') IS NULL
    ALTER TABLE dbo.claims_closed ADD rejection_reason NVARCHAR(400) NULL;
IF COL_LENGTH('dbo.claims_closed', 'rejection_detail') IS NULL
    ALTER TABLE dbo.claims_closed ADD rejection_detail NVARCHAR(MAX) NULL;
IF COL_LENGTH('dbo.claims_closed', 'provider_id') IS NULL
    ALTER TABLE dbo.claims_closed ADD provider_id NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.claims_closed', 'provider_name') IS NULL
    ALTER TABLE dbo.claims_closed ADD provider_name NVARCHAR(255) NULL;

/* =========================
   2) TABLE: claims_closed_lines
   (from sinistre_Ter_Lignes_NO_TE / sinistres_termines_ligne)
   ========================= */
IF OBJECT_ID('dbo.claims_closed_lines', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.claims_closed_lines (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        id_sinistre BIGINT NOT NULL,
        num_sinistre NVARCHAR(60) NOT NULL,
        id_ligne BIGINT NOT NULL,
        date_cloture DATETIME2 NULL,
        date_soins DATETIME2 NULL,
        marque NVARCHAR(100) NULL,
        nom_assureur NVARCHAR(255) NULL,
        code_acte NVARCHAR(50) NULL,
        code_acte_fr NVARCHAR(255) NULL,
        quantite INT NULL,
        montant_depense_origine DECIMAL(18,2) NULL,
        frais_devise_contrat DECIMAL(18,2) NULL,
        rebt_devise_contrat DECIMAL(18,2) NULL,
        devise_contrat NVARCHAR(10) NULL,
        devise NVARCHAR(10) NULL,
        site_gestion_dcpt NVARCHAR(100) NULL,
        site_gestion_theo NVARCHAR(100) NULL,
        type_sinistre NVARCHAR(40) NULL,
        type_decompte NVARCHAR(60) NULL,
        traite NVARCHAR(40) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

IF OBJECT_ID('UQ_claims_closed_lines', 'UQ') IS NULL
BEGIN
    ALTER TABLE dbo.claims_closed_lines
    ADD CONSTRAINT UQ_claims_closed_lines UNIQUE (id_sinistre, id_ligne);
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_claims_closed_lines_num_sinistre' AND object_id = OBJECT_ID('dbo.claims_closed_lines'))
    CREATE INDEX IX_claims_closed_lines_num_sinistre ON dbo.claims_closed_lines(num_sinistre);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_claims_closed_lines_date_cloture' AND object_id = OBJECT_ID('dbo.claims_closed_lines'))
    CREATE INDEX IX_claims_closed_lines_date_cloture ON dbo.claims_closed_lines(date_cloture);
GO

/* =========================
   3) OPTIONAL LINK TABLE
   ========================= */
IF OBJECT_ID('dbo.claims_closed_link', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.claims_closed_link (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        id_sinistre BIGINT NOT NULL,
        num_sinistre NVARCHAR(60) NOT NULL,
        line_count INT NOT NULL DEFAULT 0,
        total_line_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
        inserted_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_claims_closed_link_sinistre ON dbo.claims_closed_link(id_sinistre);
END
GO

/* =========================
   4) SAMPLE INSERTS (different values)
   ========================= */

-- Header-level closed claims
INSERT INTO dbo.claims_closed
(
    source_file, id_sinistre, num_sinistre, code_etat, date_cloture, date_survenance, date_ouverture,
    utilisateur, marque, nom_assureur, site_gestion_dcpt, site_gestion_theo,
    rep_tiers_conv, type_of_log, traite, encaisseur, devise, montant_rebt_dp
)
SELECT *
FROM (VALUES
    ('sinistres_ter_NO_TE.csv', 14000101, 'EU20990001', 'TE', '2024-11-12', '2024-10-04', '2024-10-05', 'Skander M.', 'MSHP', 'ALLIANZ EUR', 'TUNIS', 'PARIS', 'PROVIDER', 'OTHERS', 'UPLOADED', 'S2H_PAY', 'EUR', 520.75),
    ('sinistres_ter_NO_TE.csv', 14000102, 'DU20990002', 'TE', '2024-11-15', '2024-10-08', '2024-10-08', 'Nour C.', 'MSHG', 'AL YOSSR TAKAFUL', 'TUNIS', 'DUBAI', 'PROVIDER', 'OTHERS', 'UPLOADED', 'S2H_PAY', 'USD', 183.20),
    ('sinistres_termines.csv', 14000103, 'LE20990003', 'TE', '2024-11-20', '2024-10-12', '2024-10-14', 'Ali R.', 'MSHE2', 'LIC - MELLITAH', 'TUNIS', 'DUBAI', 'PROVIDER', 'OTHERS', 'UPLOADED', 'S2H_PAY', 'EUR', 910.40),
    ('sinistres_termines.csv', 14000104, 'CH20990004', 'TE', '2024-11-21', '2024-10-15', '2024-10-16', 'Amira H.', 'MSH2C', 'THE GLOBAL FUND', 'TUNIS', 'PARIS', 'ASSURE', 'UPLOADED', 'UPLOADED', 'S2H_PAY', 'CHF', 240.00),
    ('sinistres_termines.csv', 14000105, 'EU20990005', 'TE', '2024-11-22', '2024-10-18', '2024-10-18', 'Sami Z.', 'MSHP', 'AXA GLOBAL', 'PARIS', 'PARIS', 'PROVIDER', 'OTHERS', 'UPLOADED', 'S2H_PAY', 'EUR', 333.90)
) AS v(
    source_file, id_sinistre, num_sinistre, code_etat, date_cloture, date_survenance, date_ouverture,
    utilisateur, marque, nom_assureur, site_gestion_dcpt, site_gestion_theo,
    rep_tiers_conv, type_of_log, traite, encaisseur, devise, montant_rebt_dp
)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.claims_closed c
    WHERE c.id_sinistre = v.id_sinistre
      AND c.num_sinistre = v.num_sinistre
);
GO

-- Line-level details
INSERT INTO dbo.claims_closed_lines
(
    id_sinistre, num_sinistre, id_ligne, date_cloture, date_soins, marque, nom_assureur,
    code_acte, code_acte_fr, quantite, montant_depense_origine, frais_devise_contrat,
    rebt_devise_contrat, devise_contrat, devise, site_gestion_dcpt, site_gestion_theo,
    type_sinistre, type_decompte, traite
)
SELECT *
FROM (VALUES
    (14000101, 'EU20990001', 990001, '2024-11-12', '2024-10-07', 'MSHP', 'ALLIANZ EUR', '302', 'Consultation spécialiste', 1, 210.00, 67.00, 67.00, 'EBAFF', 'EUR', 'TUNIS', 'PARIS', 'TE', 'Standard', 'UPLOADED'),
    (14000101, 'EU20990001', 990002, '2024-11-12', '2024-10-07', 'MSHP', 'ALLIANZ EUR', '451', 'Analyses', 1, 120.00, 38.00, 38.00, 'EBAFF', 'EUR', 'TUNIS', 'PARIS', 'TE', 'Standard', 'UPLOADED'),
    (14000102, 'DU20990002', 990003, '2024-11-15', '2024-10-10', 'MSHG', 'AL YOSSR TAKAFUL', '317', 'Cardiologue', 1, 95.00, 5.90, 5.90, 'MSDUS', 'USD', 'TUNIS', 'DUBAI', 'TE', 'Standard', 'UPLOADED'),
    (14000103, 'LE20990003', 990004, '2024-11-20', '2024-10-13', 'MSHE2', 'LIC - MELLITAH', '506', 'Echographie', 1, 310.00, 99.00, 99.00, 'MSLEU', 'EUR', 'TUNIS', 'DUBAI', 'TE', 'Standard', 'UPLOADED'),
    (14000103, 'LE20990003', 990005, '2024-11-20', '2024-10-13', 'MSHE2', 'LIC - MELLITAH', '302', 'Consultation autre spécialiste', 1, 170.00, 54.00, 54.00, 'MSLEU', 'EUR', 'TUNIS', 'DUBAI', 'TE', 'Standard', 'UPLOADED'),
    (14000104, 'CH20990004', 990006, '2024-11-21', '2024-10-17', 'MSH2C', 'THE GLOBAL FUND', '803', 'Appareillage divers', 1, 75.00, 24.00, 24.00, 'EBCHF', 'CHF', 'TUNIS', 'PARIS', 'TE', 'Standard', 'UPLOADED'),
    (14000105, 'EU20990005', 990007, '2024-11-22', '2024-10-19', 'MSHP', 'AXA GLOBAL', '501', 'Radiographie', 1, 140.00, 45.00, 45.00, 'EBAFF', 'EUR', 'PARIS', 'PARIS', 'TE', 'Standard', 'UPLOADED')
) AS v(
    id_sinistre, num_sinistre, id_ligne, date_cloture, date_soins, marque, nom_assureur,
    code_acte, code_acte_fr, quantite, montant_depense_origine, frais_devise_contrat,
    rebt_devise_contrat, devise_contrat, devise, site_gestion_dcpt, site_gestion_theo,
    type_sinistre, type_decompte, traite
)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.claims_closed_lines l
    WHERE l.id_sinistre = v.id_sinistre
      AND l.id_ligne = v.id_ligne
);
GO

-- Link summary
INSERT INTO dbo.claims_closed_link (id_sinistre, num_sinistre, line_count, total_line_amount)
SELECT
    h.id_sinistre,
    h.num_sinistre,
    COUNT(l.id),
    ISNULL(SUM(l.rebt_devise_contrat), 0)
FROM dbo.claims_closed h
LEFT JOIN dbo.claims_closed_lines l
    ON l.id_sinistre = h.id_sinistre
GROUP BY h.id_sinistre, h.num_sinistre
HAVING NOT EXISTS (
    SELECT 1
    FROM dbo.claims_closed_link k
    WHERE k.id_sinistre = h.id_sinistre
      AND k.num_sinistre = h.num_sinistre
);
GO

/* =========================
   4b) SAMPLE ACTIVE (EN COURS) INSERTS
   Add a few non-closed claims so the dashboard shows "en cours" values
   These use a different source_file name and have NULL/OUVERT code_etat
   ========================= */
INSERT INTO dbo.claims_closed
(
    source_file, id_sinistre, num_sinistre, code_etat, date_cloture, date_survenance, date_ouverture,
    utilisateur, marque, nom_assureur, site_gestion_dcpt, site_gestion_theo,
    rep_tiers_conv, type_of_log, traite, encaisseur, devise, montant_rebt_dp
)
SELECT *
FROM (VALUES
    ('sinistres_en_cours.csv', 14001001, 'PC3001001', NULL, NULL, '2025-05-01', '2025-04-25', 'Leila A.', 'MSHP', 'ALLIANZ EUR', 'PARIS', 'PARIS', 'PROVIDER', 'LIVE', 'IN_PROGRESS', 'S2H_PAY', 'EUR', 150.00),
    ('sinistres_en_cours.csv', 14001002, 'DU3001002', 'OUVERT', NULL, '2025-05-03', '2025-05-01', 'Amine B.', 'MSHG', 'AL YOSSR TAKAFUL', 'DUBAI', 'DUBAI', 'PROVIDER', 'LIVE', 'IN_PROGRESS', 'S2H_PAY', 'USD', 200.00),
    ('sinistres_en_cours.csv', 14001003, 'PA3001003', NULL, NULL, '2025-04-28', '2025-04-20', 'Nadia S.', 'MSHE2', 'AXA GLOBAL', 'PARIS', 'PARIS', 'PROVIDER', 'LIVE', 'IN_PROGRESS', 'S2H_PAY', 'EUR', 120.00)
) AS v(
    source_file, id_sinistre, num_sinistre, code_etat, date_cloture, date_survenance, date_ouverture,
    utilisateur, marque, nom_assureur, site_gestion_dcpt, site_gestion_theo,
    rep_tiers_conv, type_of_log, traite, encaisseur, devise, montant_rebt_dp
)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.claims_closed c
    WHERE c.id_sinistre = v.id_sinistre
      AND c.num_sinistre = v.num_sinistre
);
GO

INSERT INTO dbo.claims_closed_lines
(
    id_sinistre, num_sinistre, id_ligne, date_cloture, date_soins, marque, nom_assureur,
    code_acte, code_acte_fr, quantite, montant_depense_origine, frais_devise_contrat,
    rebt_devise_contrat, devise_contrat, devise, site_gestion_dcpt, site_gestion_theo,
    type_sinistre, type_decompte, traite
)
SELECT *
FROM (VALUES
    (14001001, 'PC3001001', 3001001, NULL, '2025-04-24', 'MSHP', 'ALLIANZ EUR', '101', 'Consult', 1, 75.00, 0.00, 0.00, 'EBAFF', 'EUR', 'PARIS', 'PARIS', 'TE', 'Standard', 'IN_PROGRESS'),
    (14001002, 'DU3001002', 3001002, NULL, '2025-05-01', 'MSHG', 'AL YOSSR TAKAFUL', '202', 'Exam', 1, 120.00, 0.00, 0.00, 'MSDUS', 'USD', 'DUBAI', 'DUBAI', 'TE', 'Standard', 'IN_PROGRESS'),
    (14001003, 'PA3001003', 3001003, NULL, '2025-04-19', 'MSHE2', 'AXA GLOBAL', '303', 'Analysis', 1, 60.00, 0.00, 0.00, 'MSLEU', 'EUR', 'PARIS', 'PARIS', 'TE', 'Standard', 'IN_PROGRESS')
) AS v(
    id_sinistre, num_sinistre, id_ligne, date_cloture, date_soins, marque, nom_assureur,
    code_acte, code_acte_fr, quantite, montant_depense_origine, frais_devise_contrat,
    rebt_devise_contrat, devise_contrat, devise, site_gestion_dcpt, site_gestion_theo,
    type_sinistre, type_decompte, traite
)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.claims_closed_lines l WHERE l.id_sinistre = v.id_sinistre AND l.id_ligne = v.id_ligne
);
GO

/* =========================
    4c) REFRESH LINK SUMMARY
    Upsert per-claim summary into dbo.claims_closed_link so counts and totals
    reflect any newly inserted active or line rows. Idempotent.
    ========================= */
MERGE INTO dbo.claims_closed_link AS target
USING (
     SELECT
          h.id_sinistre,
          h.num_sinistre,
          COUNT(l.id) AS line_count,
          ISNULL(SUM(l.rebt_devise_contrat), 0) AS total_line_amount
     FROM dbo.claims_closed h
     LEFT JOIN dbo.claims_closed_lines l
          ON l.id_sinistre = h.id_sinistre
     GROUP BY h.id_sinistre, h.num_sinistre
) AS src (id_sinistre, num_sinistre, line_count, total_line_amount)
ON target.id_sinistre = src.id_sinistre
WHEN MATCHED THEN
     UPDATE SET target.num_sinistre = src.num_sinistre,
                    target.line_count = src.line_count,
                    target.total_line_amount = src.total_line_amount,
                    target.inserted_at = GETDATE()
WHEN NOT MATCHED BY TARGET THEN
     INSERT (id_sinistre, num_sinistre, line_count, total_line_amount, inserted_at)
     VALUES (src.id_sinistre, src.num_sinistre, src.line_count, src.total_line_amount, GETDATE());
GO

/* =========================
   5) QUICK CHECKS
   ========================= */
SELECT TOP 20 * FROM dbo.claims_closed ORDER BY date_cloture DESC;
SELECT TOP 20 * FROM dbo.claims_closed_lines ORDER BY date_cloture DESC;
SELECT TOP 20 * FROM dbo.claims_closed_link ORDER BY inserted_at DESC;
GO

/* ======================================================
   6) EXACT NAMES REQUESTED (same names you sent)
      Recreated from the CSV headers so the columns match 1:1.
   ====================================================== */

DROP TABLE IF EXISTS dbo.sinistres_termines_ligne;
DROP TABLE IF EXISTS dbo.sinistre_Ter_Lignes_NO_TE;
DROP TABLE IF EXISTS dbo.sinistres_termines;
DROP TABLE IF EXISTS dbo.sinistres_ter_NO_TE;
GO

DECLARE @claims_header NVARCHAR(MAX) = N'ID_Sinistre;Base_Info;Num_Sinistre;Reference_Interne;Reference_Externe;Reference_Compagnie;Devise_Contrat;Code_Etat;Date_Cloture;Date_Derniere_Action;Date_Reception;Date_Ouverture;Date_Reouverture;Date_Recloture;Date_Survenance;Num_Utilisateur;Utilisateur;Description;Commentaire;Commentaire_Dcpt;Num_famille;AD_NUM_SS;AD_CODE;ID_Client;Index_Societe;Index_Groupe;ID_Branche;Num_Branche;ID_Produit;Code_Produit;ID_Police;Num_Police;Compl_Police;Pol_Assure;ID_Convention;Num_Convention;ID_Assureur;Assureur;ID_Intermediaire;Code_Intermediaire;ID_Apporteur;Code_Apporteur;Montant_Rebt_DC;Monnaie_paiement;Montant_Rebt_DP;Type_Tiers;ID_Tiers;Code_Tiers;Titre;Nom1;Nom2;Adresse1;Adresse2;Adresse3;Localite;Code_Postal;Ville;Pays;Commentaire_Rep;Telephone1;Telephone2;Telephone3;Fax;Telex;Mode_Reglement;Code_Banque;Num_Guichet;Num_Compte;Cle_RIB;Nom_Banque;Recip_Nom;Recip_Prenom;Recip_Num_Cpt;Recip_Banque;Recip_Banque2;Recip_Type;Recip_Code;Recip_Adresse1;Recip_Adresse2;Recip_Adresse3;Recip_Code_Postal;Recip_Ville;Recip_Etat;Recip_Pays;Recip_Code_Swift;Recip_Ref2;Recip_Ref3;Recip_bqswift;Recip_bqaba;SIN_COUT;SIN_INTLOTEXP;SIN_INTLOTIMP;SIN_LIB01;SIN_LIB02;SIN_LIB03;SIN_LIB04;SIN_LIB05;SIN_LIB06;SIN_LIB07;SIN_LIB08;SIN_LIB09;SIN_LIB10;SIN_LIB11;SIN_LIB12;SIN_LIB13;SIN_LIB14;SIN_LIB15;SIN_LIB16;SIN_LIB17;SIN_LIB18;SIN_LIB19;SIN_LIB20;rep_id;rep_nomappel;rep_nomde1;rep_nomde2;rep_adresse;rep_adresse2;rep_ville;rep_codpo;rep_type;rep_sinptr;rep_commentaire;rep_telephone;rep_telex;rep_telecopie;rep_poste;rep_localite;rep_pays;rep_titre;rep_filiale;rep_compte;rep_code_pays;rep_num_doss;rep_code_insee;rep_code_rep;rep_zone;rep_cote;rep_code_comp;rep_adr_fact;rep_telephone2;rep_telephone3;rep_debsub;rep_finsub;rep_motif_fin;rep_type_benef;rep_refecho;rep_refexterne;rep_dombanque;rep_domguichet;rep_domcompte;rep_domcle;rep_domlibelle;rep_dome_numcpt;rep_dome_numcp2;rep_dome_bqnom1;rep_dome_bqnom2;rep_dome_bqadr1;rep_dome_bq_adr2;rep_dome_bqloc;rep_dome_bqcp;rep_dome_bqpays;rep_dome_bqvill;rep_adresse3;rep_dome_bqaba;rep_dome_bquid;rep_dome_bqcode;rep_adr_rel;rep_rublib01;rep_rublib02;rep_rublib03;rep_famille;rep_sfamille;rep_code_etabl;rep_ptrsororigid;rep_ptrpolid;rep_ptrribident;rep_moderegl;rep_adr_maint;rep_ident_pays;rep_dome_bqswift;rep_adr_com;rep_dome_nom_benef;rep_dome_prenom_benef;rep_dome_nature;rep_dome_code;rep_dome_etat;rep_ident_auxil;SIN_Date_IMP;CLIENT_REF;REP_CIE;REP_IMMAT;REP_NOPOL;REP_DATDEB_VAL;REP_DATFIN_VAL;REP_INTLOTEXP;REP_TIERS_CONV;TRAITE;ID_FAMILLE;NUM_FAMILLE_MULTIPOLICE;ENCAISSEUR;SIN_JUSTIFICATIF;REPRICING;ADJ_CODE;ADJ_NOM;SITE_GESTION_DCPT;DEVISE;TYPE_OF_LOG;ADJUSTMENT_REASON;ADJUSTMENT_DETAIL;SITE_GESTION_THEO;NUM_BORDERAU;BORDERAU;BDX_DATE_CREATION;EC_REASON;PRESAISIE_BY;CONF_EMAIL_SENT;SENT_DATE;CNV_NOEL_PLUS;USER_VALID;NOM_VALID;SITE_VALID;SIN_LIB21';
DECLARE @line_header NVARCHAR(MAX) = N'ID_Sinistre;Num_Sinistre;ID_Ligne;Base_Info;SITE_GESTION_THEO;SITE_GESTION_Dcpt;MARQUE;INDEX_ASSUREUR;Nom_Assureur;Index_Groupe;NOM_GROUPE;Index_Client;NOM_SOCIETE;POLICE_MERE;ID_Client;codeclient;nomappel;nom1;ID_Police;Num_Police;DEVISE_CONTRAT;NIV_INTERVENTION;ETAT_POLICE;FILES;Po_Assure;ID_Conv;Num_Convention;Code_Garantie;ID_Branche;Num_Branche;Famille_Branche;ID_Produit;Code_Produit;PRODUIT;AD_NUM_SS;NUM_FAMILLE_MULTIPOLICE;Num_Famille;Num_Personne;ID_FAMILLE;ID_BENEF;CIVILITE;NATIONALITE;PAYS_EXPATRIATION;ANNEE_SOIN;MOIS_SOIN;ANNEE_CLOTURE;MOIS_CLOTURE;Date_Cloture;Stat_Groupe;Lib_Stat_Groupe;LIBELLE_STAT_AN;Date_Soins;Qualite_Assure;Nom_Assure;Prenom_Assure;LDC_ICD10_CODE;Code_Acte;Code_Acte_FR;Code_Acte_AN;Coeff;Quantite;Montant_Depense_Origine;Monnaie_Origine;Frais_Devise_Origine;Frais_Devise_Contrat;DEVISE;TAUX_CONV_CONTRAT;Montant_Rebt_SS;Montant_Rebt_C1;Rebt_Devise_Contrat;Monnaie_Paiement;Taux_Conv_CPTA;Rebt_Devise_Paiement;LDC_ATTENTE;Commentaire;LDC_LIB01;Critere;External;Drug;Drug_name;Montant_depense_origine_stat;Montant_depense_origine_contrat_stat;Frais_devise_origine_stat;Frais_devise_origine_contrat_stat;Frais_devise_contrat_stat;Frais_devise_contrat_stat_RAC;Coef_stat;Quantite_Stat;OPM;Montant_OPM;Montant_OPM2;Montant_Plafond;Mod_Rebt_Max;Code_Plafond;LDC_CODE_PLAF_AD;LDC_PLAF_ABS;LDC_PLAFOND;Nombre_Max;Montant_Franchise_Ay;Franchise_Ad;Date_Creation;TYPE_SINISTRE;TYPE_DECOMPTE;DEPENSE_RETENUE;MT_COINSURANCE;Pays_Soins_Nat_Expat;Encaisseur;SIN_Justificatif;CARRE_OVER_N;CARRE_OVER_N1;CARRE_OVER_N2;ZONE_GEO;Lot_Import;Taux_SS;Top_Devise;LDC_INT_LOT_EXP;LDC_CODE_ACTION;LDC_HISTO_ACTION;LDC_REFECHO;LDC_DATE_FIN_SOINS;LDC_TOP_REMB_SS;LDC_LIB05;LDC_LIB06;LDC_LIB07;LDC_LIB08;LDC_LIB09;LDC_NUM01;LDC_NUM02;LDC_NUM03;LDC_NUM04;LDC_NUM05;LDC_NUM06;LDC_NUM07;Montant_copayment;LDC_NUM09;LDC_NUM10;LDC_DAT01;LDC_DAT02;LDC_DAT03;LDC_DAT04;LDC_DAT05;LDC_LIG_OPT_TOUCHE;TRAITE;ldc_comment;Niv_Int_Complet_FR;Niv_Int_Complet_EN;Pays_Expat_Nat_Soins;REMB_SS_STAT;REMB_C1_STAT;MT_ATTENDU;TERME;TAUX_EUR;Rebt_Devise_Contrat_EUR;Montant_depense_origine_contrat_stat_EUR;Frais_devise_origine_contrat_stat_EUR;Frais_devise_contrat_stat_EUR;REMB_SS_STAT_EUR;REMB_C1_STAT_EUR;TAUX_USD;Rebt_Devise_Contrat_USD;Montant_depense_origine_contrat_stat_USD;Frais_devise_origine_contrat_stat_USD;Frais_devise_contrat_stat_USD;REMB_SS_STAT_USD;REMB_C1_STAT_USD;SERVICE;TYPE_DEROGATION;TYPE_SAVING;CODE_EXTERNE_ACTE;FLUX_ENTRANT;DEVISE_ORIG_PREMIER_PAY;MONTANT_ORIG_PREMIER_PAY;DEVISE_ORIG_SECOND_PAY;MONTANT_ORIG_SECOND_PAY;NUM_DENT;ENCOUNTER_TYPE;ID_LIGNE_GROUPE;REF_EXTERNE_PROVIDER;REF_INTERNE_MSH;NOM_MEDECIN;DEUXIEME_ICD;MONTANT_RO;NETWORK_1;ANNEE_RATTACHEMENT;COMPLEMENT_ACT;LDC_TAUX_CONV_CONTRAT;Montant_Rebt_SS_PAY;CNV_NOEL_PLUS;TAUX_CHF;Rebt_Devise_Contrat_CHF;Montant_depense_origine_contrat_stat_CHF;Frais_devise_origine_contrat_stat_CHF;Frais_devise_contrat_stat_CHF;REMB_SS_STAT_CHF;REMB_C1_STAT_CHF;LDC_ANC_IDENT;AY_DATE_NAISSANCE;AY_CLE_BEN';

DECLARE @exact_tables TABLE (
    table_name SYSNAME NOT NULL,
    headers NVARCHAR(MAX) NOT NULL
);

INSERT INTO @exact_tables (table_name, headers)
VALUES
    (N'dbo.sinistres_ter_NO_TE', @claims_header),
    (N'dbo.sinistres_termines', @claims_header),
    (N'dbo.sinistre_Ter_Lignes_NO_TE', @line_header),
    (N'dbo.sinistres_termines_ligne', @line_header);

DECLARE @table_name SYSNAME,
        @headers NVARCHAR(MAX),
        @json NVARCHAR(MAX),
        @cols NVARCHAR(MAX),
        @sql NVARCHAR(MAX);

DECLARE exact_cursor CURSOR LOCAL FAST_FORWARD FOR
SELECT table_name, headers
FROM @exact_tables;

OPEN exact_cursor;
FETCH NEXT FROM exact_cursor INTO @table_name, @headers;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @json = N'["' + REPLACE(@headers, N';', N'","') + N'"]';

    SELECT @cols = STUFF((
        SELECT ',' + QUOTENAME([value]) + N' NVARCHAR(MAX) NULL'
        FROM OPENJSON(@json)
        ORDER BY TRY_CAST([key] AS int)
        FOR XML PATH(''), TYPE
    ).value('.', 'NVARCHAR(MAX)'), 1, 1, '');

    SET @sql = N'CREATE TABLE ' + @table_name + N' (' + @cols + N');';
    EXEC sp_executesql @sql;

    FETCH NEXT FROM exact_cursor INTO @table_name, @headers;
END

CLOSE exact_cursor;
DEALLOCATE exact_cursor;
GO

/* Fill exact-name tables with DIFFERENT sample data (from seeded rows) */
INSERT INTO dbo.sinistres_ter_NO_TE
([ID_Sinistre],[Base_Info],[Num_Sinistre],[Code_Etat],[Date_Cloture],[Date_Ouverture],[Date_Survenance],[Utilisateur],[Commentaire],[Commentaire_Dcpt],[ID_Client],[Assureur],[Montant_Rebt_DP],[Monnaie_paiement],[TRAITE],[ENCAISSEUR],[SITE_GESTION_DCPT],[SITE_GESTION_THEO],[TYPE_OF_LOG],[DEVISE],[REP_TIERS_CONV],[REP_CIE],[REP_IMMAT],[REP_NOPOL],[REP_DATDEB_VAL],[REP_DATFIN_VAL],[BDX_DATE_CREATION],[PRESAISIE_BY],[USER_VALID],[NOM_VALID],[SITE_VALID])
SELECT
    c.id_sinistre, 'ORACLE', c.num_sinistre, c.code_etat, c.date_cloture, c.date_ouverture, c.date_survenance,
    c.utilisateur, NULL, NULL, NULL, c.nom_assureur, c.montant_rebt_dp, c.devise,
    c.traite, c.encaisseur, c.site_gestion_dcpt, c.site_gestion_theo, c.type_of_log, c.devise,
    c.rep_tiers_conv, NULL, NULL, NULL, c.date_ouverture, c.date_cloture, GETDATE(), c.utilisateur, c.utilisateur, c.utilisateur, c.site_gestion_theo
FROM dbo.claims_closed c
WHERE c.source_file = 'sinistres_ter_NO_TE.csv'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.sinistres_ter_NO_TE t
      WHERE t.[ID_Sinistre] = c.id_sinistre AND t.[Num_Sinistre] = c.num_sinistre
  );
GO

INSERT INTO dbo.sinistres_termines
([ID_Sinistre],[Base_Info],[Num_Sinistre],[Code_Etat],[Date_Cloture],[Date_Ouverture],[Date_Survenance],[Utilisateur],[Commentaire],[Commentaire_Dcpt],[ID_Client],[Assureur],[Montant_Rebt_DP],[Monnaie_paiement],[TRAITE],[ENCAISSEUR],[SITE_GESTION_DCPT],[SITE_GESTION_THEO],[TYPE_OF_LOG],[DEVISE],[REP_TIERS_CONV],[REP_CIE],[REP_IMMAT],[REP_NOPOL],[REP_DATDEB_VAL],[REP_DATFIN_VAL],[BDX_DATE_CREATION],[PRESAISIE_BY],[USER_VALID],[NOM_VALID],[SITE_VALID])
SELECT
    c.id_sinistre, 'ORACLE', c.num_sinistre, c.code_etat, c.date_cloture, c.date_ouverture, c.date_survenance,
    c.utilisateur, NULL, NULL, NULL, c.nom_assureur, c.montant_rebt_dp, c.devise,
    c.traite, c.encaisseur, c.site_gestion_dcpt, c.site_gestion_theo, c.type_of_log, c.devise,
    c.rep_tiers_conv, NULL, NULL, NULL, c.date_ouverture, c.date_cloture, GETDATE(), c.utilisateur, c.utilisateur, c.utilisateur, c.site_gestion_theo
FROM dbo.claims_closed c
WHERE c.source_file = 'sinistres_termines.csv'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.sinistres_termines t
      WHERE t.[ID_Sinistre] = c.id_sinistre AND t.[Num_Sinistre] = c.num_sinistre
  );
GO

INSERT INTO dbo.sinistre_Ter_Lignes_NO_TE
([ID_Sinistre],[Num_Sinistre],[ID_Ligne],[Base_Info],[SITE_GESTION_THEO],[SITE_GESTION_Dcpt],[MARQUE],[Date_Cloture],[Date_Soins],[Code_Acte],[Code_Acte_FR],[Quantite],[Montant_Depense_Origine],[Frais_Devise_Contrat],[Rebt_Devise_Contrat],[DEVISE],[TYPE_SINISTRE],[TYPE_DECOMPTE],[TRAITE],[Nom_Assure],[Prenom_Assure])
SELECT
    l.id_sinistre, l.num_sinistre, l.id_ligne, 'ORACLE', l.site_gestion_theo, l.site_gestion_dcpt, l.marque,
    l.date_cloture, l.date_soins, l.code_acte, l.code_acte_fr, l.quantite, l.montant_depense_origine,
    l.frais_devise_contrat, l.rebt_devise_contrat, l.devise, l.type_sinistre, l.type_decompte, l.traite,
    l.nom_assureur, NULL
FROM dbo.claims_closed_lines l
WHERE l.id_sinistre IN (
    SELECT id_sinistre FROM dbo.claims_closed WHERE source_file = 'sinistres_ter_NO_TE.csv'
)
  AND NOT EXISTS (
      SELECT 1 FROM dbo.sinistre_Ter_Lignes_NO_TE t
      WHERE t.[ID_Sinistre] = l.id_sinistre AND t.[ID_Ligne] = l.id_ligne
  );
GO

INSERT INTO dbo.sinistres_termines_ligne
([ID_Sinistre],[Num_Sinistre],[ID_Ligne],[Base_Info],[SITE_GESTION_THEO],[SITE_GESTION_Dcpt],[MARQUE],[Date_Cloture],[Date_Soins],[Code_Acte],[Code_Acte_FR],[Quantite],[Montant_Depense_Origine],[Frais_Devise_Contrat],[Rebt_Devise_Contrat],[DEVISE],[TYPE_SINISTRE],[TYPE_DECOMPTE],[TRAITE],[Nom_Assure],[Prenom_Assure])
SELECT
    l.id_sinistre, l.num_sinistre, l.id_ligne, 'ORACLE', l.site_gestion_theo, l.site_gestion_dcpt, l.marque,
    l.date_cloture, l.date_soins, l.code_acte, l.code_acte_fr, l.quantite, l.montant_depense_origine,
    l.frais_devise_contrat, l.rebt_devise_contrat, l.devise, l.type_sinistre, l.type_decompte, l.traite,
    l.nom_assureur, NULL
FROM dbo.claims_closed_lines l
WHERE l.id_sinistre IN (
    SELECT id_sinistre FROM dbo.claims_closed WHERE source_file = 'sinistres_termines.csv'
)
  AND NOT EXISTS (
      SELECT 1 FROM dbo.sinistres_termines_ligne t
      WHERE t.[ID_Sinistre] = l.id_sinistre AND t.[ID_Ligne] = l.id_ligne
  );
GO

SELECT TOP 20 * FROM dbo.sinistres_ter_NO_TE ORDER BY [Date_Cloture] DESC;
SELECT TOP 20 * FROM dbo.sinistres_termines ORDER BY [Date_Cloture] DESC;
SELECT TOP 20 * FROM dbo.sinistre_Ter_Lignes_NO_TE ORDER BY [Date_Cloture] DESC;
SELECT TOP 20 * FROM dbo.sinistres_termines_ligne ORDER BY [Date_Cloture] DESC;
GO

/* =============================================why
   7) EXTRA TABLES REQUESTED
   ============================================= */
IF OBJECT_ID('dbo.adherents', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.adherents (
        [ID_Adherent] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [Matricule] NVARCHAR(60) NULL,
        [Nom] NVARCHAR(255) NOT NULL,
        [Prenom] NVARCHAR(255) NULL,
        [Date_Naissance] DATE NULL,
        [Sexe] NVARCHAR(10) NULL,
        [Telephone] NVARCHAR(50) NULL,
        [Email] NVARCHAR(255) NULL,
        [Adresse] NVARCHAR(255) NULL,
        [Ville] NVARCHAR(100) NULL,
        [Pays] NVARCHAR(100) NULL,
        [Statut] NVARCHAR(50) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

/* ======================================================
   7.5) ADD ALL CLAIM HEADER COLUMNS TO MASTER TABLES
        (adds any missing columns from claim headers)
   ====================================================== */
DECLARE @master_claims_header NVARCHAR(MAX) = N'ID_Sinistre;Base_Info;Num_Sinistre;Reference_Interne;Reference_Externe;Reference_Compagnie;Devise_Contrat;Code_Etat;Date_Cloture;Date_Derniere_Action;Date_Reception;Date_Ouverture;Date_Reouverture;Date_Recloture;Date_Survenance;Num_Utilisateur;Utilisateur;Description;Commentaire;Commentaire_Dcpt;Num_famille;AD_NUM_SS;AD_CODE;ID_Client;Index_Societe;Index_Groupe;ID_Branche;Num_Branche;ID_Produit;Code_Produit;ID_Police;Num_Police;Compl_Police;Pol_Assure;ID_Convention;Num_Convention;ID_Assureur;Assureur;ID_Intermediaire;Code_Intermediaire;ID_Apporteur;Code_Apporteur;Montant_Rebt_DC;Monnaie_paiement;Montant_Rebt_DP;Type_Tiers;ID_Tiers;Code_Tiers;Titre;Nom1;Nom2;Adresse1;Adresse2;Adresse3;Localite;Code_Postal;Ville;Pays;Commentaire_Rep;Telephone1;Telephone2;Telephone3;Fax;Telex;Mode_Reglement;Code_Banque;Num_Guichet;Num_Compte;Cle_RIB;Nom_Banque;Recip_Nom;Recip_Prenom;Recip_Num_Cpt;Recip_Banque;Recip_Banque2;Recip_Type;Recip_Code;Recip_Adresse1;Recip_Adresse2;Recip_Adresse3;Recip_Code_Postal;Recip_Ville;Recip_Etat;Recip_Pays;Recip_Code_Swift;Recip_Ref2;Recip_Ref3;Recip_bqswift;Recip_bqaba;SIN_COUT;SIN_INTLOTEXP;SIN_INTLOTIMP;SIN_LIB01;SIN_LIB02;SIN_LIB03;SIN_LIB04;SIN_LIB05;SIN_LIB06;SIN_LIB07;SIN_LIB08;SIN_LIB09;SIN_LIB10;SIN_LIB11;SIN_LIB12;SIN_LIB13;SIN_LIB14;SIN_LIB15;SIN_LIB16;SIN_LIB17;SIN_LIB18;SIN_LIB19;SIN_LIB20;rep_id;rep_nomappel;rep_nomde1;rep_nomde2;rep_adresse;rep_adresse2;rep_ville;rep_codpo;rep_type;rep_sinptr;rep_commentaire;rep_telephone;rep_telex;rep_telecopie;rep_poste;rep_localite;rep_pays;rep_titre;rep_filiale;rep_compte;rep_code_pays;rep_num_doss;rep_code_insee;rep_code_rep;rep_zone;rep_cote;rep_code_comp;rep_adr_fact;rep_telephone2;rep_telephone3;rep_debsub;rep_finsub;rep_motif_fin;rep_type_benef;rep_refecho;rep_refexterne;rep_dombanque;rep_domguichet;rep_domcompte;rep_domcle;rep_domlibelle;rep_dome_numcpt;rep_dome_numcp2;rep_dome_bqnom1;rep_dome_bqnom2;rep_dome_bqadr1;rep_dome_bq_adr2;rep_dome_bqloc;rep_dome_bqcp;rep_dome_bqpays;rep_dome_bqvill;rep_adresse3;rep_dome_bqaba;rep_dome_bquid;rep_dome_bqcode;rep_adr_rel;rep_rublib01;rep_rublib02;rep_rublib03;rep_famille;rep_sfamille;rep_code_etabl;rep_ptrsororigid;rep_ptrpolid;rep_ptrribident;rep_moderegl;rep_adr_maint;rep_ident_pays;rep_dome_bqswift;rep_adr_com;rep_dome_nom_benef;rep_dome_prenom_benef;rep_dome_nature;rep_dome_code;rep_dome_etat;rep_ident_auxil;SIN_Date_IMP;CLIENT_REF;REP_CIE;REP_IMMAT;REP_NOPOL;REP_DATDEB_VAL;REP_DATFIN_VAL;REP_INTLOTEXP;REP_TIERS_CONV;TRAITE;ID_FAMILLE;NUM_FAMILLE_MULTIPOLICE;ENCAISSEUR;SIN_JUSTIFICATIF;REPRICING;ADJ_CODE;ADJ_NOM;SITE_GESTION_DCPT;DEVISE;TYPE_OF_LOG;ADJUSTMENT_REASON;ADJUSTMENT_DETAIL;SITE_GESTION_THEO;NUM_BORDERAU;BORDERAU;BDX_DATE_CREATION;EC_REASON;PRESAISIE_BY;CONF_EMAIL_SENT;SENT_DATE;CNV_NOEL_PLUS;USER_VALID;NOM_VALID;SITE_VALID;SIN_LIB21';

DECLARE @json_master NVARCHAR(MAX), @col NVARCHAR(4000), @sql NVARCHAR(MAX);

SET @json_master = N'["' + REPLACE(@master_claims_header, N';', N'","') + N'"]';

DECLARE master_cursor CURSOR LOCAL FAST_FORWARD FOR
SELECT [value] FROM OPENJSON(@json_master) ORDER BY TRY_CAST([key] AS int);

OPEN master_cursor;
FETCH NEXT FROM master_cursor INTO @col;
WHILE @@FETCH_STATUS = 0
BEGIN
    -- Add to adherents if missing
    SET @sql = N'IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N''dbo.adherents'') AND name = N''' + REPLACE(@col,'''','''''') + N''')' + NCHAR(13) + NCHAR(10)
             + N'ALTER TABLE dbo.adherents ADD ' + QUOTENAME(@col) + N' NVARCHAR(MAX) NULL;';
    EXEC sp_executesql @sql;

    -- Add to assures if missing
    SET @sql = N'IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N''dbo.assures'') AND name = N''' + REPLACE(@col,'''','''''') + N''')' + NCHAR(13) + NCHAR(10)
             + N'ALTER TABLE dbo.assures ADD ' + QUOTENAME(@col) + N' NVARCHAR(MAX) NULL;';
    EXEC sp_executesql @sql;

    -- Add to clients if missing
    SET @sql = N'IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N''dbo.clients'') AND name = N''' + REPLACE(@col,'''','''''') + N''')' + NCHAR(13) + NCHAR(10)
             + N'ALTER TABLE dbo.clients ADD ' + QUOTENAME(@col) + N' NVARCHAR(MAX) NULL;';
    EXEC sp_executesql @sql;

    FETCH NEXT FROM master_cursor INTO @col;
END

CLOSE master_cursor;
DEALLOCATE master_cursor;

GO

IF OBJECT_ID('dbo.assures', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.assures (
        [ID_Assure] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [Num_Assure] NVARCHAR(60) NULL,
        [Nom] NVARCHAR(255) NOT NULL,
        [Prenom] NVARCHAR(255) NULL,
        [Police] NVARCHAR(100) NULL,
        [Centre] NVARCHAR(100) NULL,
        [Assureur] NVARCHAR(255) NULL,
        [Date_Adhesion] DATE NULL,
        [Statut] NVARCHAR(50) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

IF OBJECT_ID('dbo.clients', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.clients (
        [ID_Client] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [Code_Client] NVARCHAR(60) NULL,
        [Nom_Client] NVARCHAR(255) NOT NULL,
        [Groupe] NVARCHAR(255) NULL,
        [Centre] NVARCHAR(100) NULL,
        [Pays] NVARCHAR(100) NULL,
        [Telephone] NVARCHAR(50) NULL,
        [Email] NVARCHAR(255) NULL,
        [Statut] NVARCHAR(50) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

/* =============================================
   8) SEED DATA FOR RELATED MASTER TABLES
      (derived from the claim rows above)
   ============================================= */
INSERT INTO dbo.adherents
([Matricule], [Nom], [Prenom], [Date_Naissance], [Sexe], [Telephone], [Email], [Adresse], [Ville], [Pays], [Statut])
SELECT * FROM (VALUES
    ('ADH-14000101', 'SKANDER', 'M.', '1986-02-18', 'M', '+216 70 100 101', 'skander.m@example.com', 'Tunis Office', 'TUNIS', 'TUNISIA', 'Actif'),
    ('ADH-14000102', 'NOUR', 'C.', '1991-07-09', 'F', '+971 50 100 102', 'nour.c@example.com', 'Dubai Office', 'DUBAI', 'UAE', 'Actif'),
    ('ADH-14000103', 'ALI', 'R.', '1989-04-22', 'M', '+216 70 100 103', 'ali.r@example.com', 'Tunis Office', 'TUNIS', 'TUNISIA', 'Actif'),
    ('ADH-14000104', 'AMIRA', 'H.', '1988-12-03', 'F', '+33 1 70 100 104', 'amira.h@example.com', 'Paris Office', 'PARIS', 'FRANCE', 'Actif'),
    ('ADH-14000105', 'SAMI', 'Z.', '1990-10-30', 'M', '+33 1 70 100 105', 'sami.z@example.com', 'Paris Office', 'PARIS', 'FRANCE', 'Actif')
) AS v([Matricule], [Nom], [Prenom], [Date_Naissance], [Sexe], [Telephone], [Email], [Adresse], [Ville], [Pays], [Statut])
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.adherents a
    WHERE a.[Matricule] = v.[Matricule]
);
GO

INSERT INTO dbo.assures
([Num_Assure], [Nom], [Prenom], [Police], [Centre], [Assureur], [Date_Adhesion], [Statut])
SELECT * FROM (VALUES
    ('ASS-14000101', 'ALLIANZ EUR', 'Claims', '080238/503/IMPACT/Z1', 'TUNIS', 'ALLIANZ EUR', '2019-07-19', 'Actif'),
    ('ASS-14000102', 'AL YOSSR TAKAFUL', 'Claims', 'YOSSR/WAHA/2019', 'DUBAI', 'AL YOSSR TAKAFUL', '2020-01-13', 'Actif'),
    ('ASS-14000103', 'LIC - MELLITAH', 'Claims', 'LIC/MLT/GAS/2020', 'DUBAI', 'LIC - MELLITAH', '2020-02-24', 'Actif'),
    ('ASS-14000104', 'THE GLOBAL FUND', 'Claims', '704548/0100/OPTION', 'PARIS', 'THE GLOBAL FUND', '2020-03-19', 'Actif'),
    ('ASS-14000105', 'AXA GLOBAL', 'Claims', 'E36137-160320-0220-B', 'PARIS', 'AXA GLOBAL', '2020-03-26', 'Actif')
) AS v([Num_Assure], [Nom], [Prenom], [Police], [Centre], [Assureur], [Date_Adhesion], [Statut])
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.assures a
    WHERE a.[Num_Assure] = v.[Num_Assure]
);
GO

INSERT INTO dbo.clients
([Code_Client], [Nom_Client], [Groupe], [Centre], [Pays], [Telephone], [Email], [Statut])
SELECT * FROM (VALUES
    ('CLI-14000101', 'ALLIANZ EUR', 'INSURANCE GROUP', 'TUNIS', 'TUNISIA', '+216 70 200 101', 'allianz@example.com', 'Actif'),
    ('CLI-14000102', 'AL YOSSR TAKAFUL', 'TAKAFUL GROUP', 'DUBAI', 'UAE', '+971 4 200 102', 'alyossr@example.com', 'Actif'),
    ('CLI-14000103', 'LIC - MELLITAH', 'ENERGY GROUP', 'DUBAI', 'LIBYA', '+971 4 200 103', 'licmellitah@example.com', 'Actif'),
    ('CLI-14000104', 'THE GLOBAL FUND', 'GLOBAL HEALTH', 'PARIS', 'SWITZERLAND', '+41 22 200 104', 'globalfund@example.com', 'Actif'),
    ('CLI-14000105', 'AXA GLOBAL', 'GLOBAL INSURANCE', 'PARIS', 'FRANCE', '+33 1 200 105', 'axa@example.com', 'Actif')
) AS v([Code_Client], [Nom_Client], [Groupe], [Centre], [Pays], [Telephone], [Email], [Statut])
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.clients c
    WHERE c.[Code_Client] = v.[Code_Client]
);
GO
