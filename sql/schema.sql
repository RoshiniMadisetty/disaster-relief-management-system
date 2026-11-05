-- =====================================================================
-- Disaster Relief Resource Allocation and Aid Distribution System
-- File 1 of 2: DDL (tables, ALTER, DROP demo, indexes, users)
-- WARNING: this script resets the database each time it is run.
-- =====================================================================
DROP DATABASE IF EXISTS Disaster_Relief_DB;
CREATE DATABASE Disaster_Relief_DB;
USE Disaster_Relief_DB;

CREATE TABLE Disaster (
    Disaster_ID INT AUTO_INCREMENT,
    Disaster_Name VARCHAR(100) NOT NULL,
    Disaster_Type VARCHAR(50) NOT NULL,
    Location VARCHAR(150) NOT NULL,
    Start_Date DATE NOT NULL,
    Severity ENUM('Low','Medium','High','Critical') NOT NULL,
    Status ENUM('Active','Controlled','Closed') DEFAULT 'Active',
    CONSTRAINT pk_disaster PRIMARY KEY (Disaster_ID),
    CONSTRAINT chk_disaster_name CHECK (CHAR_LENGTH(TRIM(Disaster_Name)) > 0)
);

CREATE TABLE Relief_Center (
    Center_ID INT AUTO_INCREMENT,
    Center_Name VARCHAR(100) NOT NULL,
    Location VARCHAR(150) NOT NULL,
    Capacity INT NOT NULL,
    Contact_Number VARCHAR(15),
    CONSTRAINT pk_relief_center PRIMARY KEY (Center_ID),
    CONSTRAINT chk_center_capacity CHECK (Capacity > 0)
);

CREATE TABLE Resource (
    Resource_ID INT AUTO_INCREMENT,
    Resource_Name VARCHAR(100) NOT NULL,
    Category ENUM('Food','Water','Medicine','Clothing','Shelter','Other') NOT NULL,
    Unit VARCHAR(30) NOT NULL,
    Available_Quantity INT NOT NULL DEFAULT 0,
    Minimum_Stock INT NOT NULL DEFAULT 0,
    CONSTRAINT pk_resource PRIMARY KEY (Resource_ID),
    CONSTRAINT chk_available_quantity CHECK (Available_Quantity >= 0),
    CONSTRAINT chk_minimum_stock CHECK (Minimum_Stock >= 0),
    CONSTRAINT chk_resource_name CHECK (CHAR_LENGTH(TRIM(Resource_Name)) > 0)
);

CREATE TABLE Beneficiary (
    Beneficiary_ID INT AUTO_INCREMENT,
    Beneficiary_Name VARCHAR(100) NOT NULL,
    Age INT,
    Gender VARCHAR(20),
    Contact_Number VARCHAR(15),
    Vulnerability_Level ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
    Center_ID INT NOT NULL,
    Disaster_ID INT NOT NULL,
    CONSTRAINT pk_beneficiary PRIMARY KEY (Beneficiary_ID),
    CONSTRAINT chk_beneficiary_age CHECK (Age >= 0),
    CONSTRAINT chk_beneficiary_name CHECK (CHAR_LENGTH(TRIM(Beneficiary_Name)) > 0),
    CONSTRAINT fk_beneficiary_center FOREIGN KEY (Center_ID) REFERENCES Relief_Center(Center_ID),
    CONSTRAINT fk_beneficiary_disaster FOREIGN KEY (Disaster_ID) REFERENCES Disaster(Disaster_ID)
);

CREATE TABLE Aid_Request (
    Request_ID INT AUTO_INCREMENT,
    Center_ID INT NOT NULL,
    Disaster_ID INT NOT NULL,
    Request_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Priority ENUM('Low','Medium','High','Critical') NOT NULL,
    Status ENUM('Pending','Partially Allocated','Allocated','Rejected','Completed') DEFAULT 'Pending',
    CONSTRAINT pk_aid_request PRIMARY KEY (Request_ID),
    CONSTRAINT fk_request_center FOREIGN KEY (Center_ID) REFERENCES Relief_Center(Center_ID),
    CONSTRAINT fk_request_disaster FOREIGN KEY (Disaster_ID) REFERENCES Disaster(Disaster_ID)
);

