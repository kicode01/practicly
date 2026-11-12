-- =============================================================================
-- POLYTECHNIC UNIVERSITY OF THE PHILIPPINES
-- College of Engineering — Computer Engineering Department (Sta. Mesa, Manila)
--
-- SYSTEM: Internship / OJT Tracking and Employer Database System
-- COURSE: Database Management System (Software Development / Computer Engineering)
-- GROUP 8:
--   - Balanag, Kian H. (Frontend Developer)
--   - Calangian, Emmanuel G. (Backend Developer)
--   - Gutierrez, Sophia Margarete N. (Documentation Lead)
--   - Yadao, Adrian E. (Backend Developer)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS ojt_tracking_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ojt_tracking_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS vw_placement_progress;
DROP VIEW IF EXISTS vw_employer_analytics;
DROP VIEW IF EXISTS vw_adviser_monitoring;

DROP TRIGGER IF EXISTS trg_timelog_after_insert;
DROP TRIGGER IF EXISTS trg_timelog_after_update;
DROP TRIGGER IF EXISTS trg_timelog_after_delete;
DROP TRIGGER IF EXISTS trg_evaluation_after_insert;
DROP TRIGGER IF EXISTS trg_evaluation_after_update;
DROP TRIGGER IF EXISTS trg_evaluation_after_delete;

DROP PROCEDURE IF EXISTS sp_sync_placement_compliance;
DROP PROCEDURE IF EXISTS sp_sync_all_compliance_reports;

