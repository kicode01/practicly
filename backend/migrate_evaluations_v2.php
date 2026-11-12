<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

try {
    $pdo = Database::getConnection();
    $driver = Database::getDriver();
    echo "Running Evaluation v2 & 4-Instrument Compliance migration on {$driver}...\n";

    if ($driver === 'sqlite') {
        $pCols = array_column($pdo->query("PRAGMA table_info(Placement)")->fetchAll(PDO::FETCH_ASSOC), 'name');
        $newPlacementCols = [
            'signed_eval_file'        => 'TEXT DEFAULT NULL',
            'signed_eval_filename'    => 'TEXT DEFAULT NULL',
            'signed_eval_uploaded_at' => 'DATETIME DEFAULT NULL',
            'signed_eval_notes'       => 'TEXT DEFAULT NULL',
            'signed_eval_data'        => 'MEDIUMTEXT DEFAULT NULL',
        ];
        foreach ($newPlacementCols as $col => $def) {
            if (!in_array($col, $pCols, true)) {
                $pdo->exec("ALTER TABLE Placement ADD COLUMN {$col} {$def}");
                echo "Added Placement.{$col}\n";
            }
        }

        $cCols = array_column($pdo->query("PRAGMA table_info(ComplianceReport)")->fetchAll(PDO::FETCH_ASSOC), 'name');
        $newCompCols = [
            'has_student_supervisor_eval' => 'INTEGER NOT NULL DEFAULT 0 CHECK(has_student_supervisor_eval IN (0, 1))',
            'has_student_adviser_eval'    => 'INTEGER NOT NULL DEFAULT 0 CHECK(has_student_adviser_eval IN (0, 1))',
        ];
        foreach ($newCompCols as $col => $def) {
            if (!in_array($col, $cCols, true)) {
                $pdo->exec("ALTER TABLE ComplianceReport ADD COLUMN {$col} {$def}");
                echo "Added ComplianceReport.{$col}\n";
            }
        }

        // Fix historical seeded adviser rows that defaulted to 'supervisor_to_student'
        $pdo->exec("
            UPDATE Evaluation
            SET instrument_type = 'adviser_to_hte'
            WHERE evaluator_type = 'adviser'
              AND (instrument_type IS NULL OR instrument_type = '' OR instrument_type = 'supervisor_to_student')
        ");

        // Seed Student INST-01 and INST-04 evaluations for completed alumni placements (2,6,9,10,12,13,14,16,18,20)
        // Intentionally leaves placement 1 (Balanag, Kian H.) at 2/4 so student demo shows pending INST-01 & INST-04
        $alumniSeeds = [
            [2,  'Calangian, Emmanuel G.',       '2026-10-28', 4.95, 4.90, 5.00, 4.95, 'Mr. Carlo J. Pangilinan provided clear architecture reviews and backend optimization mentorship.', 4.95, 4.95, 5.00, 4.97, 'Engr. Dela Cruz guided all DTR deliverables and capstone alignment weekly.'],
            [6,  'Villanueva, Clarisse Anne T.', '2026-10-28', 4.95, 5.00, 4.95, 4.97, 'Dr. Kenneth Y. Lim mentored RTL verification best practices consistently.', 4.95, 4.95, 5.00, 4.97, 'Dr. Bautista monitored progress closely and checked laboratory reports promptly.'],
            [9,  'Alcantara, Justine Mark D.',   '2026-10-28', 4.90, 4.95, 4.95, 4.93, 'Engr. Salazar provided hands-on ATE probe instrumentation coaching.', 4.90, 4.95, 4.95, 4.93, 'Engr. Tolentino checked semiconductor compliance logs consistently.'],
            [10, 'Pascual, Bea Katrina S.',      '2026-10-29', 4.95, 4.95, 5.00, 4.97, 'Engr. Ilagan gave constructive API scalability feedback every sprint.', 4.95, 4.95, 5.00, 4.97, 'Engr. Dela Cruz endorsed verification milestones on schedule.'],
            [12, 'Evangelista, Hannah Camille B.','2026-10-29',4.90, 4.95, 4.95, 4.93, 'Engr. Taniguchi taught strict DRC/LVS verification workflows.', 4.90, 4.90, 5.00, 4.93, 'Engr. Tolentino supported HTE coordination throughout the term.'],
            [13, 'Bautista, John Paul V.',       '2026-11-03', 4.85, 4.90, 4.95, 4.90, 'Ms. Policarpio guided full-stack PR reviews and CI pipelines.', 4.85, 4.90, 4.95, 4.90, 'Dr. Macapagal provided clear practicum documentation guidance.'],
            [14, 'Castillo, Angelica Joy M.',    '2026-10-28', 4.95, 5.00, 5.00, 4.98, 'Engr. Manansala shared threat hunting workflows and YARA feedback.', 4.95, 4.95, 5.00, 4.97, 'Dr. Macapagal validated research milestones and compliance reports.'],
            [16, 'Aquino, Danielle Faith R.',    '2026-10-29', 4.90, 4.90, 4.95, 4.92, 'Engr. Ilagan reviewed Kubernetes IaC rollouts thoroughly.', 4.90, 4.95, 4.95, 4.93, 'Dr. Bautista checked HTE site visits and attendance verification.'],
            [18, 'Ocampo, Trisha Nicole G.',     '2026-10-29', 4.90, 4.95, 4.90, 4.92, 'Mr. Pangilinan structured weekly ETL quality walkthroughs.', 4.90, 4.90, 4.95, 4.92, 'Dr. Macapagal confirmed endorsement readiness ahead of deadline.'],
            [20, 'Mercado, Alyssa Marie F.',     '2026-10-29', 4.90, 4.95, 4.95, 4.93, 'Ms. Soriano coached Cypress regression design and QA triaging.', 4.90, 4.90, 5.00, 4.93, 'Engr. Vergara guided weekly accomplishment reviews effectively.'],
        ];

        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM Evaluation WHERE placement_id = :pid AND instrument_type = :itype");
        $insStmt = $pdo->prepare("
            INSERT INTO Evaluation (
                placement_id, instrument_type, evaluator_type, evaluator_name,
                technical_score, attitude_score, attendance_score, rating, comments, date_evaluated
            ) VALUES (
                :pid, :itype, 'student', :ename, :t, :a, :at, :r, :c, :dt
            )
        ");

        foreach ($alumniSeeds as $row) {
            [$pid, $sname, $dt, $t1, $a1, $at1, $r1, $c1, $t4, $a4, $at4, $r4, $c4] = $row;
            $checkStmt->execute([':pid' => $pid, ':itype' => 'student_to_supervisor']);
            if ((int)$checkStmt->fetchColumn() === 0) {
                $insStmt->execute([
                    ':pid' => $pid, ':itype' => 'student_to_supervisor', ':ename' => $sname,
                    ':t' => $t1, ':a' => $a1, ':at' => $at1, ':r' => $r1, ':c' => $c1, ':dt' => $dt,
                ]);
            }
            $checkStmt->execute([':pid' => $pid, ':itype' => 'student_to_adviser']);
            if ((int)$checkStmt->fetchColumn() === 0) {
                $insStmt->execute([
                    ':pid' => $pid, ':itype' => 'student_to_adviser', ':ename' => $sname,
                    ':t' => $t4, ':a' => $a4, ':at' => $at4, ':r' => $r4, ':c' => $c4, ':dt' => $dt,
                ]);
            }
        }

        // Drop old triggers & views that used stale 1-eval / hours-only clearance rules
        $triggers = [
            'trg_timelog_after_insert',
            'trg_timelog_after_update',
            'trg_timelog_after_delete',
            'trg_evaluation_after_insert',
            'trg_evaluation_after_update',
            'trg_evaluation_after_delete',
            'trg_placement_after_insert',
            'trg_placement_after_update',
        ];
        foreach ($triggers as $trg) {
            $pdo->exec("DROP TRIGGER IF EXISTS {$trg}");
        }

        // Unified CTE-free SQLite compliance expression reused inside triggers
        $makeUpsertSql = static function (string $pidExpr): string {
            return "
                INSERT INTO ComplianceReport (
                    placement_id, total_hours_completed, requirement_met,
                    has_employer_eval, has_adviser_eval,
                    has_student_supervisor_eval, has_student_adviser_eval,
                    average_rating, clearance_reference, generated_date
                )
                SELECT
                    p.placement_id,
                    COALESCE((SELECT SUM(hours_rendered) FROM TimeLog WHERE placement_id = p.placement_id AND approval_status != 'flagged'), 0.00),
                    CASE
                        WHEN COALESCE((SELECT SUM(hours_rendered) FROM TimeLog WHERE placement_id = p.placement_id AND approval_status != 'flagged'), 0.00) >= p.required_hours
                             AND p.status != 'dropped'
                             AND (
                                 COALESCE((SELECT MAX(CASE WHEN instrument_type = 'supervisor_to_student' OR evaluator_type = 'employer' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0) = 1
                                 OR COALESCE(TRIM(p.signed_eval_filename), '') != ''
                                 OR COALESCE(TRIM(p.signed_eval_file), '') != ''
                             )
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'adviser_to_hte' OR evaluator_type = 'adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0) = 1
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_supervisor' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0) = 1
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0) = 1
                        THEN 1
                        ELSE 0
                    END,
                    CASE
                        WHEN COALESCE((SELECT MAX(CASE WHEN instrument_type = 'supervisor_to_student' OR evaluator_type = 'employer' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0) = 1
                             OR COALESCE(TRIM(p.signed_eval_filename), '') != ''
                             OR COALESCE(TRIM(p.signed_eval_file), '') != ''
                        THEN 1 ELSE 0
                    END,
                    COALESCE((SELECT MAX(CASE WHEN instrument_type = 'adviser_to_hte' OR evaluator_type = 'adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0),
                    COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_supervisor' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0),
                    COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0),
                    (SELECT ROUND(AVG(rating), 2) FROM Evaluation WHERE placement_id = p.placement_id),
                    CASE
                        WHEN COALESCE((SELECT SUM(hours_rendered) FROM TimeLog WHERE placement_id = p.placement_id AND approval_status != 'flagged'), 0.00) >= p.required_hours
                             AND p.status != 'dropped'
                             AND (
                                 COALESCE((SELECT MAX(CASE WHEN instrument_type = 'supervisor_to_student' OR evaluator_type = 'employer' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0) = 1
                                 OR COALESCE(TRIM(p.signed_eval_filename), '') != ''
                                 OR COALESCE(TRIM(p.signed_eval_file), '') != ''
                             )
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'adviser_to_hte' OR evaluator_type = 'adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0) = 1
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_supervisor' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0) = 1
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = p.placement_id), 0) = 1
                        THEN printf('MIT-CPE-CLR-2026-%04d', p.placement_id)
                        ELSE NULL
                    END,
                    DATETIME('now')
                FROM Placement p
                WHERE p.placement_id = {$pidExpr}
                ON CONFLICT(placement_id) DO UPDATE SET
                    total_hours_completed = excluded.total_hours_completed,
                    requirement_met = excluded.requirement_met,
                    has_employer_eval = excluded.has_employer_eval,
                    has_adviser_eval = excluded.has_adviser_eval,
                    has_student_supervisor_eval = excluded.has_student_supervisor_eval,
                    has_student_adviser_eval = excluded.has_student_adviser_eval,
                    average_rating = excluded.average_rating,
                    clearance_reference = excluded.clearance_reference,
                    generated_date = DATETIME('now');

                UPDATE Placement
                SET status = CASE
                    WHEN (SELECT requirement_met FROM ComplianceReport WHERE placement_id = {$pidExpr}) = 1 THEN 'completed'
                    ELSE 'ongoing'
                END
                WHERE placement_id = {$pidExpr} AND status != 'dropped';
            ";
        };

        $pdo->exec("CREATE TRIGGER trg_timelog_after_insert AFTER INSERT ON TimeLog BEGIN " . $makeUpsertSql('NEW.placement_id') . " END;");
        $pdo->exec("CREATE TRIGGER trg_timelog_after_update AFTER UPDATE ON TimeLog BEGIN " . $makeUpsertSql('NEW.placement_id') . " END;");
        $pdo->exec("CREATE TRIGGER trg_timelog_after_delete AFTER DELETE ON TimeLog BEGIN " . $makeUpsertSql('OLD.placement_id') . " END;");
        $pdo->exec("CREATE TRIGGER trg_evaluation_after_insert AFTER INSERT ON Evaluation BEGIN " . $makeUpsertSql('NEW.placement_id') . " END;");
        $pdo->exec("CREATE TRIGGER trg_evaluation_after_update AFTER UPDATE ON Evaluation BEGIN " . $makeUpsertSql('NEW.placement_id') . " END;");
        $pdo->exec("CREATE TRIGGER trg_evaluation_after_delete AFTER DELETE ON Evaluation BEGIN " . $makeUpsertSql('OLD.placement_id') . " END;");
        $pdo->exec("
            CREATE TRIGGER trg_placement_after_insert AFTER INSERT ON Placement
            BEGIN
                INSERT INTO ComplianceReport (
                    placement_id, total_hours_completed, requirement_met,
                    has_employer_eval, has_adviser_eval,
                    has_student_supervisor_eval, has_student_adviser_eval,
                    average_rating, clearance_reference, generated_date
                ) VALUES (
                    NEW.placement_id, 0.00, 0, 0, 0, 0, 0, NULL, NULL, DATETIME('now')
                );
            END;
        ");
        $pdo->exec("
            CREATE TRIGGER trg_placement_after_update AFTER UPDATE ON Placement
            BEGIN
                INSERT INTO ComplianceReport (
                    placement_id, total_hours_completed, requirement_met,
                    has_employer_eval, has_adviser_eval,
                    has_student_supervisor_eval, has_student_adviser_eval,
                    average_rating, clearance_reference, generated_date
                )
                SELECT
                    NEW.placement_id,
                    COALESCE((SELECT SUM(hours_rendered) FROM TimeLog WHERE placement_id = NEW.placement_id AND approval_status != 'flagged'), 0.00),
                    CASE
                        WHEN COALESCE((SELECT SUM(hours_rendered) FROM TimeLog WHERE placement_id = NEW.placement_id AND approval_status != 'flagged'), 0.00) >= NEW.required_hours
                             AND NEW.status != 'dropped'
                             AND (
                                 COALESCE((SELECT MAX(CASE WHEN instrument_type = 'supervisor_to_student' OR evaluator_type = 'employer' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0) = 1
                                 OR COALESCE(TRIM(NEW.signed_eval_filename), '') != ''
                                 OR COALESCE(TRIM(NEW.signed_eval_file), '') != ''
                             )
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'adviser_to_hte' OR evaluator_type = 'adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0) = 1
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_supervisor' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0) = 1
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0) = 1
                        THEN 1 ELSE 0
                    END,
                    CASE
                        WHEN COALESCE((SELECT MAX(CASE WHEN instrument_type = 'supervisor_to_student' OR evaluator_type = 'employer' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0) = 1
                             OR COALESCE(TRIM(NEW.signed_eval_filename), '') != ''
                             OR COALESCE(TRIM(NEW.signed_eval_file), '') != ''
                        THEN 1 ELSE 0
                    END,
                    COALESCE((SELECT MAX(CASE WHEN instrument_type = 'adviser_to_hte' OR evaluator_type = 'adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0),
                    COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_supervisor' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0),
                    COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0),
                    (SELECT ROUND(AVG(rating), 2) FROM Evaluation WHERE placement_id = NEW.placement_id),
                    CASE
                        WHEN COALESCE((SELECT SUM(hours_rendered) FROM TimeLog WHERE placement_id = NEW.placement_id AND approval_status != 'flagged'), 0.00) >= NEW.required_hours
                             AND NEW.status != 'dropped'
                             AND (
                                 COALESCE((SELECT MAX(CASE WHEN instrument_type = 'supervisor_to_student' OR evaluator_type = 'employer' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0) = 1
                                 OR COALESCE(TRIM(NEW.signed_eval_filename), '') != ''
                                 OR COALESCE(TRIM(NEW.signed_eval_file), '') != ''
                             )
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'adviser_to_hte' OR evaluator_type = 'adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0) = 1
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_supervisor' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0) = 1
                             AND COALESCE((SELECT MAX(CASE WHEN instrument_type = 'student_to_adviser' THEN 1 ELSE 0 END) FROM Evaluation WHERE placement_id = NEW.placement_id), 0) = 1
                        THEN printf('MIT-CPE-CLR-2026-%04d', NEW.placement_id)
                        ELSE NULL
                    END,
                    DATETIME('now')
                ON CONFLICT(placement_id) DO UPDATE SET
                    total_hours_completed = excluded.total_hours_completed,
                    requirement_met = excluded.requirement_met,
                    has_employer_eval = excluded.has_employer_eval,
                    has_adviser_eval = excluded.has_adviser_eval,
                    has_student_supervisor_eval = excluded.has_student_supervisor_eval,
                    has_student_adviser_eval = excluded.has_student_adviser_eval,
                    average_rating = excluded.average_rating,
                    clearance_reference = excluded.clearance_reference,
                    generated_date = DATETIME('now');
            END;
        ");

        // Drop & recreate views in reverse dependency order
        $pdo->exec("DROP VIEW IF EXISTS vw_adviser_monitoring");
        $pdo->exec("DROP VIEW IF EXISTS vw_employer_analytics");
        $pdo->exec("DROP VIEW IF EXISTS vw_placement_progress");

        $pdo->exec("
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
                p.signed_eval_file,
                p.signed_eval_filename,
                p.signed_eval_uploaded_at,
                p.signed_eval_notes,
                p.signed_eval_data,
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
                COALESCE(ev_agg.has_online_employer_eval, 0) AS has_online_employer_eval,
                CASE
                    WHEN COALESCE(TRIM(p.signed_eval_filename), '') != '' OR COALESCE(TRIM(p.signed_eval_file), '') != ''
                    THEN 1 ELSE 0
                END AS has_signed_eval,
                CASE
                    WHEN COALESCE(ev_agg.has_online_employer_eval, 0) = 1
                         OR COALESCE(TRIM(p.signed_eval_filename), '') != ''
                         OR COALESCE(TRIM(p.signed_eval_file), '') != ''
                    THEN 1 ELSE 0
                END AS has_employer_eval,
                COALESCE(ev_agg.has_adviser_eval, 0) AS has_adviser_eval,
                COALESCE(ev_agg.has_student_supervisor_eval, 0) AS has_student_supervisor_eval,
                COALESCE(ev_agg.has_student_adviser_eval, 0) AS has_student_adviser_eval,
                (
                    CASE
                        WHEN COALESCE(ev_agg.has_online_employer_eval, 0) = 1
                             OR COALESCE(TRIM(p.signed_eval_filename), '') != ''
                             OR COALESCE(TRIM(p.signed_eval_file), '') != ''
                        THEN 1 ELSE 0
                    END
                    + COALESCE(ev_agg.has_adviser_eval, 0)
                    + COALESCE(ev_agg.has_student_supervisor_eval, 0)
                    + COALESCE(ev_agg.has_student_adviser_eval, 0)
                ) AS completed_instruments_count,
                ev_agg.employer_rating,
                ev_agg.adviser_rating,
                ev_agg.student_supervisor_rating,
                ev_agg.student_adviser_rating,
                ev_agg.average_rating,
                CASE
                    WHEN COALESCE(tl_agg.total_hours_rendered, 0.00) >= p.required_hours
                         AND (
                             COALESCE(ev_agg.has_online_employer_eval, 0) = 1
                             OR COALESCE(TRIM(p.signed_eval_filename), '') != ''
                             OR COALESCE(TRIM(p.signed_eval_file), '') != ''
                         )
                         AND COALESCE(ev_agg.has_adviser_eval, 0) = 1
                         AND COALESCE(ev_agg.has_student_supervisor_eval, 0) = 1
                         AND COALESCE(ev_agg.has_student_adviser_eval, 0) = 1
                         AND p.status != 'dropped'
                    THEN 1
                    ELSE 0
                END AS requirement_met,
                cr.report_id,
                cr.clearance_reference,
                cr.generated_date AS report_generated_date
            FROM Placement p
            INNER JOIN Student s ON p.student_id = s.student_id
            INNER JOIN Employer e ON p.employer_id = e.employer_id
            INNER JOIN Adviser a ON p.adviser_id = a.adviser_id
            LEFT JOIN (
                SELECT
                    placement_id,
                    SUM(CASE WHEN approval_status != 'flagged' THEN hours_rendered ELSE 0 END) AS total_hours_rendered,
                    COUNT(log_id) AS log_count,
                    MAX(date) AS last_logged_date
                FROM TimeLog
                GROUP BY placement_id
            ) tl_agg ON p.placement_id = tl_agg.placement_id
            LEFT JOIN (
                SELECT
                    placement_id,
                    COUNT(eval_id) AS eval_count,
                    MAX(CASE WHEN instrument_type = 'supervisor_to_student' OR evaluator_type = 'employer' THEN 1 ELSE 0 END) AS has_online_employer_eval,
                    MAX(CASE WHEN instrument_type = 'adviser_to_hte' OR evaluator_type = 'adviser' THEN 1 ELSE 0 END) AS has_adviser_eval,
                    MAX(CASE WHEN instrument_type = 'student_to_supervisor' THEN 1 ELSE 0 END) AS has_student_supervisor_eval,
                    MAX(CASE WHEN instrument_type = 'student_to_adviser' THEN 1 ELSE 0 END) AS has_student_adviser_eval,
                    MAX(CASE WHEN instrument_type = 'supervisor_to_student' OR evaluator_type = 'employer' THEN rating ELSE NULL END) AS employer_rating,
                    MAX(CASE WHEN instrument_type = 'adviser_to_hte' OR evaluator_type = 'adviser' THEN rating ELSE NULL END) AS adviser_rating,
                    MAX(CASE WHEN instrument_type = 'student_to_supervisor' THEN rating ELSE NULL END) AS student_supervisor_rating,
                    MAX(CASE WHEN instrument_type = 'student_to_adviser' THEN rating ELSE NULL END) AS student_adviser_rating,
                    ROUND(AVG(rating), 2) AS average_rating
                FROM Evaluation
                GROUP BY placement_id
            ) ev_agg ON p.placement_id = ev_agg.placement_id
            LEFT JOIN ComplianceReport cr ON p.placement_id = cr.placement_id
        ");

        $pdo->exec("
            CREATE VIEW vw_employer_analytics AS
            SELECT
                e.employer_id,
                e.company_name,
                e.address,
                e.industry,
                e.contact_person,
                e.contact_number,
                e.email,
                e.moa_status,
                e.moa_validity,
                COUNT(p.placement_id) AS total_placements,
                SUM(CASE WHEN p.status = 'ongoing' THEN 1 ELSE 0 END) AS active_interns,
                SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) AS completed_interns,
                COALESCE(SUM(vp.total_hours_completed), 0.00) AS total_hours_hosted,
                ROUND(AVG(vp.average_rating), 2) AS avg_intern_rating
            FROM Employer e
            LEFT JOIN Placement p ON e.employer_id = p.employer_id
            LEFT JOIN vw_placement_progress vp ON p.placement_id = vp.placement_id
            GROUP BY e.employer_id
        ");

        $pdo->exec("
            CREATE VIEW vw_adviser_monitoring AS
            SELECT
                a.adviser_id,
                a.employee_number,
                a.full_name,
                a.department,
                a.email,
                a.contact_number,
                COUNT(vp.placement_id) AS total_supervised,
                SUM(CASE WHEN vp.status = 'ongoing' THEN 1 ELSE 0 END) AS ongoing_count,
                SUM(CASE WHEN vp.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
                SUM(CASE WHEN vp.requirement_met = 1 THEN 1 ELSE 0 END) AS clearance_ready_count,
                SUM(CASE WHEN vp.has_adviser_eval = 0 AND vp.status != 'dropped' THEN 1 ELSE 0 END) AS pending_adviser_evals,
                ROUND(AVG(vp.completion_percentage), 1) AS avg_student_progress
            FROM Adviser a
            LEFT JOIN vw_placement_progress vp ON a.adviser_id = vp.adviser_id
            GROUP BY a.adviser_id
        ");
    } else {
        // MySQL migration parity
        $pCols = array_column($pdo->query("SHOW COLUMNS FROM Placement")->fetchAll(PDO::FETCH_ASSOC), 'Field');
        $mysqlPlacementCols = [
            'signed_eval_file'        => 'VARCHAR(500) NULL',
            'signed_eval_filename'    => 'VARCHAR(255) NULL',
            'signed_eval_uploaded_at' => 'DATETIME NULL',
            'signed_eval_notes'       => 'TEXT NULL',
            'signed_eval_data'        => 'MEDIUMTEXT NULL',
        ];
        foreach ($mysqlPlacementCols as $col => $def) {
            if (!in_array($col, $pCols, true)) {
                $pdo->exec("ALTER TABLE Placement ADD COLUMN {$col} {$def}");
            }
        }
        $pdo->exec("ALTER TABLE Evaluation MODIFY COLUMN evaluator_type ENUM('employer', 'adviser', 'student') NOT NULL");
        $cCols = array_column($pdo->query("SHOW COLUMNS FROM ComplianceReport")->fetchAll(PDO::FETCH_ASSOC), 'Field');
        if (!in_array('has_student_supervisor_eval', $cCols, true)) {
            $pdo->exec("ALTER TABLE ComplianceReport ADD COLUMN has_student_supervisor_eval TINYINT(1) NOT NULL DEFAULT 0");
        }
        if (!in_array('has_student_adviser_eval', $cCols, true)) {
            $pdo->exec("ALTER TABLE ComplianceReport ADD COLUMN has_student_adviser_eval TINYINT(1) NOT NULL DEFAULT 0");
        }
    }

    Database::syncAllCompliance($pdo);
    echo "Synchronized all ComplianceReport and Placement records.\n";
} catch (Throwable $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
    exit(1);
}
