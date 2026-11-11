<?php
declare(strict_types=1);

/**
 * Metropolitan Institute of Technology — Computer Engineering Department
 * Internship / OJT Tracking and Employer Database System
 *
 * Database Configuration & Auto-Initialization Layer
 * Dual-Engine Support: SQLite 3 (ojt_tracking.db) & MySQL / MariaDB (ojt_tracking_db)
 */

class Database
{
    private static ?PDO $instance = null;
    private static ?string $resolvedDriver = null;

    private string $host = '127.0.0.1';
    private int $port = 3306;
    private string $dbName = 'ojt_tracking_db';
    private string $username = 'root';
    private string $password = '';

    public static function getDriver(): string
    {
        if (self::$resolvedDriver !== null) {
            return self::$resolvedDriver;
        }

        // 1. Environment variable override
        $envDriver = getenv('DB_DRIVER');
        if ($envDriver && in_array(strtolower($envDriver), ['sqlite', 'mysql'], true)) {
            self::$resolvedDriver = strtolower($envDriver);
            return self::$resolvedDriver;
        }

        // 2. Configuration file (backend/config/db_config.json)
        $configFile = __DIR__ . '/db_config.json';
        if (file_exists($configFile)) {
            $conf = json_decode((string)file_get_contents($configFile), true);
            if (is_array($conf) && isset($conf['driver']) && in_array(strtolower((string)$conf['driver']), ['sqlite', 'mysql'], true)) {
                self::$resolvedDriver = strtolower((string)$conf['driver']);
                return self::$resolvedDriver;
            }
        }

        // 3. Default to SQLite
        self::$resolvedDriver = 'sqlite';
        return self::$resolvedDriver;
    }

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $db = new self();
            self::$instance = $db->connect();
        }
        return self::$instance;
    }

    private function connect(): PDO
    {
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $driver = self::getDriver();

        if ($driver === 'sqlite') {
            return $this->connectSqlite($options);
        }

        return $this->connectMysql($options);
    }

    private function connectSqlite(array $options): PDO
    {
        $sqliteFile = realpath(__DIR__ . '/../../database/ojt_tracking.db');
        if (!$sqliteFile) {
            $sqliteFile = __DIR__ . '/../../database/ojt_tracking.db';
        }

        $isNew = !file_exists($sqliteFile) || filesize($sqliteFile) === 0;

        $options[PDO::ATTR_TIMEOUT] = 5;

        $pdo = new PDO('sqlite:' . $sqliteFile, null, null, $options);
        $pdo->exec('PRAGMA foreign_keys = ON;');
        $pdo->exec('PRAGMA busy_timeout = 5000;');

        try {
            $pdo->exec('PRAGMA journal_mode = WAL;');
        } catch (Throwable $e) {
            // Non-critical: allowed if another process currently holds an exclusive lock
        }

        // Custom SQLite compatibility functions
        $pdo->sqliteCreateFunction('NOW', fn() => date('Y-m-d H:i:s'));
        $pdo->sqliteCreateFunction('UNIX_TIMESTAMP', fn($d = null) => $d ? strtotime($d) : time());

        if ($isNew) {
            $sqlScript = realpath(__DIR__ . '/../../database/schema_and_seed_sqlite.sql');
            if ($sqlScript && file_exists($sqlScript)) {
                $pdo->exec((string)file_get_contents($sqlScript));
            }
        }

        return $pdo;
    }

    private function connectMysql(array $options): PDO
    {
        try {
            $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $this->host, $this->port, $this->dbName);
            return new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            // If MySQL connection refused (2002), try auto-starting XAMPP mysqld on local Windows machine
            if (strpos($e->getMessage(), '2002') !== false && PHP_OS_FAMILY === 'Windows') {
                $mysqldPath = 'C:\\xampp\\mysql\\bin\\mysqld.exe';
                $myIniPath  = 'C:\\xampp\\mysql\\bin\\my.ini';
                if (file_exists($mysqldPath)) {
                    pclose(popen("start /B \"\" \"$mysqldPath\" --defaults-file=\"$myIniPath\" --standalone", 'r'));
                    usleep(2200000); // wait 2.2s for MariaDB startup
                }
            }

            // Connect to server without dbname and auto-initialize schema if needed
            $serverDsn = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $this->host, $this->port);
            $pdo = new PDO($serverDsn, $this->username, $this->password, $options);

            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$this->dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `{$this->dbName}`");

            // Check if tables exist
            $stmt = $pdo->query("SHOW TABLES LIKE 'Users'");
            if ($stmt->rowCount() === 0) {
                $this->importSchemaUsingMysqlCli();
            }

            $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $this->host, $this->port, $this->dbName);
            return new PDO($dsn, $this->username, $this->password, $options);
        }
    }

    private function importSchemaUsingMysqlCli(): void
    {
        $sqlFile = realpath(__DIR__ . '/../../database/schema_and_seed.sql');
        $mysqlBin = 'C:\\xampp\\mysql\\bin\\mysql.exe';
        if ($sqlFile && file_exists($mysqlBin)) {
            $cmd = sprintf('"%s" -u %s < "%s" 2>&1', $mysqlBin, $this->username, $sqlFile);
            shell_exec($cmd);
        }
    }

    /**
     * Synchronize ComplianceReport and Placement status for a single placement_id.
     */
    public static function syncCompliance(PDO $pdo, int $placementId): void
    {
        $isSqlite = self::getDriver() === 'sqlite';
        if (!$isSqlite) {
            try {
                $stmt = $pdo->prepare('CALL sp_sync_placement_compliance(:pid)');
                $stmt->execute([':pid' => $placementId]);
                $stmt->closeCursor();
                return;
            } catch (Throwable $e) {
                // fall through to portable query below
            }
        }

        // Direct SQL calculation (works on both SQLite and MySQL)
        $stmt = $pdo->prepare("
            SELECT p.required_hours, p.status,
                   COALESCE((SELECT SUM(hours_rendered) FROM TimeLog WHERE placement_id = p.placement_id AND approval_status != 'flagged'), 0.00) AS total_hours,
                   COALESCE((SELECT COUNT(*) FROM Evaluation WHERE placement_id = p.placement_id), 0) AS eval_count,
                   COALESCE((SELECT MAX(CASE WHEN evaluator_type = 'employer' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0) AS emp_eval,
                   COALESCE((SELECT MAX(CASE WHEN evaluator_type = 'adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0) AS adv_eval,
                   (SELECT ROUND(AVG(rating), 2) FROM Evaluation WHERE placement_id = p.placement_id) AS avg_rating
            FROM Placement p
            WHERE p.placement_id = :pid
        ");
        $stmt->execute([':pid' => $placementId]);
        $row = $stmt->fetch();
        if (!$row) {
            return;
        }

        $totalHours = (float)$row['total_hours'];
        $reqHours   = (float)$row['required_hours'];
        $evalCount  = (int)$row['eval_count'];
        $status     = $row['status'];

        $reqMet = ($totalHours >= $reqHours && $status !== 'dropped') ? 1 : 0;
        $clearanceRef = $reqMet ? sprintf('MIT-CPE-CLR-2026-%04d', $placementId) : null;

        if ($isSqlite) {
            $up = $pdo->prepare("
                INSERT INTO ComplianceReport (
                    placement_id, total_hours_completed, requirement_met,
                    has_employer_eval, has_adviser_eval, average_rating, clearance_reference, generated_date
                ) VALUES (
                    :pid, :th, :rm, :ee, :ae, :ar, :cr, datetime('now')
                )
                ON CONFLICT(placement_id) DO UPDATE SET
                    total_hours_completed = excluded.total_hours_completed,
                    requirement_met = excluded.requirement_met,
                    has_employer_eval = excluded.has_employer_eval,
                    has_adviser_eval = excluded.has_adviser_eval,
                    average_rating = excluded.average_rating,
                    clearance_reference = excluded.clearance_reference,
                    generated_date = datetime('now')
            ");
        } else {
            $up = $pdo->prepare("
                INSERT INTO ComplianceReport (
                    placement_id, total_hours_completed, requirement_met,
                    has_employer_eval, has_adviser_eval, average_rating, clearance_reference, generated_date
                ) VALUES (
                    :pid, :th, :rm, :ee, :ae, :ar, :cr, NOW()
                )
                ON DUPLICATE KEY UPDATE
                    total_hours_completed = VALUES(total_hours_completed),
                    requirement_met = VALUES(requirement_met),
                    has_employer_eval = VALUES(has_employer_eval),
                    has_adviser_eval = VALUES(has_adviser_eval),
                    average_rating = VALUES(average_rating),
                    clearance_reference = VALUES(clearance_reference),
                    generated_date = NOW()
            ");
        }

        $up->execute([
            ':pid' => $placementId,
            ':th'  => $totalHours,
            ':rm'  => $reqMet,
            ':ee'  => (int)$row['emp_eval'],
            ':ae'  => (int)$row['adv_eval'],
            ':ar'  => $row['avg_rating'],
            ':cr'  => $clearanceRef,
        ]);

        if ($status !== 'dropped') {
            $newStatus = $reqMet ? 'completed' : 'ongoing';
            $pdo->prepare('UPDATE Placement SET status = :st WHERE placement_id = :pid')
                ->execute([':st' => $newStatus, ':pid' => $placementId]);
        }
    }

    public static function syncAllCompliance(PDO $pdo): void
    {
        $ids = $pdo->query('SELECT placement_id FROM Placement')->fetchAll(PDO::FETCH_COLUMN);
        foreach ($ids as $id) {
            self::syncCompliance($pdo, (int)$id);
        }
    }
}