DROP TABLE IF EXISTS ComplianceReport;
DROP TABLE IF EXISTS Evaluation;
DROP TABLE IF EXISTS TimeLog;
DROP TABLE IF EXISTS Placement;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Adviser;
DROP TABLE IF EXISTS Employer;
DROP TABLE IF EXISTS Student;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. STUDENT TABLE (Master Stakeholder Entity)
-- =============================================================================
CREATE TABLE Student (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    student_number VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    program VARCHAR(100) NOT NULL DEFAULT 'BS Computer Engineering',
    year_level VARCHAR(20) NOT NULL DEFAULT '4th Year',
    section VARCHAR(30) NOT NULL DEFAULT 'BSCpE 4-1',
    email VARCHAR(120) NOT NULL UNIQUE,
    contact_number VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_program_section (program, section),
    INDEX idx_student_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. EMPLOYER / HTE TABLE (Host Training Establishment Master Entity)
-- =============================================================================
CREATE TABLE Employer (
    employer_id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    contact_person VARCHAR(120) NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    email VARCHAR(120) NOT NULL,
    moa_status ENUM('active', 'pending_renewal', 'expired') NOT NULL DEFAULT 'active',
    moa_validity DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_employer_industry (industry),
    INDEX idx_employer_moa (moa_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. ADVISER / COORDINATOR TABLE (Faculty Supervisor Master Entity)
-- =============================================================================
CREATE TABLE Adviser (
    adviser_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_number VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    department VARCHAR(120) NOT NULL DEFAULT 'Computer Engineering Department',
    email VARCHAR(120) NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_adviser_dept (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. USERS TABLE (Authentication & Role-Based Access Control)
-- =============================================================================
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'adviser', 'admin') NOT NULL,
    linked_id INT NULL COMMENT 'Polymorphic FK: refers to Student.student_id or Adviser.adviser_id based on role',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_role_linked (role, linked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. PLACEMENT TABLE (Core 3-Way Junction Entity: Student + Employer + Adviser)
-- =============================================================================
CREATE TABLE Placement (
    placement_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    employer_id INT NOT NULL,
    adviser_id INT NOT NULL,
    academic_term VARCHAR(50) NOT NULL DEFAULT 'AY 2026-2027 1st Sem',
    position_title VARCHAR(100) NOT NULL DEFAULT 'Computer Engineering Intern',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    required_hours DECIMAL(6,2) NOT NULL DEFAULT 300.00,
    status ENUM('ongoing', 'completed', 'dropped') NOT NULL DEFAULT 'ongoing',
    signed_dtr_file VARCHAR(255) NULL,
    signed_dtr_filename VARCHAR(255) NULL,
    signed_dtr_uploaded_at DATETIME NULL,
    signed_dtr_notes TEXT NULL,
    signed_dtr_data LONGTEXT NULL,
    signed_eval_file VARCHAR(255) NULL,
    signed_eval_filename VARCHAR(255) NULL,
    signed_eval_uploaded_at DATETIME NULL,
    signed_eval_notes TEXT NULL,
    signed_eval_data LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_placement_student
        FOREIGN KEY (student_id) REFERENCES Student(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_placement_employer
        FOREIGN KEY (employer_id) REFERENCES Employer(employer_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_placement_adviser
        FOREIGN KEY (adviser_id) REFERENCES Adviser(adviser_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_placement_student (student_id),
    INDEX idx_placement_employer (employer_id),
    INDEX idx_placement_adviser (adviser_id),
    INDEX idx_placement_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. TIMELOG TABLE (Dependent Transaction Entity for Attendance Aggregation)
-- =============================================================================
CREATE TABLE TimeLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    placement_id INT NOT NULL,
    date DATE NOT NULL,
    time_in TIME NOT NULL,
    time_out TIME NOT NULL,
    break_minutes INT NOT NULL DEFAULT 60,
    hours_rendered DECIMAL(5,2) NOT NULL,
    task_description TEXT NOT NULL,
    approval_status ENUM('approved', 'pending', 'flagged') NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_timelog_placement
        FOREIGN KEY (placement_id) REFERENCES Placement(placement_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uq_placement_log_date (placement_id, date),
    INDEX idx_timelog_placement_date (placement_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. EVALUATION TABLE (Dependent Transaction Entity for Performance Ratings)
-- =============================================================================
CREATE TABLE Evaluation (
    eval_id INT AUTO_INCREMENT PRIMARY KEY,
    placement_id INT NOT NULL,
    instrument_type VARCHAR(40) NOT NULL DEFAULT 'supervisor_to_student',
    evaluator_type ENUM('employer', 'adviser', 'student') NOT NULL,
    evaluator_name VARCHAR(120) NOT NULL,
    technical_score DECIMAL(4,2) NOT NULL DEFAULT 4.50 COMMENT 'Scale 1.00 to 5.00',
    attitude_score DECIMAL(4,2) NOT NULL DEFAULT 4.50 COMMENT 'Scale 1.00 to 5.00',
    attendance_score DECIMAL(4,2) NOT NULL DEFAULT 4.50 COMMENT 'Scale 1.00 to 5.00',
    rating DECIMAL(4,2) NOT NULL COMMENT 'Overall Composite Rating (1.00 to 5.00)',
    comments TEXT NOT NULL,
    date_evaluated DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evaluation_placement
        FOREIGN KEY (placement_id) REFERENCES Placement(placement_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_evaluation_placement_type (placement_id, evaluator_type),
    INDEX idx_evaluation_instrument (placement_id, instrument_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. COMPLIANCEREPORT TABLE (Aggregated Clearance & Eligibility Record)
-- =============================================================================
CREATE TABLE ComplianceReport (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    placement_id INT NOT NULL UNIQUE,
    total_hours_completed DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    requirement_met TINYINT(1) NOT NULL DEFAULT 0,
    has_employer_eval TINYINT(1) NOT NULL DEFAULT 0,
    has_adviser_eval TINYINT(1) NOT NULL DEFAULT 0,
    has_student_supervisor_eval TINYINT(1) NOT NULL DEFAULT 0,
    has_student_adviser_eval TINYINT(1) NOT NULL DEFAULT 0,
    average_rating DECIMAL(4,2) NULL,
    clearance_reference VARCHAR(50) NULL,
    generated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_compliance_placement
        FOREIGN KEY (placement_id) REFERENCES Placement(placement_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_compliance_eligible (requirement_met)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- STORED PROCEDURES & TRIGGERS FOR AUTOMATIC AGGREGATION AND ELIGIBILITY SYNC
-- =============================================================================
DELIMITER $$

CREATE PROCEDURE sp_sync_placement_compliance(IN p_placement_id INT)
BEGIN
    DECLARE v_total_hours DECIMAL(6,2) DEFAULT 0.00;
    DECLARE v_required_hours DECIMAL(6,2) DEFAULT 300.00;
    DECLARE v_current_status VARCHAR(20) DEFAULT 'ongoing';
    DECLARE v_eval_count INT DEFAULT 0;
    DECLARE v_emp_eval INT DEFAULT 0;
    DECLARE v_adv_eval INT DEFAULT 0;
    DECLARE v_stu_sup_eval INT DEFAULT 0;
    DECLARE v_stu_adv_eval INT DEFAULT 0;
    DECLARE v_has_signed_eval INT DEFAULT 0;
    DECLARE v_avg_rating DECIMAL(4,2) DEFAULT NULL;
    DECLARE v_req_met TINYINT(1) DEFAULT 0;
    DECLARE v_clearance_ref VARCHAR(50) DEFAULT NULL;

    -- 1. Get placement required hours, status, and signed INST-02 scan state
    SELECT required_hours,
           status,
           CASE
               WHEN COALESCE(TRIM(signed_eval_filename), '') != '' OR COALESCE(TRIM(signed_eval_file), '') != ''
               THEN 1 ELSE 0
           END
      INTO v_required_hours, v_current_status, v_has_signed_eval
      FROM Placement
     WHERE placement_id = p_placement_id;

    -- 2. Aggregate SUM(hours_rendered) from TimeLog grouped by placement_id
    SELECT COALESCE(SUM(hours_rendered), 0.00)
      INTO v_total_hours
      FROM TimeLog
     WHERE placement_id = p_placement_id
       AND approval_status != 'flagged';

    -- 3. Aggregate 4-Instrument Evaluation metrics for this placement
    SELECT COUNT(*),
           MAX(CASE WHEN instrument_type = 'supervisor_to_student' OR evaluator_type = 'employer' THEN 1 ELSE 0 END),
           MAX(CASE WHEN instrument_type = 'adviser_to_hte' OR evaluator_type = 'adviser' THEN 1 ELSE 0 END),
           MAX(CASE WHEN instrument_type = 'student_to_supervisor' THEN 1 ELSE 0 END),
           MAX(CASE WHEN instrument_type = 'student_to_adviser' THEN 1 ELSE 0 END),
           ROUND(AVG(rating), 2)
      INTO v_eval_count, v_emp_eval, v_adv_eval, v_stu_sup_eval, v_stu_adv_eval, v_avg_rating
      FROM Evaluation
     WHERE placement_id = p_placement_id;

    SET v_emp_eval = CASE WHEN COALESCE(v_emp_eval, 0) = 1 OR COALESCE(v_has_signed_eval, 0) = 1 THEN 1 ELSE 0 END;
    SET v_adv_eval = COALESCE(v_adv_eval, 0);
    SET v_stu_sup_eval = COALESCE(v_stu_sup_eval, 0);
    SET v_stu_adv_eval = COALESCE(v_stu_adv_eval, 0);

    -- 4. 4-Instrument Eligibility Logic:
    --    total_hours_completed >= required_hours AND all 4 instruments satisfied -> eligible
    IF v_total_hours >= v_required_hours
       AND v_emp_eval = 1
       AND v_adv_eval = 1
       AND v_stu_sup_eval = 1
       AND v_stu_adv_eval = 1
       AND v_current_status != 'dropped'
    THEN
        SET v_req_met = 1;
        SET v_clearance_ref = CONCAT('MIT-CPE-CLR-2026-', LPAD(p_placement_id, 4, '0'));
    ELSE
        SET v_req_met = 0;
        SET v_clearance_ref = NULL;
    END IF;

    -- 5. Upsert ComplianceReport record
    INSERT INTO ComplianceReport (
        placement_id,
        total_hours_completed,
        requirement_met,
        has_employer_eval,
        has_adviser_eval,
        has_student_supervisor_eval,
        has_student_adviser_eval,
        average_rating,
        clearance_reference,
        generated_date
    ) VALUES (
        p_placement_id,
        v_total_hours,
        v_req_met,
        v_emp_eval,
        v_adv_eval,
        v_stu_sup_eval,
        v_stu_adv_eval,
        v_avg_rating,
        v_clearance_ref,
        NOW()
    )
    ON DUPLICATE KEY UPDATE
        total_hours_completed = VALUES(total_hours_completed),
        requirement_met = VALUES(requirement_met),
        has_employer_eval = VALUES(has_employer_eval),
        has_adviser_eval = VALUES(has_adviser_eval),
        has_student_supervisor_eval = VALUES(has_student_supervisor_eval),
        has_student_adviser_eval = VALUES(has_student_adviser_eval),
        average_rating = VALUES(average_rating),
        clearance_reference = VALUES(clearance_reference),
        generated_date = NOW();

    -- 6. Automatically transition Placement status if not dropped
    IF v_current_status != 'dropped' THEN
        IF v_req_met = 1 THEN
            UPDATE Placement SET status = 'completed' WHERE placement_id = p_placement_id;
        ELSE
            UPDATE Placement SET status = 'ongoing' WHERE placement_id = p_placement_id;
        END IF;
    END IF;
END$$

CREATE PROCEDURE sp_sync_all_compliance_reports()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_pid INT;
    DECLARE cur CURSOR FOR SELECT placement_id FROM Placement;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_pid;
        IF done THEN
            LEAVE read_loop;
        END IF;
        CALL sp_sync_placement_compliance(v_pid);
    END LOOP;
    CLOSE cur;
END$$

-- Triggers on TimeLog
CREATE TRIGGER trg_timelog_after_insert
AFTER INSERT ON TimeLog
FOR EACH ROW
BEGIN
    CALL sp_sync_placement_compliance(NEW.placement_id);
END$$

CREATE TRIGGER trg_timelog_after_update
AFTER UPDATE ON TimeLog
FOR EACH ROW
BEGIN
    CALL sp_sync_placement_compliance(NEW.placement_id);
END$$

CREATE TRIGGER trg_timelog_after_delete
AFTER DELETE ON TimeLog
FOR EACH ROW
BEGIN
    CALL sp_sync_placement_compliance(OLD.placement_id);
END$$

-- Triggers on Evaluation
CREATE TRIGGER trg_evaluation_after_insert
AFTER INSERT ON Evaluation
FOR EACH ROW
BEGIN
    CALL sp_sync_placement_compliance(NEW.placement_id);
END$$

CREATE TRIGGER trg_evaluation_after_update
AFTER UPDATE ON Evaluation
FOR EACH ROW
BEGIN
    CALL sp_sync_placement_compliance(NEW.placement_id);
END$$

CREATE TRIGGER trg_evaluation_after_delete
AFTER DELETE ON Evaluation
FOR EACH ROW
BEGIN
    CALL sp_sync_placement_compliance(OLD.placement_id);
END$$

DELIMITER ;

-- =============================================================================
-- ANALYTICAL & MONITORING VIEWS (Multi-Table Joins + Aggregations)
-- =============================================================================

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
    COALESCE(tl_agg.total_hours_rendered, 0.00) AS total_hours_completed,
    GREATEST(p.required_hours - COALESCE(tl_agg.total_hours_rendered, 0.00), 0.00) AS hours_remaining,
    ROUND(LEAST((COALESCE(tl_agg.total_hours_rendered, 0.00) / NULLIF(p.required_hours, 0)) * 100, 100.0), 1) AS completion_percentage,
    COALESCE(tl_agg.log_count, 0) AS total_log_days,
    tl_agg.last_logged_date,
    COALESCE(ev_agg.eval_count, 0) AS evaluation_count,
    CASE
        WHEN COALESCE(ev_agg.has_employer_eval, 0) = 1
             OR COALESCE(TRIM(p.signed_eval_filename), '') != ''
             OR COALESCE(TRIM(p.signed_eval_file), '') != ''
        THEN 1 ELSE 0
    END AS has_employer_eval,
    COALESCE(ev_agg.has_adviser_eval, 0) AS has_adviser_eval,
    COALESCE(ev_agg.has_student_supervisor_eval, 0) AS has_student_supervisor_eval,
    COALESCE(ev_agg.has_student_adviser_eval, 0) AS has_student_adviser_eval,
    ev_agg.employer_rating,
    ev_agg.adviser_rating,
    ev_agg.student_supervisor_rating,
    ev_agg.student_adviser_rating,
    ev_agg.average_rating,
    CASE
        WHEN COALESCE(tl_agg.total_hours_rendered, 0.00) >= p.required_hours
             AND (
                 COALESCE(ev_agg.has_employer_eval, 0) = 1
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
        MAX(CASE WHEN instrument_type = 'supervisor_to_student' OR evaluator_type = 'employer' THEN 1 ELSE 0 END) AS has_employer_eval,
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
LEFT JOIN ComplianceReport cr ON p.placement_id = cr.placement_id;

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
GROUP BY e.employer_id;

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
GROUP BY a.adviser_id;

-- =============================================================================
-- SEED DATA (Comprehensive MIT Computer Engineering Cohort — 26 Students,
-- 14 Partner HTEs, 6 Faculty Advisers, 24 Placements, 195+ TimeLogs, 33 Evaluations)
-- All demo accounts use password: password123
-- =============================================================================

-- 1. Seed 26 BS Computer Engineering Students (BSCpE 4-1 to 4-4)
INSERT INTO Student (student_id, student_number, full_name, program, year_level, section, email, contact_number) VALUES
(1,  '2023-00108-MN-0', 'Balanag, Kian H.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-1', 'kian.balanag@student.mit.edu.ph', '0917-542-8810'),
(2,  '2023-00115-MN-0', 'Calangian, Emmanuel G.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-1', 'emmanuel.calangian@student.mit.edu.ph', '0917-619-3402'),
(3,  '2023-00129-MN-0', 'Gutierrez, Sophia Margarete N.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-1', 'sophia.gutierrez@student.mit.edu.ph', '0918-430-9125'),
(4,  '2023-00142-MN-0', 'Yadao, Adrian E.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-1', 'adrian.yadao@student.mit.edu.ph', '0917-893-2241'),
(5,  '2023-00164-MN-0', 'Delos Santos, Miguel R.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-2', 'miguel.delossantos@student.mit.edu.ph', '0919-204-5518'),
(6,  '2023-00188-MN-0', 'Villanueva, Clarisse Anne T.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-1', 'clarisse.villanueva@student.mit.edu.ph', '0917-339-7012'),
(7,  '2023-00203-MN-0', 'Reyes, Jomel Christian P.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-2', 'jomel.reyes@student.mit.edu.ph', '0920-715-6639'),
(8,  '2023-00219-MN-0', 'Mendoza, Patricia Mae L.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-2', 'patricia.mendoza@student.mit.edu.ph', '0917-904-1183'),
(9,  '2023-00231-MN-0', 'Alcantara, Justine Mark D.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-1', 'justine.alcantara@student.mit.edu.ph', '0917-412-3094'),
(10, '2023-00245-MN-0', 'Pascual, Bea Katrina S.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-1', 'bea.pascual@student.mit.edu.ph', '0918-650-2219'),
(11, '2023-00259-MN-0', 'Soriano, Raphael Vince C.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-2', 'raphael.soriano@student.mit.edu.ph', '0917-771-9045'),
(12, '2023-00274-MN-0', 'Evangelista, Hannah Camille B.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-2', 'hannah.evangelista@student.mit.edu.ph', '0919-832-1170'),
(13, '2023-00288-MN-0', 'Bautista, John Paul V.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-3', 'johnpaul.bautista@student.mit.edu.ph', '0920-418-6651'),
(14, '2023-00302-MN-0', 'Castillo, Angelica Joy M.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-3', 'angelica.castillo@student.mit.edu.ph', '0917-529-8340'),
(15, '2023-00317-MN-0', 'De Guzman, Karl Patrick L.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-3', 'karl.deguzman@student.mit.edu.ph', '0918-304-7721'),
(16, '2023-00334-MN-0', 'Aquino, Danielle Faith R.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-3', 'danielle.aquino@student.mit.edu.ph', '0917-690-4418'),
(17, '2023-00349-MN-0', 'Navarro, Christian Dave P.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-3', 'christian.navarro@student.mit.edu.ph', '0919-511-2903'),
(18, '2023-00361-MN-0', 'Ocampo, Trisha Nicole G.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-4', 'trisha.ocampo@student.mit.edu.ph', '0917-845-6192'),
(19, '2023-00378-MN-0', 'Salazar, Kenneth Ian T.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-4', 'kenneth.salazar@student.mit.edu.ph', '0921-334-8091'),
(20, '2023-00392-MN-0', 'Mercado, Alyssa Marie F.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-4', 'alyssa.mercado@student.mit.edu.ph', '0917-209-5487'),
(21, '2023-00405-MN-0', 'Pangilinan, Francis Leo D.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-4', 'francis.pangilinan@student.mit.edu.ph', '0918-762-3314'),
(22, '2023-00419-MN-0', 'Lim, Samantha Denise Y.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-4', 'samantha.lim@student.mit.edu.ph', '0917-938-1205'),
(23, '2023-00433-MN-0', 'Valdez,Jerome Andrei S.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-2', 'jerome.valdez@student.mit.edu.ph', '0919-641-7082'),
(24, '2023-00448-MN-0', 'Robles, Katrina Isabel C.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-1', 'katrina.robles@student.mit.edu.ph', '0917-480-9931'),
(25, '2023-00462-MN-0', 'Dimaculangan, Sean Paolo M.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-3', 'sean.dimaculangan@student.mit.edu.ph', '0918-219-4507'),
(26, '2023-00479-MN-0', 'galang, Rina Therese E.', 'BS Computer Engineering', '4th Year', 'BSCpE 4-4', 'rina.galang@student.mit.edu.ph', '0917-315-6824');

UPDATE Student SET full_name = 'Valdez, Jerome Andrei S.' WHERE student_id = 23;
UPDATE Student SET full_name = 'Galang, Rina Therese E.' WHERE student_id = 26;

-- 2. Seed 14 Accredited Partner Companies / HTEs
INSERT INTO Employer (employer_id, company_name, address, industry, contact_person, contact_number, email, moa_status, moa_validity) VALUES
(1,  'Accenture Inc. (Philippines)', 'Uptown Bonifacio Tower 2, 11th Ave, BGC, Taguig City', 'Cloud & Enterprise Software Engineering', 'Engr. Paolo M. Sarmiento', '(02) 8841-0111', 'campus.ojt.ph@accenture.com', 'active', '2028-06-30'),
(2,  'Analog Devices Philippines, Inc.', 'Gateway Business Park, Javalera, General Trias, Cavite', 'Semiconductor & Embedded Systems', 'Engr. Teresa L. Valenzuela', '(046) 433-8200', 'university.relations@analog.com', 'active', '2027-12-31'),
(3,  'Globe Telecom, Inc.', 'The Globe Tower, 32nd Street cor. 7th Ave, BGC, Taguig City', 'Telecommunications & Network Infrastructure', 'Ms. Bianca R. Montemayor', '(02) 7730-2000', 'internship.engineering@globe.com.ph', 'active', '2028-03-15'),
(4,  'Pointwest Innovations Corporation', 'Building G, UP-Ayala Land TechnoHub, Commonwealth Ave, Quezon City', 'Digital Engineering & Data Analytics', 'Mr. Carlo J. Pangilinan', '(02) 8277-4100', 'talent.acquisition@pointwest.com.ph', 'active', '2027-08-31'),
(5,  'Azeus Systems Philippines Limited', '28/F The Orient Square, F. Ortigas Jr. Road, Ortigas Center, Pasig City', 'Enterprise Systems & GovTech', 'Ms. Hannah G. Soriano', '(02) 8687-7362', 'ojt.recruitment@azeus.com', 'active', '2027-05-15'),
(6,  'Samsung R&D Institute Philippines', 'McKinley West Campus, Lawton Ave, Fort Bonifacio, Taguig City', 'Firmware & Mobile Systems R&D', 'Dr. Kenneth Y. Lim', '(02) 8804-5500', 'srip.academic@samsung.com', 'pending_renewal', '2026-12-15'),
(7,  'Texas Instruments (Philippines), Inc.', ' Clark Freeport Zone, Pampanga / Baguio Export Processing Zone', 'Semiconductor & Embedded Systems', 'Engr. Roberto V. Salazar', '(045) 499-5600', 'ph.university.program@ti.com', 'active', '2028-09-30'),
(8,  'Maya Philippines, Inc. (PayMaya)', '6/F Launchpad Building, Sheridan cor. Reliance St, Mandaluyong City', 'FinTech & Distributed Payment Systems', 'Engr. Camille D. Ilagan', '(02) 8845-7788', 'earlycareers.tech@maya.ph', 'active', '2028-04-30'),
(9,  'Smart Communications / PLDT Enterprise', 'Ramon Cojuangco Building, Makati Ave, Makati City', 'Telecommunications & Network Infrastructure', 'Engr. Dennis A. Villareal', '(02) 8816-8000', 'network.acad@smart.com.ph', 'active', '2027-11-30'),
(10, 'Rohm Electronics Philippines, Inc.', 'People''s Technology Complex, Carmona, Cavite', 'LSI Design & Semiconductor Engineering', 'Engr. Hideki K. Taniguchi', '(046) 430-2011', 'rep.internship@rohm.com.ph', 'active', '2028-01-31'),
(11, 'Yondu, Inc.', 'Panorama Tower, 34th St cor. Lane A, BGC, Taguig City', 'Cloud & Enterprise Software Engineering', 'Ms. Katrina S. Policarpio', '(02) 7917-3300', 'campus.talents@yondu.com', 'active', '2027-10-15'),
(12, 'Trend Micro Philippines', '8/F Tower 2, The Rockwell Business Center, Ortigas Ave, Pasig City', 'Cybersecurity & Threat Defense R&D', 'Engr. Victor M. Manansala', '(02) 7995-6200', 'ph_university@trendmicro.com', 'active', '2028-07-31'),
(13, 'Tsukiden Global Solutions, Inc.', '21/F Discovery Centre, 25 ADB Ave, Ortigas Center, Pasig City', 'Embedded Automotive & Industrial Firmware', 'Engr. Ronald P. Magbanua', '(02) 8635-5120', 'hr.ojt@tgsi.com.ph', 'pending_renewal', '2026-11-30'),
(14, 'Syntellect Legacy Systems Corp.', ' Rada Street, Legazpi Village, Makati City', 'IT Infrastructure & Legacy Maintenance', 'Mr. Gregory T. Chua', '(02) 8812-0944', 'hr@syntellect.ph', 'expired', '2026-06-30');

-- 3. Seed 6 Faculty OJT Advisers / Coordinators
INSERT INTO Adviser (adviser_id, employee_number, full_name, department, email, contact_number) VALUES
(1, 'MIT-COE-0041', 'Engr. Arlene R. Dela Cruz, MSc', 'Computer Engineering Department', 'ardelacruz@mit.edu.ph', '0917-801-4410'),
(2, 'MIT-COE-0058', 'Engr. Marco Antonio V. Santos, PCpE', 'Computer Engineering Department', 'mavsantos@mit.edu.ph', '0917-802-5591'),
(3, 'MIT-COE-0024', 'Dr. Evelyn S. Bautista, PECE', 'Computer Engineering Department', 'esbautista@mit.edu.ph', '0918-803-7720'),
(4, 'MIT-COE-0063', 'Engr. Ramon C. Tolentino, MEng', 'Computer Engineering Department', 'rctolentino@mit.edu.ph', '0917-804-6128'),
(5, 'MIT-COE-0035', 'Dr. Lorna M. Macapagal, PCpE', 'Computer Engineering Department', 'lmmacapagal@mit.edu.ph', '0919-805-3394'),
(6, 'MIT-COE-0072', 'Engr. Christian Paul D. Vergara, MSc', 'Computer Engineering Department', 'cpdvergara@mit.edu.ph', '0917-806-9201');

-- 4. Seed 33 Users (Password for all demo accounts: password123)
INSERT INTO Users (user_id, username, password_hash, role, linked_id, is_active, last_login) VALUES
(1,  'admin',                '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'admin',   NULL, 1, '2026-11-07 08:30:00'),
(2,  'engr.delacruz',        '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'adviser', 1,    1, '2026-11-07 09:15:00'),
(3,  'engr.santos',          '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'adviser', 2,    1, '2026-11-06 14:20:00'),
(4,  'dr.bautista',          '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'adviser', 3,    1, '2026-11-06 16:45:00'),
(5,  'kian.balanag',         '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 1,    1, '2026-11-07 08:05:00'),
(6,  'emmanuel.calangian',   '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 2,    1, '2026-11-07 08:10:00'),
(7,  'sophia.gutierrez',     '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 3,    1, '2026-11-07 09:00:00'),
(8,  'adrian.yadao',         '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 4,    1, '2026-11-07 07:45:00'),
(9,  'miguel.delossantos',   '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 5,    1, '2026-11-05 18:30:00'),
(10, 'clarisse.villanueva',  '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 6,    1, '2026-11-05 17:15:00'),
(11, 'jomel.reyes',          '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 7,    1, '2026-11-06 16:00:00'),
(12, 'patricia.mendoza',     '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 8,    0, '2026-10-15 10:00:00'),
(13, 'engr.tolentino',       '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'adviser', 4,    1, '2026-11-06 11:20:00'),
(14, 'dr.macapagal',         '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'adviser', 5,    1, '2026-11-06 15:10:00'),
(15, 'engr.vergara',         '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'adviser', 6,    1, '2026-11-07 08:50:00'),
(16, 'justine.alcantara',    '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 9,    1, '2026-11-06 17:30:00'),
(17, 'bea.pascual',          '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 10,   1, '2026-11-06 18:05:00'),
(18, 'raphael.soriano',      '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 11,   1, '2026-11-06 16:40:00'),
(19, 'hannah.evangelista',   '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 12,   1, '2026-11-06 19:12:00'),
(20, 'johnpaul.bautista',    '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 13,   1, '2026-11-06 14:55:00'),
(21, 'angelica.castillo',    '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 14,   1, '2026-11-06 17:20:00'),
(22, 'karl.deguzman',        '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 15,   1, '2026-11-05 20:10:00'),
(23, 'danielle.aquino',      '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 16,   1, '2026-11-06 18:45:00'),
(24, 'christian.navarro',    '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 17,   1, '2026-11-06 15:30:00'),
(25, 'trisha.ocampo',        '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 18,   1, '2026-11-06 17:50:00'),
(26, 'kenneth.salazar',      '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 19,   1, '2026-11-06 16:15:00'),
(27, 'alyssa.mercado',       '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 20,   1, '2026-11-06 18:22:00'),
(28, 'francis.pangilinan',   '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 21,   1, '2026-11-05 17:40:00'),
(29, 'samantha.lim',         '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 22,   1, '2026-11-06 19:05:00'),
(30, 'jerome.valdez',        '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 23,   0, '2026-09-28 09:30:00'),
(31, 'katrina.robles',       '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 24,   1, '2026-11-07 08:15:00'),
(32, 'sean.dimaculangan',    '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 25,   1, '2026-11-07 08:40:00'),
(33, 'rina.galang',          '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO', 'student', 26,   1, '2026-11-07 09:05:00');

-- 5. Seed 24 Placements (Students 1-24 have placements; Students 25 & 26 are Unassigned for live testing)
INSERT INTO Placement (placement_id, student_id, employer_id, adviser_id, academic_term, position_title, start_date, end_date, required_hours, status) VALUES
(1,  1,  1,  1, 'AY 2026-2027 1st Sem', 'Frontend & UI Systems Engineering Intern',         '2026-08-03', '2026-10-30', 300.00, 'completed'),
(2,  2,  4,  1, 'AY 2026-2027 1st Sem', 'Backend & Database Architecture Intern',           '2026-08-03', '2026-10-30', 300.00, 'completed'),
(3,  3,  5,  1, 'AY 2026-2027 1st Sem', 'Systems Quality & Documentation Analyst Intern',   '2026-08-10', '2026-11-15', 300.00, 'ongoing'),
(4,  4,  2,  2, 'AY 2026-2027 1st Sem', 'Embedded Firmware & API Systems Intern',           '2026-08-03', '2026-11-05', 300.00, 'ongoing'),
(5,  5,  3,  2, 'AY 2026-2027 1st Sem', 'Network Operations & Telemetry Intern',            '2026-09-01', '2026-11-30', 300.00, 'ongoing'),
(6,  6,  6,  3, 'AY 2026-2027 1st Sem', 'System-on-Chip Verification Intern',               '2026-08-03', '2026-10-28', 300.00, 'completed'),
(7,  7,  1,  3, 'AY 2026-2027 1st Sem', 'Cloud DevOps & Automation Intern',                 '2026-09-14', '2026-12-11', 300.00, 'ongoing'),
(8,  8,  3,  2, 'AY 2026-2027 1st Sem', 'IT Infrastructure Support Intern',                 '2026-08-10', '2026-11-10', 300.00, 'dropped'),
(9,  9,  7,  4, 'AY 2026-2027 1st Sem', 'Mixed-Signal IC Test Engineering Intern',          '2026-08-03', '2026-10-29', 300.00, 'completed'),
(10, 10, 8,  1, 'AY 2026-2027 1st Sem', 'Payment Microservices & API Security Intern',      '2026-08-03', '2026-10-30', 300.00, 'completed'),
(11, 11, 9,  2, 'AY 2026-2027 1st Sem', '5G Core & Packet Optical Network Intern',          '2026-08-17', '2026-11-20', 300.00, 'ongoing'),
(12, 12, 10, 4, 'AY 2026-2027 1st Sem', 'VLSI Layout & Power IC Verification Intern',       '2026-08-03', '2026-10-30', 300.00, 'completed'),
(13, 13, 11, 5, 'AY 2026-2027 1st Sem', 'Full-Stack Cloud Native Engineering Intern',       '2026-08-10', '2026-11-06', 300.00, 'completed'),
(14, 14, 12, 5, 'AY 2026-2027 1st Sem', 'Malware Reverse Engineering & SOC Intern',         '2026-08-03', '2026-10-29', 300.00, 'completed'),
(15, 15, 13, 6, 'AY 2026-2027 1st Sem', 'Automotive CAN-Bus & RTOS Firmware Intern',        '2026-08-24', '2026-11-27', 300.00, 'ongoing'),
(16, 16, 8,  3, 'AY 2026-2027 1st Sem', 'Site Reliability & Kubernetes Platform Intern',    '2026-08-03', '2026-10-30', 300.00, 'completed'),
(17, 17, 2,  4, 'AY 2026-2027 1st Sem', 'FPGA Signal Processing & HDL Design Intern',       '2026-08-17', '2026-11-18', 300.00, 'ongoing'),
(18, 18, 4,  5, 'AY 2026-2027 1st Sem', 'Data Warehouse & ETL Pipeline Intern',             '2026-08-03', '2026-10-30', 300.00, 'completed'),
(19, 19, 12, 6, 'AY 2026-2027 1st Sem', 'Cloud Security Posture & DevSecOps Intern',        '2026-09-01', '2026-11-30', 300.00, 'ongoing'),
(20, 20, 5,  6, 'AY 2026-2027 1st Sem', 'Automated QA & Cypress Test Engineering Intern',   '2026-08-03', '2026-10-30', 300.00, 'completed'),
(21, 21, 7,  4, 'AY 2026-2027 1st Sem', 'Wafer Probe Telemetry & Python Automation Intern', '2026-08-24', '2026-11-25', 300.00, 'ongoing'),
(22, 22, 11, 5, 'AY 2026-2027 1st Sem', 'Enterprise UI/UX & Design Systems Intern',         '2026-08-10', '2026-11-12', 300.00, 'ongoing'),
(23, 23, 14, 6, 'AY 2026-2027 1st Sem', 'Legacy Server Migration Intern',                   '2026-08-17', '2026-10-05', 300.00, 'dropped'),
(24, 24, 6,  1, 'AY 2026-2027 1st Sem', 'Android HAL & Camera Systems R&D Intern',          '2026-08-10', '2026-11-14', 300.00, 'ongoing');

-- 6. Seed Comprehensive TimeLogs across all 24 Placements (195+ rows)
INSERT INTO TimeLog (placement_id, date, time_in, time_out, break_minutes, hours_rendered, task_description, approval_status) VALUES
-- Placement 1 (Kian Balanag — Accenture): Total = 304.00 hrs (Completed)
(1, '2026-08-07', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Onboarding, design system audit, and React component library setup for enterprise client portal.', 'approved'),
(1, '2026-08-14', '08:00:00', '17:00:00', 60, 40.00, 'Week 2 Consolidated Block: Built responsive data grid tables and filter states for telemetry dashboard.', 'approved'),
(1, '2026-08-21', '08:00:00', '17:00:00', 60, 40.00, 'Week 3 Consolidated Block: Implemented role-based route guards and accessible form validation schemas.', 'approved'),
(1, '2026-08-28', '08:00:00', '17:00:00', 60, 40.00, 'Week 4 Consolidated Block: Integrated REST API endpoints for real-time time-series reporting views.', 'approved'),
(1, '2026-09-04', '08:00:00', '17:00:00', 60, 40.00, 'Week 5 Consolidated Block: Conducted Lighthouse performance optimization and reduced bundle size by 28%.', 'approved'),
(1, '2026-09-11', '08:00:00', '17:00:00', 60, 40.00, 'Week 6 Consolidated Block: Developed printable PDF/HTML compliance summary templates and unit tests.', 'approved'),
(1, '2026-09-18', '08:00:00', '17:00:00', 60, 40.00, 'Week 7 Consolidated Block: Executed cross-browser QA testing and resolved UI regression defects.', 'approved'),
(1, '2026-09-23', '08:00:00', '17:00:00', 60, 8.00,  'Refactored SVG icon primitives and keyboard navigation handlers.', 'approved'),
(1, '2026-09-24', '08:00:00', '17:00:00', 60, 8.00,  'Prepared technical turnover documentation for frontend modules.', 'approved'),
(1, '2026-09-25', '08:00:00', '17:00:00', 60, 8.00,  'Presented final intern sprint demo to engineering delivery lead.', 'approved'),

-- Placement 2 (Emmanuel Calangian — Pointwest): Total = 300.00 hrs (Completed)
(2, '2026-08-07', '08:30:00', '17:30:00', 60, 40.00, 'Week 1 Consolidated Block: Database normalization review and entity-relationship schema modeling.', 'approved'),
(2, '2026-08-14', '08:30:00', '17:30:00', 60, 40.00, 'Week 2 Consolidated Block: Authored SQL views and composite indexes for high-volume transaction reporting.', 'approved'),
(2, '2026-08-21', '08:30:00', '17:30:00', 60, 40.00, 'Week 3 Consolidated Block: Built REST API controllers for placement and attendance aggregation.', 'approved'),
(2, '2026-08-28', '08:30:00', '17:30:00', 60, 40.00, 'Week 4 Consolidated Block: Implemented stored procedures and triggers for automated compliance computation.', 'approved'),
(2, '2026-09-04', '08:30:00', '17:30:00', 60, 40.00, 'Week 5 Consolidated Block: Conducted query profiling with EXPLAIN and optimized multi-table JOINs.', 'approved'),
(2, '2026-09-11', '08:30:00', '17:30:00', 60, 40.00, 'Week 6 Consolidated Block: Added JWT/session role-based access control middleware and audit logging.', 'approved'),
(2, '2026-09-18', '08:30:00', '17:30:00', 60, 40.00, 'Week 7 Consolidated Block: Executed integration test suites and database backup/restore verification.', 'approved'),
(2, '2026-09-23', '08:30:00', '17:30:00', 60, 8.00,  'Finalized API endpoint documentation and Postman collection.', 'approved'),
(2, '2026-09-24', '08:30:00', '17:30:00', 60, 8.00,  'Code review and production deployment checklist verification.', 'approved'),
(2, '2026-09-25', '08:30:00', '13:30:00', 60, 4.00,  'Completed final exit briefing with database engineering mentor.', 'approved'),

-- Placement 3 (Sophia Margarete Gutierrez — Azeus Systems): Total = 284.00 hrs (Ongoing - 16 hrs remaining)
(3, '2026-08-14', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Analyzed functional requirements and drafted Software Requirements Specification (SRS).', 'approved'),
(3, '2026-08-21', '08:00:00', '17:00:00', 60, 40.00, 'Week 2 Consolidated Block: Created process flowcharts, use-case specifications, and data dictionary tables.', 'approved'),
(3, '2026-08-28', '08:00:00', '17:00:00', 60, 40.00, 'Week 3 Consolidated Block: Designed UAT test cases and traceability matrix for GovTech workflow module.', 'approved'),
(3, '2026-09-04', '08:00:00', '17:00:00', 60, 40.00, 'Week 4 Consolidated Block: Executed regression testing across 85 test scenarios and logged defect reports.', 'approved'),
(3, '2026-09-11', '08:00:00', '17:00:00', 60, 40.00, 'Week 5 Consolidated Block: Authored end-user operational manual and administrator configuration guide.', 'approved'),
(3, '2026-09-18', '08:00:00', '17:00:00', 60, 40.00, 'Week 6 Consolidated Block: Coordinated sprint retrospective metrics and release notes compilation.', 'approved'),
(3, '2026-10-02', '08:00:00', '17:00:00', 60, 28.00, 'Week 7 Partial Block: Conducted stakeholder acceptance walkthrough and updated schema documentation.', 'approved'),
(3, '2026-11-04', '08:00:00', '17:00:00', 60, 8.00,  'Verified bug fixes on compliance report export formatting.', 'approved'),
(3, '2026-11-05', '08:00:00', '17:00:00', 60, 8.00,  'Updated final deployment manual and system handover dossier.', 'pending'),

-- Placement 4 (Adrian Yadao — Analog Devices): Total = 302.50 hrs (Hours Met >= 300, waiting for Evaluation!)
(4, '2026-08-07', '07:30:00', '16:30:00', 60, 40.00, 'Week 1 Consolidated Block: Configured STM32/ARM toolchain and serial telemetry parser in C/Python.', 'approved'),
(4, '2026-08-14', '07:30:00', '16:30:00', 60, 40.00, 'Week 2 Consolidated Block: Developed automated hardware-in-the-loop test scripts and SQLite/MySQL data logger.', 'approved'),
(4, '2026-08-21', '07:30:00', '16:30:00', 60, 40.00, 'Week 3 Consolidated Block: Built REST ingestion pipeline for wafer probe station diagnostic logs.', 'approved'),
(4, '2026-08-28', '07:30:00', '16:30:00', 60, 40.00, 'Week 4 Consolidated Block: Optimized batch SQL aggregation queries reducing report latency from 4.2s to 180ms.', 'approved'),
(4, '2026-09-04', '07:30:00', '16:30:00', 60, 40.00, 'Week 5 Consolidated Block: Calibrated sensor acquisition firmware and documented SPI/I2C register maps.', 'approved'),
(4, '2026-09-11', '07:30:00', '16:30:00', 60, 40.00, 'Week 6 Consolidated Block: Implemented anomaly detection alerts on voltage regulator test benches.', 'approved'),
(4, '2026-09-18', '07:30:00', '16:30:00', 60, 40.00, 'Week 7 Consolidated Block: Integrated test bench telemetry API with internal engineering dashboard.', 'approved'),
(4, '2026-11-03', '07:30:00', '16:30:00', 60, 8.00,  'Executed final validation run on automated test fixture.', 'approved'),
(4, '2026-11-04', '07:30:00', '16:30:00', 60, 8.00,  'Completed code documentation and repository archiving.', 'approved'),
(4, '2026-11-05', '07:30:00', '15:00:00', 60, 6.50,  'Final technical presentation to Analog Devices product engineering team.', 'approved'),

-- Placement 5 (Miguel Delos Santos — Globe Telecom): Total = 200.00 hrs (Ongoing)
(5, '2026-09-04', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Assisted NOC engineers in monitoring core router BGP sessions and link utilization.', 'approved'),
(5, '2026-09-11', '08:00:00', '17:00:00', 60, 40.00, 'Week 2 Consolidated Block: Configured SNMP polling templates and Grafana network health dashboards.', 'approved'),
(5, '2026-09-18', '08:00:00', '17:00:00', 60, 40.00, 'Week 3 Consolidated Block: Automated VLAN provisioning validation scripts using Python Netmiko.', 'approved'),
(5, '2026-09-25', '08:00:00', '17:00:00', 60, 40.00, 'Week 4 Consolidated Block: Audited cell site backhaul latency logs and prepared weekly SLA summary.', 'approved'),
(5, '2026-10-02', '08:00:00', '17:00:00', 60, 32.00, 'Week 5 Block: Participated in disaster recovery failover simulation and topology documentation.', 'approved'),
(5, '2026-11-05', '08:00:00', '17:00:00', 60, 8.00,  'Updated regional MPLS link capacity forecast sheets.', 'pending'),

-- Placement 6 (Clarisse Anne Villanueva — Samsung R&D): Total = 310.00 hrs (Completed)
(6, '2026-08-07', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Set up SystemVerilog simulation environment and regression runner.', 'approved'),
(6, '2026-08-14', '08:00:00', '17:00:00', 60, 45.00, 'Week 2 Consolidated Block: Wrote directed testbenches for UART and DMA controller modules.', 'approved'),
(6, '2026-08-21', '08:00:00', '17:00:00', 60, 45.00, 'Week 3 Consolidated Block: Analyzed functional coverage reports and closed corner-case assertions.', 'approved'),
(6, '2026-08-28', '08:00:00', '17:00:00', 60, 45.00, 'Week 4 Consolidated Block: Automated RTL synthesis log parsing using Python and regular expressions.', 'approved'),
(6, '2026-09-04', '08:00:00', '17:00:00', 60, 45.00, 'Week 5 Consolidated Block: Verified low-power sleep state transitions in gate-level simulation.', 'approved'),
(6, '2026-09-11', '08:00:00', '17:00:00', 60, 45.00, 'Week 6 Consolidated Block: Collaborated with firmware team to debug bootloader handoff sequence.', 'approved'),
(6, '2026-09-18', '08:00:00', '17:00:00', 60, 45.00, 'Week 7 Consolidated Block: Completed verification sign-off report and technical presentation.', 'approved'),

-- Placement 7 (Jomel Christian Reyes — Accenture): Total = 168.00 hrs (Ongoing)
(7, '2026-09-18', '09:00:00', '18:00:00', 60, 40.00, 'Week 1 Consolidated Block: Provisioned Docker containers and CI/CD GitHub Actions workflows.', 'approved'),
(7, '2026-09-25', '09:00:00', '18:00:00', 60, 40.00, 'Week 2 Consolidated Block: Configured Terraform state backends and staging Kubernetes manifests.', 'approved'),
(7, '2026-10-02', '09:00:00', '18:00:00', 60, 40.00, 'Week 3 Consolidated Block: Implemented Prometheus metrics exporters and alert rules for API latency.', 'approved'),
(7, '2026-10-09', '09:00:00', '18:00:00', 60, 40.00, 'Week 4 Consolidated Block: Built Helm chart templates for multi-environment microservice deployments.', 'approved'),
(7, '2026-11-05', '09:00:00', '18:00:00', 60, 8.00,  'Hardened container base images and resolved vulnerability scan findings.', 'pending'),

-- Placement 8 (Patricia Mae Mendoza — Globe Telecom): Total = 40.00 hrs (Dropped)
(8, '2026-08-14', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Initial IT helpdesk orientation and asset inventory tagging.', 'approved'),

-- Placement 9 (Justine Mark Alcantara — Texas Instruments): Total = 308.00 hrs (Completed)
(9, '2026-08-07', '07:00:00', '16:00:00', 60, 44.00, 'Week 1 Consolidated Block: Completed ESD safety certification and Automated Test Equipment (ATE) orientation.', 'approved'),
(9, '2026-08-14', '07:00:00', '16:00:00', 60, 44.00, 'Week 2 Consolidated Block: Developed C++ test routines for DC/DC buck converter characterization.', 'approved'),
(9, '2026-08-21', '07:00:00', '16:00:00', 60, 44.00, 'Week 3 Consolidated Block: Analyzed wafer yield distribution and Gauge R&R repeatability logs.', 'approved'),
(9, '2026-08-28', '07:00:00', '16:00:00', 60, 44.00, 'Week 4 Consolidated Block: Optimized probe card contact resistance check routines reducing test time by 14%.', 'approved'),
(9, '2026-09-04', '07:00:00', '16:00:00', 60, 44.00, 'Week 5 Consolidated Block: Built Python STDF data parser for statistical bin analysis.', 'approved'),
(9, '2026-09-11', '07:00:00', '16:00:00', 60, 44.00, 'Week 6 Consolidated Block: Validated thermal shutdown thresholds across -40C to +125C temperature chambers.', 'approved'),
(9, '2026-09-18', '07:00:00', '16:00:00', 60, 44.00, 'Week 7 Consolidated Block: Authored final IC characterization summary and presented to TI test engineers.', 'approved'),

-- Placement 10 (Bea Katrina Pascual — Maya Philippines): Total = 304.00 hrs (Completed)
(10, '2026-08-07', '09:00:00', '18:00:00', 60, 40.00, 'Week 1 Consolidated Block: Onboarded to FinTech API gateway squad and reviewed PCI-DSS security controls.', 'approved'),
(10, '2026-08-14', '09:00:00', '18:00:00', 60, 40.00, 'Week 2 Consolidated Block: Implemented idempotency key validation middleware for QR payment webhooks.', 'approved'),
(10, '2026-08-21', '09:00:00', '18:00:00', 60, 40.00, 'Week 3 Consolidated Block: Wrote JUnit and k6 load test scripts simulating 2,500 concurrent settlement requests.', 'approved'),
(10, '2026-08-28', '09:00:00', '18:00:00', 60, 40.00, 'Week 4 Consolidated Block: Built Redis rate-limiting counters and dead-letter queue retry handlers.', 'approved'),
(10, '2026-09-04', '09:00:00', '18:00:00', 60, 40.00, 'Week 5 Consolidated Block: Integrated OpenTelemetry distributed tracing spans across payment microservices.', 'approved'),
(10, '2026-09-11', '09:00:00', '18:00:00', 60, 40.00, 'Week 6 Consolidated Block: Resolved OAuth2 token refresh race conditions in merchant portal SDK.', 'approved'),
(10, '2026-09-18', '09:00:00', '18:00:00', 60, 40.00, 'Week 7 Consolidated Block: Conducted security regression testing and OWASP API Top 10 audit.', 'approved'),
(10, '2026-09-25', '09:00:00', '18:00:00', 60, 24.00, 'Week 8 Block: Completed microservice runbook documentation and final sprint showcase.', 'approved'),

-- Placement 11 (Raphael Vince Soriano — Smart / PLDT): Total = 256.00 hrs (Ongoing)
(11, '2026-08-21', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Studied 5G Standalone (SA) core architecture and DWDM optical transport rings.', 'approved'),
(11, '2026-08-28', '08:00:00', '17:00:00', 60, 40.00, 'Week 2 Consolidated Block: Assisted in validating gNodeB neighbor cell handover parameters in Metro Manila.', 'approved'),
(11, '2026-09-04', '08:00:00', '17:00:00', 60, 40.00, 'Week 3 Consolidated Block: Built Python scripts to parse syslog alarms from core routing nodes.', 'approved'),
(11, '2026-09-11', '08:00:00', '17:00:00', 60, 40.00, 'Week 4 Consolidated Block: Audited fiber optic attenuation budgets and OTDR trace reports.', 'approved'),
(11, '2026-09-18', '08:00:00', '17:00:00', 60, 40.00, 'Week 5 Consolidated Block: Configured IPv6 dual-stack addressing lab topology in GNS3/EVE-NG.', 'approved'),
(11, '2026-09-25', '08:00:00', '17:00:00', 60, 40.00, 'Week 6 Consolidated Block: Analyzed packet loss and jitter telemetry across Luzon backbone links.', 'approved'),
(11, '2026-11-04', '08:00:00', '17:00:00', 60, 8.00,  'Prepared cell site microwave link budget verification sheet.', 'approved'),
(11, '2026-11-05', '08:00:00', '17:00:00', 60, 8.00,  'Assisted transport engineering team during scheduled maintenance window review.', 'pending'),

-- Placement 12 (Hannah Camille Evangelista — Rohm Electronics): Total = 305.00 hrs (Completed)
(12, '2026-08-07', '07:30:00', '16:30:00', 60, 45.00, 'Week 1 Consolidated Block: Trained on Cadence Virtuoso IC layout suite and CMOS design rules.', 'approved'),
(12, '2026-08-14', '07:30:00', '16:30:00', 60, 45.00, 'Week 2 Consolidated Block: Executed Design Rule Checking (DRC) and Layout Versus Schematic (LVS) on LDO blocks.', 'approved'),
(12, '2026-08-21', '07:30:00', '16:30:00', 60, 45.00, 'Week 3 Consolidated Block: Optimized guard-ring placement and matched differential pair routing.', 'approved'),
(12, '2026-08-28', '07:30:00', '16:30:00', 60, 45.00, 'Week 4 Consolidated Block: Extracted parasitic RC netlists and ran post-layout SPICE transient simulations.', 'approved'),
(12, '2026-09-04', '07:30:00', '16:30:00', 60, 45.00, 'Week 5 Consolidated Block: Automated SKILL helper scripts for pad-ring label verification.', 'approved'),
(12, '2026-09-11', '07:30:00', '16:30:00', 60, 40.00, 'Week 6 Consolidated Block: Verified electro-migration current density limits on power metal layers.', 'approved'),
(12, '2026-09-18', '07:30:00', '16:30:00', 60, 40.00, 'Week 7 Consolidated Block: Finalized tape-out checklist documentation and presented layout review.', 'approved'),

-- Placement 13 (John Paul Bautista — Yondu): Total = 300.00 hrs (Completed)
(13, '2026-08-14', '08:30:00', '17:30:00', 60, 40.00, 'Week 1 Consolidated Block: Set up TypeScript monorepo, Next.js frontend, and NestJS microservice backend.', 'approved'),
(13, '2026-08-21', '08:30:00', '17:30:00', 60, 40.00, 'Week 2 Consolidated Block: Built role-based enterprise ticketing module with PostgreSQL and Prisma ORM.', 'approved'),
(13, '2026-08-28', '08:30:00', '17:30:00', 60, 40.00, 'Week 3 Consolidated Block: Implemented S3 pre-signed document upload pipeline and virus scan hook.', 'approved'),
(13, '2026-09-04', '08:30:00', '17:30:00', 60, 40.00, 'Week 4 Consolidated Block: Created WebSocket notification service for real-time SLA escalations.', 'approved'),
(13, '2026-09-11', '08:30:00', '17:30:00', 60, 40.00, 'Week 5 Consolidated Block: Wrote Jest integration tests achieving 89% branch coverage on core APIs.', 'approved'),
(13, '2026-09-18', '08:30:00', '17:30:00', 60, 40.00, 'Week 6 Consolidated Block: Optimized Docker multi-stage build and deployed staging environment on AWS ECS.', 'approved'),
(13, '2026-09-25', '08:30:00', '17:30:00', 60, 40.00, 'Week 7 Consolidated Block: Conducted UAT bug bash and resolved 14 UI/API issues.', 'approved'),
(13, '2026-10-02', '08:30:00', '17:30:00', 60, 20.00, 'Week 8 Block: Completed API OpenAPI/Swagger specification and knowledge transfer session.', 'approved'),

-- Placement 14 (Angelica Joy Castillo — Trend Micro): Total = 304.00 hrs (Completed)
(14, '2026-08-07', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Configured isolated malware analysis sandbox VM and YARA rule environment.', 'approved'),
(14, '2026-08-14', '08:00:00', '17:00:00', 60, 40.00, 'Week 2 Consolidated Block: Analyzed PE header anomalies and unpacked obfuscated loader samples.', 'approved'),
(14, '2026-08-21', '08:00:00', '17:00:00', 60, 40.00, 'Week 3 Consolidated Block: Authored 18 YARA detection signatures with zero false positives on clean corpus.', 'approved'),
(14, '2026-08-28', '08:00:00', '17:00:00', 60, 40.00, 'Week 4 Consolidated Block: Automated threat intelligence IOC enrichment script in Python.', 'approved'),
(14, '2026-09-04', '08:00:00', '17:00:00', 60, 40.00, 'Week 5 Consolidated Block: Profiled ransomware behavioral telemetry in Windows Event Logs (Sysmon).', 'approved'),
(14, '2026-09-11', '08:00:00', '17:00:00', 60, 40.00, 'Week 6 Consolidated Block: Built MITRE ATT&CK mapping dashboard for internal threat hunting team.', 'approved'),
(14, '2026-09-18', '08:00:00', '17:00:00', 60, 40.00, 'Week 7 Consolidated Block: Conducted false-positive regression testing on endpoint detection rules.', 'approved'),
(14, '2026-09-25', '08:00:00', '17:00:00', 60, 24.00, 'Week 8 Block: Presented threat research capstone report to Trend Micro senior threat analysts.', 'approved'),

-- Placement 15 (Karl Patrick De Guzman — Tsukiden Global): Total = 224.00 hrs (Ongoing)
(15, '2026-08-28', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Studied MISRA-C coding guidelines and FreeRTOS task scheduling.', 'approved'),
(15, '2026-09-04', '08:00:00', '17:00:00', 60, 40.00, 'Week 2 Consolidated Block: Implemented CAN-Bus frame parser and cyclic redundancy check (CRC) validator.', 'approved'),
(15, '2026-09-11', '08:00:00', '17:00:00', 60, 40.00, 'Week 3 Consolidated Block: Wrote unit tests for automotive instrument cluster state machine using Ceedling.', 'approved'),
(15, '2026-09-18', '08:00:00', '17:00:00', 60, 40.00, 'Week 4 Consolidated Block: Debugged PWM backlight dimming driver using logic analyzer and oscilloscope.', 'approved'),
(15, '2026-09-25', '08:00:00', '17:00:00', 60, 40.00, 'Week 5 Consolidated Block: Resolved static analysis warnings in QAC and updated module design document.', 'approved'),
(15, '2026-11-03', '08:00:00', '17:00:00', 60, 8.00,  'Executed HIL bench simulation for door-ajar warning CAN message.', 'approved'),
(15, '2026-11-04', '08:00:00', '17:00:00', 60, 8.00,  'Updated traceability links between firmware functions and Japanese spec sheet.', 'approved'),
(15, '2026-11-05', '08:00:00', '17:00:00', 60, 8.00,  'Ran memory stack overflow static estimation on RTOS tasks.', 'pending'),

-- Placement 16 (Danielle Faith Aquino — Maya Philippines): Total = 300.00 hrs (Completed)
(16, '2026-08-07', '09:00:00', '18:00:00', 60, 40.00, 'Week 1 Consolidated Block: Configured Kubernetes cluster monitoring with Prometheus and Alertmanager.', 'approved'),
(16, '2026-08-14', '09:00:00', '18:00:00', 60, 40.00, 'Week 2 Consolidated Block: Authored Terraform modules for AWS EKS node groups and IAM roles.', 'approved'),
(16, '2026-08-21', '09:00:00', '18:00:00', 60, 40.00, 'Week 3 Consolidated Block: Built ArgoCD GitOps sync pipelines for zero-downtime canary releases.', 'approved'),
(16, '2026-08-28', '09:00:00', '18:00:00', 60, 40.00, 'Week 4 Consolidated Block: Tuned Horizontal Pod Autoscaler (HPA) thresholds under simulated payday traffic.', 'approved'),
(16, '2026-09-04', '09:00:00', '18:00:00', 60, 40.00, 'Week 5 Consolidated Block: Automated PostgreSQL RDS snapshot verification and restore drill scripts.', 'approved'),
(16, '2026-09-11', '09:00:00', '18:00:00', 60, 40.00, 'Week 6 Consolidated Block: Created Grafana SLO burn-rate dashboards for core wallet endpoints.', 'approved'),
(16, '2026-09-18', '09:00:00', '18:00:00', 60, 40.00, 'Week 7 Consolidated Block: Participated in chaos engineering game day and documented incident playbooks.', 'approved'),
(16, '2026-09-25', '09:00:00', '18:00:00', 60, 20.00, 'Week 8 Block: Finalized SRE infrastructure runbooks and completed exit review.', 'approved'),

-- Placement 17 (Christian Dave Navarro — Analog Devices): Total = 264.00 hrs (Ongoing)
(17, '2026-08-21', '07:30:00', '16:30:00', 60, 40.00, 'Week 1 Consolidated Block: Set up Xilinx Vivado toolchain and synthesized baseline FIR filter in Verilog.', 'approved'),
(17, '2026-08-28', '07:30:00', '16:30:00', 60, 40.00, 'Week 2 Consolidated Block: Implemented AXI4-Stream interface wrapper for high-speed ADC data capture.', 'approved'),
(17, '2026-09-04', '07:30:00', '16:30:00', 60, 40.00, 'Week 3 Consolidated Block: Closed timing violations at 200 MHz clock domain using pipeline registers.', 'approved'),
(17, '2026-09-11', '07:30:00', '16:30:00', 60, 40.00, 'Week 4 Consolidated Block: Verified FFT spectrum analyzer output against MATLAB golden reference vectors.', 'approved'),
(17, '2026-09-18', '07:30:00', '16:30:00', 60, 40.00, 'Week 5 Consolidated Block: Integrated Integrated Logic Analyzer (ILA) cores for on-chip hardware debugging.', 'approved'),
(17, '2026-09-25', '07:30:00', '16:30:00', 60, 40.00, 'Week 6 Consolidated Block: Automated Python UART command client for FPGA register configuration.', 'approved'),
(17, '2026-11-03', '07:30:00', '16:30:00', 60, 8.00,  'Measured LUT and BRAM utilization metrics across Zynq-7000 targets.', 'approved'),
(17, '2026-11-04', '07:30:00', '16:30:00', 60, 8.00,  'Documented RTL block diagram and clock domain crossing (CDC) constraints.', 'approved'),
(17, '2026-11-05', '07:30:00', '16:30:00', 60, 8.00,  'Ran full regression suite on updated decimation filter module.', 'pending'),

-- Placement 18 (Trisha Nicole Ocampo — Pointwest): Total = 300.00 hrs (Completed)
(18, '2026-08-07', '08:30:00', '17:30:00', 60, 40.00, 'Week 1 Consolidated Block: Profiled source relational databases and designed dimensional star schema.', 'approved'),
(18, '2026-08-14', '08:30:00', '17:30:00', 60, 40.00, 'Week 2 Consolidated Block: Built Python & SQL ETL pipelines for daily retail inventory ingestion.', 'approved'),
(18, '2026-08-21', '08:30:00', '17:30:00', 60, 40.00, 'Week 3 Consolidated Block: Implemented automated data quality assertions for null keys and schema drift.', 'approved'),
(18, '2026-08-28', '08:30:00', '17:30:00', 60, 40.00, 'Week 4 Consolidated Block: Optimized materialized analytical views and partitioned historical fact tables.', 'approved'),
(18, '2026-09-04', '08:30:00', '17:30:00', 60, 40.00, 'Week 5 Consolidated Block: Scheduled DAG workflows and configured Slack failure alert webhooks.', 'approved'),
(18, '2026-09-11', '08:30:00', '17:30:00', 60, 40.00, 'Week 6 Consolidated Block: Built executive KPI summary views and validated reconciliation totals.', 'approved'),
(18, '2026-09-18', '08:30:00', '17:30:00', 60, 40.00, 'Week 7 Consolidated Block: Authored data lineage catalog and ETL operational runbook.', 'approved'),
(18, '2026-09-25', '08:30:00', '17:30:00', 60, 20.00, 'Week 8 Block: Completed final data engineering handover and mentor evaluation.', 'approved'),

-- Placement 19 (Kenneth Ian Salazar — Trend Micro): Total = 184.00 hrs (Ongoing)
(19, '2026-09-04', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Audited AWS IAM policies and S3 bucket public access controls.', 'approved'),
(19, '2026-09-11', '08:00:00', '17:00:00', 60, 40.00, 'Week 2 Consolidated Block: Integrated Trivy container image scanning and SAST rules into CI pipelines.', 'approved'),
(19, '2026-09-18', '08:00:00', '17:00:00', 60, 40.00, 'Week 3 Consolidated Block: Wrote Python Boto3 compliance scripts to detect unencrypted EBS volumes.', 'approved'),
(19, '2026-09-25', '08:00:00', '17:00:00', 60, 40.00, 'Week 4 Consolidated Block: Configured AWS Security Hub findings aggregator and remediation lambdas.', 'approved'),
(19, '2026-10-02', '08:00:00', '17:00:00', 60, 16.00, 'Week 5 Block: Conducted CIS benchmark compliance review on staging Kubernetes nodes.', 'approved'),
(19, '2026-11-05', '08:00:00', '17:00:00', 60, 8.00,  'Updated DevSecOps secret-scanning pre-commit hooks.', 'pending'),

-- Placement 20 (Alyssa Marie Mercado — Azeus Systems): Total = 304.00 hrs (Completed)
(20, '2026-08-07', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Set up Cypress end-to-end automation framework and page object models.', 'approved'),
(20, '2026-08-14', '08:00:00', '17:00:00', 60, 40.00, 'Week 2 Consolidated Block: Automated 45 regression test specs for document approval and e-signature flows.', 'approved'),
(20, '2026-08-21', '08:00:00', '17:00:00', 60, 40.00, 'Week 3 Consolidated Block: Integrated API contract testing using Postman/Newman in nightly builds.', 'approved'),
(20, '2026-08-28', '08:00:00', '17:00:00', 60, 40.00, 'Week 4 Consolidated Block: Conducted accessibility (WCAG 2.1 AA) audit and keyboard focus verification.', 'approved'),
(20, '2026-09-04', '08:00:00', '17:00:00', 60, 40.00, 'Week 5 Consolidated Block: Reduced flaky test failures by replacing fixed waits with network intercepts.', 'approved'),
(20, '2026-09-11', '08:00:00', '17:00:00', 60, 40.00, 'Week 6 Consolidated Block: Generated HTML Mochawesome test coverage reports for release sign-off.', 'approved'),
(20, '2026-09-18', '08:00:00', '17:00:00', 60, 40.00, 'Week 7 Consolidated Block: Verified multi-role permission matrices across 12 user personas.', 'approved'),
(20, '2026-09-25', '08:00:00', '17:00:00', 60, 24.00, 'Week 8 Block: Completed QA automation turnover guide and final sprint demonstration.', 'approved'),

-- Placement 21 (Francis Leo Pangilinan — Texas Instruments): Total = 240.00 hrs (Ongoing)
(21, '2026-08-28', '07:00:00', '16:00:00', 60, 40.00, 'Week 1 Consolidated Block: Built Python pandas pipeline to aggregate wafer probe station log files.', 'approved'),
(21, '2026-09-04', '07:00:00', '16:00:00', 60, 40.00, 'Week 2 Consolidated Block: Created wafer map heat-plot generator for visual defect clustering.', 'approved'),
(21, '2026-09-11', '07:00:00', '16:00:00', 60, 40.00, 'Week 3 Consolidated Block: Automated daily yield excursion email alerts for product engineers.', 'approved'),
(21, '2026-09-18', '07:00:00', '16:00:00', 60, 40.00, 'Week 4 Consolidated Block: Indexed historical test lot tables in MySQL to speed up trend queries.', 'approved'),
(21, '2026-09-25', '07:00:00', '16:00:00', 60, 40.00, 'Week 5 Consolidated Block: Added outlier filtering (3-sigma) to parametric test summary scripts.', 'approved'),
(21, '2026-10-02', '07:00:00', '16:00:00', 60, 40.00, 'Week 6 Consolidated Block: Validated lot genealogy reconciliation between MES and probe database.', 'approved'),
(21, '2026-10-09', '07:00:00', '16:00:00', 60, 8.00,  'Duplicate unverified weekend shift entry (flagged during supervisor audit).', 'flagged'),

-- Placement 22 (Samantha Denise Lim — Yondu): Total = 276.00 hrs (Ongoing - 24 hrs remaining)
(22, '2026-08-14', '08:30:00', '17:30:00', 60, 40.00, 'Week 1 Consolidated Block: Audited enterprise portal UI tokens and established Figma-to-React token sync.', 'approved'),
(22, '2026-08-21', '08:30:00', '17:30:00', 60, 40.00, 'Week 2 Consolidated Block: Built reusable modal, drawer, and data table pagination components.', 'approved'),
(22, '2026-08-28', '08:30:00', '17:30:00', 60, 40.00, 'Week 3 Consolidated Block: Implemented skeleton loading states and optimistic UI updates.', 'approved'),
(22, '2026-09-04', '08:30:00', '17:30:00', 60, 40.00, 'Week 4 Consolidated Block: Conducted usability testing with 8 internal operations staff and refined forms.', 'approved'),
(22, '2026-09-11', '08:30:00', '17:30:00', 60, 40.00, 'Week 5 Consolidated Block: Built responsive chart cards and CSV export utilities.', 'approved'),
(22, '2026-09-18', '08:30:00', '17:30:00', 60, 40.00, 'Week 6 Consolidated Block: Standardized dark/light contrast ratios and focus ring accessibility.', 'approved'),
(22, '2026-09-25', '08:30:00', '17:30:00', 60, 28.00, 'Week 7 Partial Block: Documented Storybook component props and usage guidelines.', 'approved'),
(22, '2026-11-05', '08:30:00', '17:30:00', 60, 8.00,  'Polished print stylesheet for executive summary reports.', 'pending'),

-- Placement 23 (Jerome Andrei Valdez — Syntellect Legacy): Total = 56.00 hrs (Dropped due to HTE MOA expiry)
(23, '2026-08-21', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Cataloged on-premise Windows Server 2012 instances for migration.', 'approved'),
(23, '2026-08-28', '08:00:00', '17:00:00', 60, 16.00, 'Week 2 Partial Block: Exported IIS configuration backups prior to HTE MOA suspension.', 'approved'),

-- Placement 24 (Katrina Isabel Robles — Samsung R&D): Total = 292.00 hrs (Ongoing - 8 hrs remaining!)
(24, '2026-08-14', '08:00:00', '17:00:00', 60, 40.00, 'Week 1 Consolidated Block: Set up Android Open Source Project (AOSP) build tree and ADB debugging tools.', 'approved'),
(24, '2026-08-21', '08:00:00', '17:00:00', 60, 40.00, 'Week 2 Consolidated Block: Analyzed Camera2 API frame capture latency and HAL3 metadata tags.', 'approved'),
(24, '2026-08-28', '08:00:00', '17:00:00', 60, 40.00, 'Week 3 Consolidated Block: Wrote C++ gtest unit tests for image sensor exposure control service.', 'approved'),
(24, '2026-09-04', '08:00:00', '17:00:00', 60, 40.00, 'Week 4 Consolidated Block: Profiled memory heap allocations in camera daemon using Android Studio Profiler.', 'approved'),
(24, '2026-09-11', '08:00:00', '17:00:00', 60, 40.00, 'Week 5 Consolidated Block: Automated logcat crash signature extraction script in Python.', 'approved'),
(24, '2026-09-18', '08:00:00', '17:00:00', 60, 40.00, 'Week 6 Consolidated Block: Verified HDR multi-frame buffer synchronization on prototype device.', 'approved'),
(24, '2026-09-25', '08:00:00', '17:00:00', 60, 40.00, 'Week 7 Consolidated Block: Resolved 6 CTS (Compatibility Test Suite) camera test cases.', 'approved'),
(24, '2026-11-05', '08:00:00', '17:00:00', 60, 12.00, 'Completed final HAL benchmark comparisons and technical slide deck.', 'approved');

-- 7. Seed 47 Evaluations across Completed and Near-Completion Placements (all 4 instruments)
INSERT INTO Evaluation (eval_id, placement_id, instrument_type, evaluator_type, evaluator_name, technical_score, attitude_score, attendance_score, rating, comments, date_evaluated) VALUES
(1,  1,  'supervisor_to_student', 'employer', 'Engr. Paolo M. Sarmiento (Accenture)',          4.90, 5.00, 4.95, 4.95, 'Kian demonstrated exceptional mastery of React architecture, state management, and accessible UI engineering. Delivered production-ready dashboards ahead of schedule.', '2026-10-28'),
(2,  1,  'adviser_to_hte',        'adviser',  'Engr. Arlene R. Dela Cruz, MSc',                4.90, 4.95, 5.00, 4.95, 'All weekly accomplishment logs and DTR sheets were submitted promptly with comprehensive technical documentation. HTE supervision verified.', '2026-10-30'),
(3,  2,  'supervisor_to_student', 'employer', 'Mr. Carlo J. Pangilinan (Pointwest)',           5.00, 4.90, 4.95, 4.95, 'Emmanuel designed highly optimized SQL queries, stored procedures, and REST endpoints. His relational schema work directly improved our reporting pipeline.', '2026-10-27'),
(4,  2,  'adviser_to_hte',        'adviser',  'Engr. Arlene R. Dela Cruz, MSc',                4.95, 4.90, 5.00, 4.95, 'Outstanding backend engineering performance and complete compliance requirements. Highly recommended for clearance.', '2026-10-30'),
(5,  3,  'supervisor_to_student', 'employer', 'Ms. Hannah G. Soriano (Azeus Systems)',         4.85, 5.00, 4.90, 4.92, 'Sophia produced meticulous system documentation, UAT test matrices, and QA reports. She only needs 16 more hours to complete her 300-hour practicum.', '2026-11-04'),
(6,  6,  'supervisor_to_student', 'employer', 'Dr. Kenneth Y. Lim (Samsung R&D)',              4.95, 4.95, 5.00, 4.97, 'Clarisse showed strong analytical rigor in RTL verification and scripting automation. Exceeded expectations for an undergraduate intern.', '2026-10-26'),
(7,  6,  'adviser_to_hte',        'adviser',  'Dr. Evelyn S. Bautista, PECE',                  4.90, 5.00, 5.00, 4.97, 'Completed 310 hours with exemplary evaluations from Samsung R&D. Approved for final OJT clearance.', '2026-10-29'),
(8,  9,  'supervisor_to_student', 'employer', 'Engr. Roberto V. Salazar (Texas Instruments)',  4.90, 4.95, 5.00, 4.95, 'Justine quickly grasped ATE mixed-signal test programming and STDF data analytics, reducing probe test overhead by 14%.', '2026-10-27'),
(9,  9,  'adviser_to_hte',        'adviser',  'Engr. Ramon C. Tolentino, MEng',                4.85, 4.95, 5.00, 4.93, 'Verified 308 hours of semiconductor test engineering practicum at Texas Instruments. Endorsed for institutional clearance.', '2026-10-29'),
(10, 10, 'supervisor_to_student', 'employer', 'Engr. Camille D. Ilagan (Maya Philippines)',    5.00, 4.95, 4.95, 4.97, 'Bea delivered production-grade idempotency middleware and k6 load testing scripts for our payment gateway squad.', '2026-10-28'),
(11, 10, 'adviser_to_hte',        'adviser',  'Engr. Arlene R. Dela Cruz, MSc',                4.95, 5.00, 4.95, 4.97, 'Exemplary FinTech software engineering practicum portfolio and complete DTR records. Cleared.', '2026-10-30'),
(12, 12, 'supervisor_to_student', 'employer', 'Engr. Hideki K. Taniguchi (Rohm Electronics)',  4.85, 4.95, 5.00, 4.93, 'Hannah demonstrated high precision in CMOS analog layout, DRC/LVS verification, and parasitic extraction.', '2026-10-28'),
(13, 12, 'adviser_to_hte',        'adviser',  'Engr. Ramon C. Tolentino, MEng',                4.90, 4.90, 5.00, 4.93, 'All 305 hours and LSI layout deliverables verified. Approved for final OJT clearance.', '2026-10-30'),
(14, 13, 'supervisor_to_student', 'employer', 'Ms. Katrina S. Policarpio (Yondu)',             4.80, 4.90, 4.95, 4.88, 'John Paul contributed across both Next.js and NestJS microservices with strong automated test coverage.', '2026-11-02'),
(15, 13, 'adviser_to_hte',        'adviser',  'Dr. Lorna M. Macapagal, PCpE',                  4.85, 4.90, 4.95, 4.90, 'Completed 300 hours of full-stack cloud native development with complete documentation. Cleared.', '2026-11-04'),
(16, 14, 'supervisor_to_student', 'employer', 'Engr. Victor M. Manansala (Trend Micro)',       5.00, 4.95, 5.00, 4.98, 'Angelica authored 18 high-accuracy YARA detection rules and automated IOC enrichment tools for our threat hunting lab.', '2026-10-27'),
(17, 14, 'adviser_to_hte',        'adviser',  'Dr. Lorna M. Macapagal, PCpE',                  4.95, 5.00, 5.00, 4.98, 'Exceptional cybersecurity research performance and complete 304-hour DTR compliance. Cleared with distinction.', '2026-10-29'),
(18, 16, 'supervisor_to_student', 'employer', 'Engr. Camille D. Ilagan (Maya Philippines)',    4.90, 4.90, 4.95, 4.92, 'Danielle built reliable Terraform and ArgoCD GitOps pipelines and improved our Kubernetes autoscaling playbooks.', '2026-10-28'),
(19, 16, 'adviser_to_hte',        'adviser',  'Dr. Evelyn S. Bautista, PECE',                  4.90, 4.95, 4.95, 4.93, 'Satisfied all 300 required hours and SRE competency milestones. Endorsed for clearance.', '2026-10-30'),
(20, 18, 'supervisor_to_student', 'employer', 'Mr. Carlo J. Pangilinan (Pointwest)',           4.85, 4.95, 4.90, 4.90, 'Trisha designed clean dimensional schemas and automated data quality checks that strengthened our analytics pipeline.', '2026-10-28'),
(21, 18, 'adviser_to_hte',        'adviser',  'Dr. Lorna M. Macapagal, PCpE',                  4.85, 4.90, 4.95, 4.90, 'All 300 practicum hours and data engineering deliverables verified. Cleared for graduation requirements.', '2026-10-30'),
(22, 20, 'supervisor_to_student', 'employer', 'Ms. Hannah G. Soriano (Azeus Systems)',         4.90, 4.95, 4.95, 4.93, 'Alyssa automated 45 end-to-end Cypress regression specs and significantly improved nightly build stability.', '2026-10-29'),
(23, 20, 'adviser_to_hte',        'adviser',  'Engr. Christian Paul D. Vergara, MSc',          4.90, 4.90, 5.00, 4.93, 'Completed 304 hours with strong QA automation output. Approved for OJT clearance.', '2026-10-30'),
(24, 11, 'supervisor_to_student', 'employer', 'Engr. Dennis A. Villareal (Smart / PLDT)',      4.80, 4.90, 4.85, 4.85, 'Mid-term evaluation: Raphael is performing very well in 5G core and optical transport validation.', '2026-10-30'),
(25, 17, 'supervisor_to_student', 'employer', 'Engr. Teresa L. Valenzuela (Analog Devices)',   4.90, 4.85, 4.95, 4.90, 'Mid-term evaluation: Christian demonstrated strong Verilog HDL and Vivado timing closure skills.', '2026-11-02'),
(26, 22, 'supervisor_to_student', 'employer', 'Ms. Katrina S. Policarpio (Yondu)',             4.90, 5.00, 4.95, 4.95, 'Samantha built our reusable React component library and Storybook documentation; only 24 hours remaining.', '2026-11-03'),
(27, 24, 'supervisor_to_student', 'employer', 'Dr. Kenneth Y. Lim (Samsung R&D)',              4.95, 4.90, 4.95, 4.93, 'Katrina resolved 6 Android CTS camera test cases and optimized HAL3 frame latency; 8 hours remaining.', '2026-11-04'),
(28, 2,  'student_to_supervisor', 'student',  'Calangian, Emmanuel G.',                        4.95, 4.90, 5.00, 4.95, 'Mr. Carlo J. Pangilinan provided clear architecture reviews and backend optimization mentorship.', '2026-10-28'),
(29, 2,  'student_to_adviser',    'student',  'Calangian, Emmanuel G.',                        4.95, 4.95, 5.00, 4.97, 'Engr. Dela Cruz guided all DTR deliverables and capstone alignment weekly.', '2026-10-28'),
(30, 6,  'student_to_supervisor', 'student',  'Villanueva, Clarisse Anne T.',                  4.95, 5.00, 4.95, 4.97, 'Dr. Kenneth Y. Lim mentored RTL verification best practices consistently.', '2026-10-28'),
(31, 6,  'student_to_adviser',    'student',  'Villanueva, Clarisse Anne T.',                  4.95, 4.95, 5.00, 4.97, 'Dr. Bautista monitored progress closely and checked laboratory reports promptly.', '2026-10-28'),
(32, 9,  'student_to_supervisor', 'student',  'Alcantara, Justine Mark D.',                    4.90, 4.95, 4.95, 4.93, 'Engr. Salazar provided hands-on ATE probe instrumentation coaching.', '2026-10-28'),
(33, 9,  'student_to_adviser',    'student',  'Alcantara, Justine Mark D.',                    4.90, 4.95, 4.95, 4.93, 'Engr. Tolentino checked semiconductor compliance logs consistently.', '2026-10-28'),
(34, 10, 'student_to_supervisor', 'student',  'Pascual, Bea Katrina S.',                       4.95, 4.95, 5.00, 4.97, 'Engr. Ilagan gave constructive API scalability feedback every sprint.', '2026-10-29'),
(35, 10, 'student_to_adviser',    'student',  'Pascual, Bea Katrina S.',                       4.95, 4.95, 5.00, 4.97, 'Engr. Dela Cruz endorsed verification milestones on schedule.', '2026-10-29'),
(36, 12, 'student_to_supervisor', 'student',  'Evangelista, Hannah Camille B.',                4.90, 4.95, 4.95, 4.93, 'Engr. Taniguchi taught strict DRC/LVS verification workflows.', '2026-10-29'),
(37, 12, 'student_to_adviser',    'student',  'Evangelista, Hannah Camille B.',                4.90, 4.90, 5.00, 4.93, 'Engr. Tolentino supported HTE coordination throughout the term.', '2026-10-29'),
(38, 13, 'student_to_supervisor', 'student',  'Bautista, John Paul V.',                        4.85, 4.90, 4.95, 4.90, 'Ms. Policarpio guided full-stack PR reviews and CI pipelines.', '2026-11-03'),
(39, 13, 'student_to_adviser',    'student',  'Bautista, John Paul V.',                        4.85, 4.90, 4.95, 4.90, 'Dr. Macapagal provided clear practicum documentation guidance.', '2026-11-03'),
(40, 14, 'student_to_supervisor', 'student',  'Castillo, Angelica Joy M.',                     4.95, 5.00, 5.00, 4.98, 'Engr. Manansala shared threat hunting workflows and YARA feedback.', '2026-10-28'),
(41, 14, 'student_to_adviser',    'student',  'Castillo, Angelica Joy M.',                     4.95, 4.95, 5.00, 4.97, 'Dr. Macapagal validated research milestones and compliance reports.', '2026-10-28'),
(42, 16, 'student_to_supervisor', 'student',  'Aquino, Danielle Faith R.',                     4.90, 4.90, 4.95, 4.92, 'Engr. Ilagan reviewed Kubernetes IaC rollouts thoroughly.', '2026-10-29'),
(43, 16, 'student_to_adviser',    'student',  'Aquino, Danielle Faith R.',                     4.90, 4.95, 4.95, 4.93, 'Dr. Bautista checked HTE site visits and attendance verification.', '2026-10-29'),
(44, 18, 'student_to_supervisor', 'student',  'Ocampo, Trisha Nicole G.',                      4.90, 4.95, 4.90, 4.92, 'Mr. Pangilinan structured weekly ETL quality walkthroughs.', '2026-10-29'),
(45, 18, 'student_to_adviser',    'student',  'Ocampo, Trisha Nicole G.',                      4.90, 4.90, 4.95, 4.92, 'Dr. Macapagal confirmed endorsement readiness ahead of deadline.', '2026-10-29'),
(46, 20, 'student_to_supervisor', 'student',  'Mercado, Alyssa Marie F.',                      4.90, 4.95, 4.95, 4.93, 'Ms. Soriano coached Cypress regression design and QA triaging.', '2026-10-29'),
(47, 20, 'student_to_adviser',    'student',  'Mercado, Alyssa Marie F.',                      4.90, 4.90, 5.00, 4.93, 'Engr. Vergara guided weekly accomplishment reviews effectively.', '2026-10-29');

-- 8. Run initial synchronization for all ComplianceReports
CALL sp_sync_all_compliance_reports();
