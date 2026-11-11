<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

try {
    $pdo = Database::getConnection();
    $driver = Database::getDriver();
    echo "Connected to database using driver: {$driver}\n";

    if ($driver === 'sqlite') {
        $cols = array_column($pdo->query("PRAGMA table_info(Placement)")->fetchAll(PDO::FETCH_ASSOC), 'name');
        
        $newCols = [
            'signed_dtr_file'        => 'TEXT DEFAULT NULL',
            'signed_dtr_filename'    => 'TEXT DEFAULT NULL',
            'signed_dtr_uploaded_at' => 'DATETIME DEFAULT NULL',
            'signed_dtr_notes'       => 'TEXT DEFAULT NULL',
            'signed_dtr_data'        => 'MEDIUMTEXT DEFAULT NULL',
        ];

        foreach ($newCols as $colName => $colDef) {
            if (!in_array($colName, $cols, true)) {
                $pdo->exec("ALTER TABLE Placement ADD COLUMN {$colName} {$colDef}");
                echo "Added column Placement.{$colName}\n";
            } else {
                echo "Column Placement.{$colName} already exists\n";
            }
        }

        // Recreate vw_placement_progress with the new columns
        $pdo->exec("DROP VIEW IF EXISTS vw_placement_progress");
        $viewSql = "
        CREATE VIEW vw_placement_progress AS
        SELECT
            p.placement_id,
            p.student_id,
            s.student_number,
            s.full_name AS student_name,
            s.program,
            s.year_level,
            s.section,
            s.email AS student_email,
            s.contact_number AS student_contact,
            p.employer_id,
            e.company_name,
            e.industry,
            e.address AS company_address,
            e.contact_person AS company_contact_person,
            e.contact_number AS company_contact_number,
            e.email AS company_email,
            e.moa_status,
            p.adviser_id,
            a.employee_number AS adviser_code,
            a.full_name AS adviser_name,
            a.department AS adviser_department,
            a.email AS adviser_email,
            p.academic_term,
            p.position_title,
            p.start_date,
            p.end_date,
            p.required_hours,
            p.status,
            p.signed_dtr_file,
            p.signed_dtr_filename,
            p.signed_dtr_uploaded_at,
            p.signed_dtr_notes,
            p.signed_dtr_data,
            COALESCE(tl_agg.total_hours_rendered, 0.00) AS total_hours_completed,
            CASE
                WHEN (p.required_hours - COALESCE(tl_agg.total_hours_rendered, 0.00)) > 0
                THEN (p.required_hours - COALESCE(tl_agg.total_hours_rendered, 0.00))
                ELSE 0.00
            END AS hours_remaining,
            ROUND(
                CASE
                    WHEN p.required_hours = 0 THEN 0.0
                    WHEN (COALESCE(tl_agg.total_hours_rendered, 0.00) / p.required_hours) * 100 > 100.0 THEN 100.0
                    ELSE (COALESCE(tl_agg.total_hours_rendered, 0.00) / p.required_hours) * 100
                END, 1
            ) AS completion_percentage,
            COALESCE(tl_agg.log_count, 0) AS total_log_days,
            tl_agg.last_logged_date,
            COALESCE(ev_agg.eval_count, 0) AS evaluation_count,
            COALESCE(ev_agg.has_employer_eval, 0) AS has_employer_eval,
            COALESCE(ev_agg.has_adviser_eval, 0) AS has_adviser_eval,
            ev_agg.employer_rating,
            ev_agg.adviser_rating,
            ev_agg.average_rating,
            CASE
                WHEN COALESCE(tl_agg.total_hours_rendered, 0.00) >= p.required_hours
                     AND COALESCE(ev_agg.eval_count, 0) > 0
                     AND p.status != 'dropped'
                THEN 1 ELSE 0
            END AS requirement_met,
            CASE
                WHEN COALESCE(tl_agg.total_hours_rendered, 0.00) >= p.required_hours
                THEN 'MIT-CPE-CLR-2026-' || printf('%04d', p.placement_id)
                ELSE NULL
            END AS clearance_reference
        FROM Placement p
        INNER JOIN Student s ON p.student_id = s.student_id
        INNER JOIN Employer e ON p.employer_id = e.employer_id
        INNER JOIN Adviser a ON p.adviser_id = a.adviser_id
        LEFT JOIN (
            SELECT
                placement_id,
                SUM(hours_rendered) AS total_hours_rendered,
                COUNT(*) AS log_count,
                MAX(date) AS last_logged_date
            FROM TimeLog
            WHERE approval_status != 'flagged'
            GROUP BY placement_id
        ) tl_agg ON p.placement_id = tl_agg.placement_id
        LEFT JOIN (
            SELECT
                placement_id,
                COUNT(*) AS eval_count,
                MAX(CASE WHEN evaluator_type = 'employer' THEN 1 ELSE 0 END) AS has_employer_eval,
                MAX(CASE WHEN evaluator_type = 'adviser' THEN 1 ELSE 0 END) AS has_adviser_eval,
                ROUND(AVG(CASE WHEN evaluator_type = 'employer' THEN rating ELSE NULL END), 2) AS employer_rating,
                ROUND(AVG(CASE WHEN evaluator_type = 'adviser' THEN rating ELSE NULL END), 2) AS adviser_rating,
                ROUND(AVG(rating), 2) AS average_rating
            FROM Evaluation
            GROUP BY placement_id
        ) ev_agg ON p.placement_id = ev_agg.placement_id
        ";
        $pdo->exec($viewSql);
        echo "Recreated vw_placement_progress successfully!\n";

        // Seed a sample signed DTR for placement 1 so the adviser and student have an immediate realistic document to preview!
        $pdo->exec("
            UPDATE Placement
            SET signed_dtr_filename = 'Kian_Balanag_Accenture_Signed_DTR_Oct2026.pdf',
                signed_dtr_uploaded_at = '2026-10-31 16:30:00',
                signed_dtr_notes = 'Verified and signed by Mr. Juan Carlos Roxas (Accenture Technical Lead) covering Weeks 1 to 8.',
                signed_dtr_file = 'sample_signed_dtr.pdf'
            WHERE placement_id = 1 AND signed_dtr_filename IS NULL
        ");
        echo "Sample signed DTR updated for Placement #1\n";
    }

    echo "Migration completed successfully!\n";
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
