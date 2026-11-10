-- LiverCare AI — PostgreSQL Database Initialization Script
-- Run in pgAdmin or psql: psql -U postgres -f init_postgres.sql

-- Create database (run as postgres superuser)
-- CREATE DATABASE livercare_db;

-- Connect to livercare_db before running below:
-- \c livercare_db;

CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
    gender VARCHAR(16) NOT NULL,
    total_bilirubin DOUBLE PRECISION NOT NULL,
    direct_bilirubin DOUBLE PRECISION NOT NULL,
    albumin DOUBLE PRECISION NOT NULL,
    alkaline_phosphatase DOUBLE PRECISION NOT NULL,
    sgot DOUBLE PRECISION NOT NULL,
    cholesterol DOUBLE PRECISION NOT NULL,
    result VARCHAR(32) NOT NULL,
    probability DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on created_at for fast history sorting
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions (created_at DESC);

-- Sample seed records (optional)
INSERT INTO predictions (
    age, gender, total_bilirubin, direct_bilirubin, albumin,
    alkaline_phosphatase, sgot, cholesterol, result, probability
) VALUES
(52, 'Female', 1.1, 0.4, 3.8, 90.0, 42.0, 170.0, 'Low Risk', 18.7),
(45, 'Male', 3.8, 1.9, 2.7, 240.0, 120.0, 230.0, 'High Risk', 78.2)
ON CONFLICT DO NOTHING;

