<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

try {
    $pdo = Database::getConnection();
    $driver = Database::getDriver();

    echo "Running Evaluation Instrument migration on {$driver}...\n";

    // 1. Check existing columns in Evaluation table
    if ($driver === 'sqlite') {
        $cols = $pdo->query("PRAGMA table_info(Evaluation)")->fetchAll(PDO::FETCH_ASSOC);
        $colNames = array_column($cols, 'name');

        if (!in_array('instrument_type', $colNames, true)) {
            $pdo->exec("ALTER TABLE Evaluation ADD COLUMN instrument_type TEXT DEFAULT 'supervisor_to_student'");
            echo "Added column 'instrument_type' to SQLite Evaluation table.\n";
        } else {
            echo "Column 'instrument_type' already exists in SQLite.\n";
        }

        if (!in_array('criteria_scores', $colNames, true)) {
            $pdo->exec("ALTER TABLE Evaluation ADD COLUMN criteria_scores TEXT NULL");
            echo "Added column 'criteria_scores' to SQLite Evaluation table.\n";
        } else {
            echo "Column 'criteria_scores' already exists in SQLite.\n";
        }

        // Backfill existing rows
        $pdo->exec("UPDATE Evaluation SET instrument_type = 'supervisor_to_student' WHERE evaluator_type = 'employer' AND (instrument_type IS NULL OR instrument_type = '')");
        $pdo->exec("UPDATE Evaluation SET instrument_type = 'adviser_to_hte' WHERE evaluator_type = 'adviser' AND (instrument_type IS NULL OR instrument_type = '')");
        echo "Backfilled existing evaluation records.\n";
    } else {
        // MySQL
        $cols = $pdo->query("SHOW COLUMNS FROM Evaluation")->fetchAll(PDO::FETCH_ASSOC);
        $colNames = array_column($cols, 'Field');

        if (!in_array('instrument_type', $colNames, true)) {
            $pdo->exec("ALTER TABLE Evaluation ADD COLUMN instrument_type VARCHAR(50) NOT NULL DEFAULT 'supervisor_to_student'");
            echo "Added column 'instrument_type' to MySQL Evaluation table.\n";
        }

        if (!in_array('criteria_scores', $colNames, true)) {
            $pdo->exec("ALTER TABLE Evaluation ADD COLUMN criteria_scores TEXT NULL");
            echo "Added column 'criteria_scores' to MySQL Evaluation table.\n";
        }
    }

    echo "Migration completed successfully!\n";
} catch (Throwable $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
    exit(1);
}