CREATE TABLE Request_Item (
    Request_ID INT NOT NULL,
    Resource_ID INT NOT NULL,
    Quantity_Requested INT NOT NULL,
    Quantity_Allocated INT NOT NULL DEFAULT 0,
    CONSTRAINT pk_request_item PRIMARY KEY (Request_ID, Resource_ID),
    CONSTRAINT fk_request_item_request FOREIGN KEY (Request_ID) REFERENCES Aid_Request(Request_ID) ON DELETE CASCADE,
    CONSTRAINT fk_request_item_resource FOREIGN KEY (Resource_ID) REFERENCES Resource(Resource_ID),
    CONSTRAINT chk_quantity_requested CHECK (Quantity_Requested > 0),
    CONSTRAINT chk_quantity_allocated CHECK (Quantity_Allocated >= 0 AND Quantity_Allocated <= Quantity_Requested)
);

CREATE TABLE Allocation (
    Allocation_ID INT AUTO_INCREMENT,
    Request_ID INT NOT NULL,
    Allocation_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Allocation_Status ENUM('Pending','Approved','Dispatched','Delivered') DEFAULT 'Pending',
    CONSTRAINT pk_allocation PRIMARY KEY (Allocation_ID),
    CONSTRAINT fk_allocation_request FOREIGN KEY (Request_ID) REFERENCES Aid_Request(Request_ID)
);

CREATE TABLE Allocation_Item (
    Allocation_ID INT NOT NULL,
    Resource_ID INT NOT NULL,
    Allocated_Quantity INT NOT NULL,
    CONSTRAINT pk_allocation_item PRIMARY KEY (Allocation_ID, Resource_ID),
    CONSTRAINT fk_allocation_item_allocation FOREIGN KEY (Allocation_ID) REFERENCES Allocation(Allocation_ID) ON DELETE CASCADE,
    CONSTRAINT fk_allocation_item_resource FOREIGN KEY (Resource_ID) REFERENCES Resource(Resource_ID),
    CONSTRAINT chk_allocated_quantity CHECK (Allocated_Quantity > 0)
);

CREATE TABLE Distribution (
    Distribution_ID INT AUTO_INCREMENT,
    Allocation_ID INT NOT NULL,
    Beneficiary_ID INT NOT NULL,
    Distribution_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_distribution PRIMARY KEY (Distribution_ID),
    CONSTRAINT fk_distribution_allocation FOREIGN KEY (Allocation_ID) REFERENCES Allocation(Allocation_ID),
    CONSTRAINT fk_distribution_beneficiary FOREIGN KEY (Beneficiary_ID) REFERENCES Beneficiary(Beneficiary_ID)
);

CREATE TABLE Distribution_Item (
    Distribution_ID INT NOT NULL,
    Resource_ID INT NOT NULL,
    Quantity_Distributed INT NOT NULL,
    CONSTRAINT pk_distribution_item PRIMARY KEY (Distribution_ID, Resource_ID),
    CONSTRAINT fk_distribution_item_distribution FOREIGN KEY (Distribution_ID) REFERENCES Distribution(Distribution_ID) ON DELETE CASCADE,
    CONSTRAINT fk_distribution_item_resource FOREIGN KEY (Resource_ID) REFERENCES Resource(Resource_ID),
    CONSTRAINT chk_quantity_distributed CHECK (Quantity_Distributed > 0)
);

-- ---------- ALTER ----------
ALTER TABLE Relief_Center ADD Email VARCHAR(100);
ALTER TABLE Relief_Center ADD CONSTRAINT uq_relief_center_email UNIQUE (Email);

-- ---------- Indexes ----------
CREATE INDEX idx_aid_request_priority ON Aid_Request(Priority);
CREATE INDEX idx_aid_request_status   ON Aid_Request(Status);
CREATE INDEX idx_disaster_location    ON Disaster(Location);
CREATE INDEX idx_resource_category    ON Resource(Category);
CREATE INDEX idx_beneficiary_center   ON Beneficiary(Center_ID);

-- ---------- DROP demo ----------
CREATE TABLE Temporary_Log (Log_ID INT PRIMARY KEY, Description VARCHAR(200));
DROP TABLE Temporary_Log;

-- ---------- Application users (authentication + roles) ----------
CREATE TABLE Users (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,          -- bcrypt hash, never plain text
    Role ENUM('Admin','Staff') NOT NULL
);
