<?php
declare(strict_types=1);

/**
 * Metropolitan Institute of Technology — Computer Engineering Department
 * Internship / OJT Tracking and Employer Database System
 *
 * Unified REST API Controller
 */

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token, X-Verify-Token, X-Verify-Placement, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';

function jsonResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function resolveUploadDir(string $subdir): string
{
    $safeSubdir = trim($subdir, '/\\');
    $defaultBase = __DIR__ . '/../../public/uploads';
    $useTemp = (getenv('DB_SQLITE_PATH') !== false && trim((string)getenv('DB_SQLITE_PATH')) !== '')
        || !is_writable(is_dir($defaultBase) ? $defaultBase : dirname($defaultBase));
    $dir = $useTemp
        ? rtrim(sys_get_temp_dir(), '/\\') . '/practicly_uploads/' . $safeSubdir
        : $defaultBase . '/' . $safeSubdir;
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    return $dir;
}

function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return $_POST ?: [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function computeHoursFromTimes(string $timeIn, string $timeOut, int $breakMinutes = 60, ?float $explicitHours = null): float
{
    if ($explicitHours !== null && $explicitHours > 0) {
        return round($explicitHours, 2);
    }
    $inParts  = explode(':', $timeIn);
    $outParts = explode(':', $timeOut);
    if (count($inParts) < 2 || count($outParts) < 2) {
        return 8.00;
    }
    $inMinutes  = ((int)$inParts[0] * 60) + (int)$inParts[1];
    $outMinutes = ((int)$outParts[0] * 60) + (int)$outParts[1];
    if ($outMinutes <= $inMinutes) {
        $outMinutes += 24 * 60;
    }
    $netMinutes = max(0, ($outMinutes - $inMinutes) - max(0, $breakMinutes));
    return round($netMinutes / 60, 2);
}

function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string|false
{
    $pad = strlen($data) % 4;
    if ($pad > 0) {
        $data .= str_repeat('=', 4 - $pad);
    }
    return base64_decode(strtr($data, '-_', '+/'), true);
}

function getHeaderValue(string $headerName): string
{
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $headerName));
    if (!empty($_SERVER[$serverKey])) {
        return trim((string)$_SERVER[$serverKey]);
    }
    $redirectKey = 'REDIRECT_' . $serverKey;
    if (!empty($_SERVER[$redirectKey])) {
        return trim((string)$_SERVER[$redirectKey]);
    }
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strcasecmp((string)$k, $headerName) === 0) {
                return trim((string)$v);
            }
        }
    }
    return '';
}

function getAppSecret(PDO $pdo): string
{
    static $cachedSecret = null;
    if ($cachedSecret !== null) {
        return $cachedSecret;
    }

    $pdo->exec('CREATE TABLE IF NOT EXISTS AppSecret (id INTEGER PRIMARY KEY, secret TEXT NOT NULL)');
    $row = $pdo->query('SELECT secret FROM AppSecret WHERE id = 1 LIMIT 1')->fetchColumn();
    if (is_string($row) && strlen($row) >= 32) {
        $cachedSecret = $row;
        return $cachedSecret;
    }

    $secret = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare('INSERT INTO AppSecret (id, secret) VALUES (1, :sec)');
    try {
        $stmt->execute([':sec' => $secret]);
    } catch (Throwable $e) {
        $existing = $pdo->query('SELECT secret FROM AppSecret WHERE id = 1 LIMIT 1')->fetchColumn();
        if (is_string($existing) && strlen($existing) >= 32) {
            $cachedSecret = $existing;
            return $cachedSecret;
        }
    }
    $cachedSecret = $secret;
    return $cachedSecret;
}

function issueAuthToken(PDO $pdo, array $user): string
{
    $secret = getAppSecret($pdo);
    $payload = [
        'uid' => (int)$user['user_id'],
        'role' => (string)$user['role'],
        'exp' => time() + (86400 * 7),
    ];
    $encoded = base64UrlEncode((string)json_encode($payload));
    $sig = base64UrlEncode(hash_hmac('sha256', $encoded, $secret, true));
    return $encoded . '.' . $sig;
}

function generateVerifyToken(PDO $pdo, int $placementId): string
{
    $secret = getAppSecret($pdo);
    return substr(hash_hmac('sha256', 'verify:placement:' . $placementId, $secret), 0, 32);
}

function isValidVerifyToken(PDO $pdo, int $placementId, string $token): bool
{
    if ($placementId <= 0 || $token === '') {
        return false;
    }
    return hash_equals(generateVerifyToken($pdo, $placementId), $token);
}

function authenticateRequest(PDO $pdo): ?array
{
    static $resolved = false;
    static $cachedUser = null;
    if ($resolved) {
        return $cachedUser;
    }
    $resolved = true;

    $rawHeader = getHeaderValue('Authorization');
    $token = '';
    if (stripos($rawHeader, 'Bearer ') === 0) {
        $token = trim(substr($rawHeader, 7));
    }
    if ($token === '') {
        $token = getHeaderValue('X-Auth-Token');
    }
    if ($token === '' || strpos($token, '.') === false) {
        return null;
    }

    [$encoded, $sig] = explode('.', $token, 2);
    if ($encoded === '' || $sig === '') {
        return null;
    }

    $secret = getAppSecret($pdo);
    $expected = base64UrlEncode(hash_hmac('sha256', $encoded, $secret, true));
    if (!hash_equals($expected, $sig)) {
        return null;
    }

    $json = base64UrlDecode($encoded);
    if ($json === false) {
        return null;
    }
    $payload = json_decode($json, true);
    if (!is_array($payload) || empty($payload['uid']) || empty($payload['exp'])) {
        return null;
    }
    if ((int)$payload['exp'] < time()) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT user_id, username, role, linked_id, is_active FROM Users WHERE user_id = :uid LIMIT 1');
    $stmt->execute([':uid' => (int)$payload['uid']]);
    $user = $stmt->fetch();
    if (!$user || (int)$user['is_active'] !== 1) {
        return null;
    }

    $cachedUser = $user;
    return $cachedUser;
}

function requireAuth(PDO $pdo, array $allowedRoles = []): array
{
    $user = authenticateRequest($pdo);
    if (!$user) {
        jsonResponse(['ok' => false, 'error' => 'Authentication required. Please sign in to continue.'], 401);
    }
    if ($allowedRoles !== [] && !in_array($user['role'], $allowedRoles, true)) {
        jsonResponse(['ok' => false, 'error' => 'Forbidden: your role (' . $user['role'] . ') cannot perform this action.'], 403);
    }
    return $user;
}

function getVerifiedPlacementFromRequest(PDO $pdo, ?int $expectedPlacementId = null): ?int
{
    $token = trim((string)(getHeaderValue('X-Verify-Token') ?: ($_GET['token'] ?? '')));
    $pidRaw = getHeaderValue('X-Verify-Placement') ?: ($_GET['verify'] ?? ($_GET['placement_id'] ?? ''));
    $pid = is_numeric($pidRaw) ? (int)$pidRaw : ($expectedPlacementId ?? 0);
    if ($expectedPlacementId !== null && $pid !== $expectedPlacementId) {
        return null;
    }
    if ($pid > 0 && isValidVerifyToken($pdo, $pid, $token)) {
        return $pid;
    }
    return null;
}

function getPlacementOwners(PDO $pdo, int $placementId): ?array
{
    $stmt = $pdo->prepare('SELECT placement_id, student_id, employer_id, adviser_id FROM Placement WHERE placement_id = :pid LIMIT 1');
    $stmt->execute([':pid' => $placementId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function assertEntityExists(PDO $pdo, string $table, string $pkColumn, int $id, string $label): void
{
    $stmt = $pdo->prepare("SELECT 1 FROM {$table} WHERE {$pkColumn} = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetchColumn()) {
        jsonResponse(['ok' => false, 'error' => "Referenced {$label} (#{$id}) does not exist."], 400);
    }
}

function validateLinkedIdForRole(PDO $pdo, string $role, ?int $linkedId): void
{
    if ($linkedId === null) {
        return;
    }
    if ($linkedId <= 0) {
        jsonResponse(['ok' => false, 'error' => 'linked_id must be a positive record identifier.'], 400);
    }
    if ($role === 'student') {
        assertEntityExists($pdo, 'Student', 'student_id', $linkedId, 'Student');
    } elseif ($role === 'adviser') {
        assertEntityExists($pdo, 'Adviser', 'adviser_id', $linkedId, 'Adviser');
    } elseif ($role === 'supervisor') {
        assertEntityExists($pdo, 'Employer', 'employer_id', $linkedId, 'Employer/HTE');
    }
}

try {
    $pdo = Database::getConnection();
} catch (Throwable $e) {
    $driver = Database::getDriver();
    jsonResponse([
        'ok'      => false,
        'error'   => 'Database connection error: ' . $e->getMessage(),
        'details' => $driver === 'sqlite'
            ? 'Ensure database/ojt_tracking.db is accessible.'
            : 'Ensure XAMPP MySQL is running on port 3306.'
    ], 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

// Normalize route path whether accessed via /api/foo or /backend/api/index.php?route=foo
$route = $_GET['route'] ?? $uri;
$route = preg_replace('#^.*/api/?#', '', $route);
$route = trim((string)$route, '/');
$segments = $route === '' ? [] : explode('/', $route);
$resource = $segments[0] ?? 'bootstrap';
$resourceId = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$subAction  = $segments[1] ?? null;

try {
    // =========================================================================
    // 0A. PUBLIC CATALOG FOR SIGN-IN & REGISTRATION (NO PII / NO AUTH NEEDED)
    // =========================================================================
    if ($method === 'GET' && $resource === 'public-catalog') {
        $employers = $pdo->query("
            SELECT employer_id, company_name, industry, moa_status
            FROM Employer
            ORDER BY company_name ASC
        ")->fetchAll();
        $advisers = $pdo->query("
            SELECT adviser_id, full_name, department
            FROM Adviser
            ORDER BY full_name ASC
        ")->fetchAll();
        $placementCount = (int)$pdo->query("SELECT COUNT(*) FROM Placement")->fetchColumn();
        $firstPlacementId = (int)($pdo->query("SELECT placement_id FROM Placement ORDER BY placement_id ASC LIMIT 1")->fetchColumn() ?: 1);

        jsonResponse([
            'ok'                 => true,
            'employers'          => $employers,
            'advisers'           => $advisers,
            'first_placement_id' => $firstPlacementId,
            'counts'             => [
                'employers'  => count($employers),
                'advisers'   => count($advisers),
                'placements' => $placementCount,
            ],
        ]);
    }

    // =========================================================================
    // 0B. PUBLIC / SCOPED SUPERVISOR VERIFICATION PORTAL (GET /api/verify/{id})
    // =========================================================================
    if ($method === 'GET' && $resource === 'verify') {
        $targetPid = $resourceId ?: (int)($_GET['placement_id'] ?? $_GET['verify'] ?? 1);
        if ($targetPid <= 0) {
            $targetPid = 1;
        }
        Database::syncCompliance($pdo, $targetPid);

        $pStmt = $pdo->prepare('SELECT * FROM vw_placement_progress WHERE placement_id = :pid LIMIT 1');
        $pStmt->execute([':pid' => $targetPid]);
        $placement = $pStmt->fetch();
        if (!$placement) {
            jsonResponse(['ok' => false, 'error' => 'Placement verification link not found.'], 404);
        }

        $caller = authenticateRequest($pdo);
        $verifiedPid = getVerifiedPlacementFromRequest($pdo, $targetPid);
        $canSubmit = ($verifiedPid === $targetPid)
            || ($caller && in_array($caller['role'], ['admin', 'adviser'], true))
            || ($caller && $caller['role'] === 'supervisor' && (int)$caller['linked_id'] === (int)$placement['employer_id']);

        $placement['can_submit'] = $canSubmit;
        if ($canSubmit) {
            $placement['verify_token'] = generateVerifyToken($pdo, $targetPid);
        } else {
            // Read-only anonymous preview: redact personal email & raw base64 document blobs
            $placement['student_email'] = null;
            $placement['signed_dtr_data'] = null;
            $placement['signed_eval_data'] = null;
        }

        $tlStmt = $pdo->prepare("
            SELECT tl.*, s.full_name AS student_name, s.student_number, e.company_name
            FROM TimeLog tl
            INNER JOIN Placement p ON tl.placement_id = p.placement_id
            INNER JOIN Student s ON p.student_id = s.student_id
            INNER JOIN Employer e ON p.employer_id = e.employer_id
            WHERE tl.placement_id = :pid
            ORDER BY tl.date DESC, tl.log_id DESC
        ");
        $tlStmt->execute([':pid' => $targetPid]);
        $timelogs = $tlStmt->fetchAll();

        $evStmt = $pdo->prepare("
            SELECT ev.*, s.full_name AS student_name, e.company_name
            FROM Evaluation ev
            INNER JOIN Placement p ON ev.placement_id = p.placement_id
            INNER JOIN Student s ON p.student_id = s.student_id
            INNER JOIN Employer e ON p.employer_id = e.employer_id
            WHERE ev.placement_id = :pid
              AND (ev.instrument_type = 'supervisor_to_student' OR ev.evaluator_type = 'employer')
            ORDER BY ev.date_evaluated DESC, ev.eval_id DESC
        ");
        $evStmt->execute([':pid' => $targetPid]);
        $evaluations = $evStmt->fetchAll();

        jsonResponse([
            'ok'          => true,
            'can_submit'  => $canSubmit,
            'placement'   => $placement,
            'timelogs'    => $timelogs,
            'evaluations' => $evaluations,
        ]);
    }

    // =========================================================================
    // 1. BOOTSTRAP / FULL SYSTEM STATE (AUTHENTICATED & ROLE-SCOPED)
    // =========================================================================
    if ($method === 'GET' && in_array($resource, ['bootstrap', 'dashboard', ''], true)) {
        $caller = requireAuth($pdo);
        $callerRole = (string)$caller['role'];
        $callerLinkedId = $caller['linked_id'] !== null ? (int)$caller['linked_id'] : null;

        // Ensure all compliance reports are synchronized
        Database::syncAllCompliance($pdo);

        // Fetch Placements Progress View (Student + Employer + Adviser + SUM(TimeLog) + Evaluation + ComplianceReport)
        $placements = $pdo->query("
            SELECT * FROM vw_placement_progress
            ORDER BY
                CASE status
                    WHEN 'ongoing' THEN 1
                    WHEN 'completed' THEN 2
                    WHEN 'dropped' THEN 3
                END,
                student_name ASC
        ")->fetchAll();

        // Fetch Students with latest placement reference
        $students = $pdo->query("
            SELECT
                s.*,
                vp.placement_id,
                vp.company_name,
                vp.adviser_name,
                vp.required_hours,
                vp.total_hours_completed,
                vp.completion_percentage,
                vp.status AS placement_status,
                vp.requirement_met,
                vp.clearance_reference,
                vp.has_online_employer_eval,
                vp.has_signed_eval,
                vp.has_employer_eval,
                vp.has_adviser_eval,
                vp.has_student_supervisor_eval,
                vp.has_student_adviser_eval,
                vp.completed_instruments_count,
                vp.signed_eval_filename
            FROM Student s
            LEFT JOIN vw_placement_progress vp ON s.student_id = vp.student_id
            ORDER BY s.full_name ASC
        ")->fetchAll();

        // Fetch Employers Analytics View
        $employers = $pdo->query("
            SELECT * FROM vw_employer_analytics
            ORDER BY company_name ASC
        ")->fetchAll();

        // Fetch Advisers Monitoring View
        $advisers = $pdo->query("
            SELECT * FROM vw_adviser_monitoring
            ORDER BY full_name ASC
        ")->fetchAll();

        // Fetch TimeLogs with Student & Employer metadata
        $timelogs = $pdo->query("
            SELECT
                tl.*,
                s.student_id,
                s.student_number,
                s.full_name AS student_name,
                s.section,
                e.company_name,
                p.required_hours,
                p.adviser_id
            FROM TimeLog tl
            INNER JOIN Placement p ON tl.placement_id = p.placement_id
            INNER JOIN Student s ON p.student_id = s.student_id
            INNER JOIN Employer e ON p.employer_id = e.employer_id
            ORDER BY tl.date DESC, tl.log_id DESC
        ")->fetchAll();

        // Fetch Evaluations with Student, Employer, Adviser metadata
        $evaluations = $pdo->query("
            SELECT
                ev.*,
                s.student_id,
                s.student_number,
                s.full_name AS student_name,
                s.section,
                e.company_name,
                a.full_name AS adviser_name,
                p.academic_term,
                p.adviser_id
            FROM Evaluation ev
            INNER JOIN Placement p ON ev.placement_id = p.placement_id
            INNER JOIN Student s ON p.student_id = s.student_id
            INNER JOIN Employer e ON p.employer_id = e.employer_id
            INNER JOIN Adviser a ON p.adviser_id = a.adviser_id
            ORDER BY ev.date_evaluated DESC, ev.eval_id DESC
        ")->fetchAll();

        // Fetch Compliance Reports joined with full placement progress
        $complianceReports = $pdo->query("
            SELECT
                cr.report_id,
                cr.placement_id,
                cr.total_hours_completed,
                cr.requirement_met,
                cr.has_employer_eval,
                cr.has_adviser_eval,
                cr.has_student_supervisor_eval,
                cr.has_student_adviser_eval,
                cr.average_rating,
                cr.clearance_reference,
                cr.generated_date,
                vp.student_id,
                vp.student_number,
                vp.student_name,
                vp.program,
                vp.year_level,
                vp.section,
                vp.student_email,
                vp.company_name,
                vp.industry,
                vp.company_contact_person,
                vp.adviser_id,
                vp.adviser_name,
                vp.adviser_code,
                vp.academic_term,
                vp.position_title,
                vp.start_date,
                vp.end_date,
                vp.required_hours,
                vp.hours_remaining,
                vp.completion_percentage,
                vp.total_log_days,
                vp.evaluation_count,
                vp.has_online_employer_eval,
                vp.has_signed_eval,
                vp.signed_eval_file,
                vp.signed_eval_filename,
                vp.signed_eval_uploaded_at,
                vp.signed_eval_notes,
                vp.signed_eval_data,
                vp.completed_instruments_count,
                vp.employer_rating,
                vp.adviser_rating,
                vp.student_supervisor_rating,
                vp.student_adviser_rating,
                vp.status AS placement_status
            FROM ComplianceReport cr
            INNER JOIN vw_placement_progress vp ON cr.placement_id = vp.placement_id
            ORDER BY cr.requirement_met DESC, vp.completion_percentage DESC, vp.student_name ASC
        ")->fetchAll();

        $users = [];
        if ($callerRole === 'admin') {
            // Fetch Users with linked profile names ONLY for administrators (never expose password_hash)
            $usersStmt = $pdo->prepare("
                SELECT
                    u.user_id,
                    u.username,
                    u.role,
                    u.linked_id,
                    u.is_active,
                    u.last_login,
                    u.created_at,
                    CASE WHEN u.password_hash = :defhash THEN 0 ELSE 1 END AS has_custom_password,
                    CASE
                        WHEN u.role = 'student' THEN s.full_name
                        WHEN u.role = 'adviser' THEN a.full_name
                        WHEN u.role = 'supervisor' THEN emp.contact_person
                        ELSE 'MIT CpE System Administrator'
                    END AS display_name,
                    CASE
                        WHEN u.role = 'student' THEN s.student_number
                        WHEN u.role = 'adviser' THEN a.employee_number
                        WHEN u.role = 'supervisor' THEN 'HTE-SUPV-' || printf('%03d', emp.employer_id)
                        ELSE 'ADMIN-ROOT'
                    END AS identifier_code,
                    CASE
                        WHEN u.role = 'student' THEN s.section
                        WHEN u.role = 'adviser' THEN a.department
                        WHEN u.role = 'supervisor' THEN emp.company_name
                        ELSE 'College of Engineering — CpE Dept'
                    END AS unit_label
                FROM Users u
                LEFT JOIN Student s ON u.role = 'student' AND u.linked_id = s.student_id
                LEFT JOIN Adviser a ON u.role = 'adviser' AND u.linked_id = a.adviser_id
                LEFT JOIN Employer emp ON u.role = 'supervisor' AND u.linked_id = emp.employer_id
                ORDER BY CASE u.role WHEN 'admin' THEN 1 WHEN 'supervisor' THEN 2 WHEN 'adviser' THEN 3 WHEN 'student' THEN 4 ELSE 5 END, u.user_id ASC
            ");
            $usersStmt->execute([':defhash' => '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO']);
            $users = $usersStmt->fetchAll();
        }

        // Strict Role & Ownership Filtering
        if ($callerRole === 'student') {
            $placements = array_values(array_filter($placements, fn($p) => (int)$p['student_id'] === $callerLinkedId));
            $allowedPids = array_flip(array_map(fn($p) => (int)$p['placement_id'], $placements));
            $students = array_values(array_filter($students, fn($s) => (int)$s['student_id'] === $callerLinkedId));
            $timelogs = array_values(array_filter($timelogs, fn($t) => isset($allowedPids[(int)$t['placement_id']])));
            $evaluations = array_values(array_filter($evaluations, fn($ev) => isset($allowedPids[(int)$ev['placement_id']])));
            $complianceReports = array_values(array_filter($complianceReports, fn($cr) => isset($allowedPids[(int)$cr['placement_id']])));
        } elseif ($callerRole === 'supervisor') {
            $placements = array_values(array_filter($placements, fn($p) => (int)$p['employer_id'] === $callerLinkedId));
            $allowedPids = array_flip(array_map(fn($p) => (int)$p['placement_id'], $placements));
            $allowedSids = array_flip(array_map(fn($p) => (int)$p['student_id'], $placements));
            $students = array_values(array_filter($students, fn($s) => isset($allowedSids[(int)$s['student_id']])));
            $timelogs = array_values(array_filter($timelogs, fn($t) => isset($allowedPids[(int)$t['placement_id']])));
            $evaluations = array_values(array_filter(
                $evaluations,
                fn($ev) => isset($allowedPids[(int)$ev['placement_id']]) && $ev['evaluator_type'] === 'employer'
            ));
            $complianceReports = array_values(array_filter($complianceReports, fn($cr) => isset($allowedPids[(int)$cr['placement_id']])));
        }

        // Attach signed verification link token for authorized placements
        foreach ($placements as &$plItem) {
            $plItem['verify_token'] = generateVerifyToken($pdo, (int)$plItem['placement_id']);
        }
        unset($plItem);

        // Compute Executive Summary KPIs
        $totalHoursRendered = 0.0;
        $eligibleCount      = 0;
        $ongoingCount       = 0;
        $completedCount     = 0;
        $droppedCount       = 0;
        $ratingSum          = 0.0;
        $ratingCount        = 0;

        foreach ($placements as $pl) {
            $totalHoursRendered += (float)$pl['total_hours_completed'];
            if ((int)$pl['requirement_met'] === 1) {
                $eligibleCount++;
            }
            if ($pl['status'] === 'ongoing') {
                $ongoingCount++;
            } elseif ($pl['status'] === 'completed') {
                $completedCount++;
            } elseif ($pl['status'] === 'dropped') {
                $droppedCount++;
            }
            if ($pl['average_rating'] !== null) {
                $ratingSum += (float)$pl['average_rating'];
                $ratingCount++;
            }
        }

        $isSqlite = Database::getDriver() === 'sqlite';
        $engineVersion = $isSqlite
            ? ('SQLite ' . $pdo->query('SELECT sqlite_version()')->fetchColumn())
            : ('MySQL / MariaDB (' . $pdo->query('SELECT VERSION()')->fetchColumn() . ')');

        $tableCounts = [
            'Users'            => count($users),
            'Student'          => count($students),
            'Employer'         => count($employers),
            'Adviser'          => count($advisers),
            'Placement'        => count($placements),
            'TimeLog'          => count($timelogs),
            'Evaluation'       => count($evaluations),
            'ComplianceReport' => count($complianceReports),
        ];

        jsonResponse([
            'ok' => true,
            'system_info' => [
                'engine'        => $engineVersion,
                'database'      => $isSqlite ? 'ojt_tracking.db' : 'ojt_tracking_db',
                'department'    => 'Metropolitan Institute of Technology — Department of Computer Engineering',
                'campus'        => 'Sta. Mesa, Manila',
                'group'         => 'Group 8 (Balanag, Calangian, Gutierrez, Yadao)',
                'table_counts'  => $tableCounts,
                'synced_at'     => date('Y-m-d H:i:s'),
            ],
            'kpis' => [
                'total_students'       => count($students),
                'total_placements'     => count($placements),
                'ongoing_placements'   => $ongoingCount,
                'completed_placements' => $completedCount,
                'dropped_placements'   => $droppedCount,
                'eligible_for_clearance' => $eligibleCount,
                'total_employers'      => count($employers),
                'active_moa_employers' => count(array_filter($employers, fn($e) => $e['moa_status'] === 'active')),
                'total_advisers'       => count($advisers),
                'total_hours_rendered' => round($totalHoursRendered, 2),
                'total_timelogs'       => count($timelogs),
                'total_evaluations'    => count($evaluations),
                'average_rating'       => $ratingCount > 0 ? round($ratingSum / $ratingCount, 2) : 0.00,
            ],
            'placements'         => $placements,
            'students'           => $students,
            'employers'          => $employers,
            'advisers'           => $advisers,
            'timelogs'           => $timelogs,
            'evaluations'        => $evaluations,
            'compliance_reports' => $complianceReports,
            'users'              => $users,
        ]);
    }

    // =========================================================================
    // 2. AUTHENTICATION MODULE (POST /api/login)
    // =========================================================================
    if ($method === 'POST' && $resource === 'login') {
        $body             = getJsonBody();
        $username         = trim((string)($body['username'] ?? ''));
        $password         = (string)($body['password'] ?? '');
        $requestedSwitch  = !empty($body['switch_persona']);
        $caller           = authenticateRequest($pdo);
        $isAdminSwitch    = $requestedSwitch && $caller && $caller['role'] === 'admin';

        if ($username === '') {
            jsonResponse(['ok' => false, 'error' => 'Username, email, or student ID is required.'], 400);
        }
        if ($requestedSwitch && !$isAdminSwitch && $password === '') {
            jsonResponse(['ok' => false, 'error' => 'Unauthorized persona switch. Administrator credentials required.'], 401);
        }
        if (!$isAdminSwitch && $password === '') {
            jsonResponse(['ok' => false, 'error' => 'Password is required.'], 400);
        }

        $stmt = $pdo->prepare("
            SELECT
                u.*,
                CASE
                    WHEN u.role = 'student' THEN s.full_name
                    WHEN u.role = 'adviser' THEN a.full_name
                    WHEN u.role = 'supervisor' THEN emp.contact_person
                    ELSE 'MIT CpE System Administrator'
                END AS display_name,
                CASE
                    WHEN u.role = 'student' THEN s.student_number
                    WHEN u.role = 'adviser' THEN a.employee_number
                    WHEN u.role = 'supervisor' THEN 'HTE-SUPV-' || printf('%03d', emp.employer_id)
                    ELSE 'ADMIN-ROOT'
                END AS identifier_code,
                CASE
                    WHEN u.role = 'student' THEN s.section
                    WHEN u.role = 'adviser' THEN a.department
                    WHEN u.role = 'supervisor' THEN emp.company_name
                    ELSE 'Computer Engineering Department'
                END AS unit_label
            FROM Users u
            LEFT JOIN Student s ON u.role = 'student' AND u.linked_id = s.student_id
            LEFT JOIN Adviser a ON u.role = 'adviser' AND u.linked_id = a.adviser_id
            LEFT JOIN Employer emp ON u.role = 'supervisor' AND u.linked_id = emp.employer_id
            WHERE LOWER(TRIM(u.username)) = LOWER(:uname)
               OR (u.role = 'student' AND (LOWER(TRIM(s.email)) = LOWER(:uname) OR LOWER(TRIM(s.student_number)) = LOWER(:uname)))
               OR (u.role = 'adviser' AND (LOWER(TRIM(a.email)) = LOWER(:uname) OR LOWER(TRIM(a.employee_number)) = LOWER(:uname)))
               OR (u.role = 'supervisor' AND LOWER(TRIM(emp.email)) = LOWER(:uname))
            ORDER BY CASE WHEN LOWER(TRIM(u.username)) = LOWER(:uname) THEN 0 ELSE 1 END
            LIMIT 1
        ");
        $stmt->execute([':uname' => $username]);
        $user = $stmt->fetch();

        if (!$user) {
            jsonResponse(['ok' => false, 'error' => 'Invalid username/email or password.'], 401);
        }

        if ((int)$user['is_active'] === 0) {
            jsonResponse(['ok' => false, 'error' => 'This user account is pending coordinator activation or currently disabled.'], 403);
        }

        $storedHash = (string)$user['password_hash'];
        $passwordValid = $isAdminSwitch
            || (str_starts_with($storedHash, '$2') ? password_verify($password, $storedHash) : ($password === $storedHash));
        if (!$passwordValid) {
            jsonResponse(['ok' => false, 'error' => 'Invalid username/email or password.'], 401);
        }

        $pdo->prepare('UPDATE Users SET last_login = NOW() WHERE user_id = :uid')
            ->execute([':uid' => $user['user_id']]);

        $token = issueAuthToken($pdo, $user);
        unset($user['password_hash']);

        jsonResponse([
            'ok'    => true,
            'token' => $token,
            'user'  => $user,
        ]);
    }

    // =========================================================================
    // 2B. SELF-REGISTRATION MODULE (POST /api/register)
    // =========================================================================
    if ($method === 'POST' && $resource === 'register') {
        $body          = getJsonBody();
        $role          = strtolower(trim((string)($body['role'] ?? 'student')));
        if (!in_array($role, ['student', 'adviser'], true)) {
            jsonResponse(['ok' => false, 'error' => 'Self-registration is only open to student interns and faculty advisers.'], 403);
        }

        $fullName      = trim((string)($body['full_name'] ?? ''));
        $email         = trim((string)($body['email'] ?? ''));
        $contactNumber = trim((string)($body['contact_number'] ?? ''));
        $username      = trim((string)($body['username'] ?? ''));
        $rawPassword   = array_key_exists('password', $body) ? (string)$body['password'] : '';
        $password      = $rawPassword;

        if ($fullName === '' || $email === '' || $username === '') {
            jsonResponse(['ok' => false, 'error' => 'Full name, institutional email, and username are required.'], 400);
        }
        if (trim($rawPassword) === '') {
            jsonResponse(['ok' => false, 'error' => 'Password is required and cannot be empty or whitespace.'], 400);
        }

        $checkUser = $pdo->prepare('SELECT COUNT(*) FROM Users WHERE LOWER(TRIM(username)) = LOWER(:u)');
        $checkUser->execute([':u' => $username]);
        if ((int)$checkUser->fetchColumn() > 0) {
            jsonResponse(['ok' => false, 'error' => 'That username is already taken.'], 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);

        if ($role === 'adviser') {
            $employeeNumber = trim((string)($body['employee_number'] ?? ''));
            if ($employeeNumber === '') {
                $employeeNumber = sprintf('ADV-%s-%04d', date('Y'), random_int(1000, 9999));
            }
            $department = trim((string)($body['department'] ?? ($body['section'] ?? 'General Academic Department'))) ?: 'General Academic Department';

            $checkAdv = $pdo->prepare('SELECT COUNT(*) FROM Adviser WHERE LOWER(TRIM(employee_number)) = LOWER(:eno) OR LOWER(TRIM(email)) = LOWER(:em)');
            $checkAdv->execute([':eno' => $employeeNumber, ':em' => $email]);
            if ((int)$checkAdv->fetchColumn() > 0) {
                jsonResponse(['ok' => false, 'error' => 'Employee number or email is already registered in the Adviser directory.'], 409);
            }

            $aStmt = $pdo->prepare("
                INSERT INTO Adviser (employee_number, full_name, department, email, contact_number)
                VALUES (:eno, :fname, :dept, :em, :cnum)
            ");
            $aStmt->execute([
                ':eno'   => $employeeNumber,
                ':fname' => $fullName,
                ':dept'  => $department,
                ':em'    => $email,
                ':cnum'  => $contactNumber !== '' ? $contactNumber : '0917-555-0100',
            ]);
            $newAdviserId = (int)$pdo->lastInsertId();

            // Create faculty adviser account in pending coordinator-approval state (is_active = 0) to prevent unauthorized privilege escalation.
            $uStmt = $pdo->prepare("
                INSERT INTO Users (username, password_hash, role, linked_id, is_active)
                VALUES (:u, :h, 'adviser', :lid, 0)
            ");
            $uStmt->execute([
                ':u'   => $username,
                ':h'   => $hash,
                ':lid' => $newAdviserId,
            ]);
            $newUserId = (int)$pdo->lastInsertId();

            jsonResponse([
                'ok'               => true,
                'pending_approval' => true,
                'message'          => 'Faculty Adviser account request submitted. Ask your Practicum Coordinator to activate it under User Accounts before signing in.',
                'user'             => [
                    'user_id'         => $newUserId,
                    'username'        => $username,
                    'role'            => 'adviser',
                    'linked_id'       => $newAdviserId,
                    'is_active'       => 0,
                    'display_name'    => $fullName,
                    'identifier_code' => $employeeNumber,
                    'unit_label'      => $department,
                ],
            ], 201);
        }

        $studentNumber = trim((string)($body['student_number'] ?? ''));
        $section       = trim((string)($body['section'] ?? 'BSCpE 4-1'));
        if ($studentNumber === '') {
            $studentNumber = sprintf('2023-%05d-MN-0', random_int(300, 999));
        }

        $checkStu = $pdo->prepare('SELECT COUNT(*) FROM Student WHERE LOWER(TRIM(student_number)) = LOWER(:sn) OR LOWER(TRIM(email)) = LOWER(:em)');
        $checkStu->execute([':sn' => $studentNumber, ':em' => $email]);
        if ((int)$checkStu->fetchColumn() > 0) {
            jsonResponse(['ok' => false, 'error' => 'Student number or email is already registered.'], 409);
        }

        $program   = trim((string)($body['program'] ?? 'BS Computer Engineering')) ?: 'BS Computer Engineering';
        $yearLevel = trim((string)($body['year_level'] ?? '4th Year')) ?: '4th Year';

        $stmt = $pdo->prepare("
            INSERT INTO Student (student_number, full_name, program, year_level, section, email, contact_number)
            VALUES (:snum, :fname, :prog, :yr, :sec, :em, :cnum)
        ");
        $stmt->execute([
            ':snum'  => $studentNumber,
            ':fname' => $fullName,
            ':prog'  => $program,
            ':yr'    => $yearLevel,
            ':sec'   => $section,
            ':em'    => $email,
            ':cnum'  => $contactNumber !== '' ? $contactNumber : '0917-555-0100',
        ]);
        $newStudentId = (int)$pdo->lastInsertId();

        $uStmt = $pdo->prepare("
            INSERT INTO Users (username, password_hash, role, linked_id, is_active, last_login)
            VALUES (:u, :h, 'student', :lid, 1, NOW())
        ");
        $uStmt->execute([
            ':u'   => $username,
            ':h'   => $hash,
            ':lid' => $newStudentId,
        ]);
        $newUserId = (int)$pdo->lastInsertId();

        if (!empty($body['employer_id'])) {
            $empId = (int)$body['employer_id'];
            $advId = !empty($body['adviser_id'])
                ? (int)$body['adviser_id']
                : (int)($pdo->query('SELECT adviser_id FROM Adviser ORDER BY adviser_id ASC LIMIT 1')->fetchColumn() ?: 1);
            $pos   = trim((string)($body['position_title'] ?? 'Intern Trainee'));
            $pStmt = $pdo->prepare("
                INSERT INTO Placement (student_id, employer_id, adviser_id, academic_term, position_title, start_date, end_date, required_hours, status)
                VALUES (:sid, :eid, :aid, 'AY 2026-2027 1st Sem', :pos, :sdate, :edate, 300.00, 'ongoing')
            ");
            $pStmt->execute([
                ':sid'   => $newStudentId,
                ':eid'   => $empId,
                ':aid'   => $advId,
                ':pos'   => $pos,
                ':sdate' => date('Y-m-d'),
                ':edate' => date('Y-m-d', strtotime('+90 days')),
            ]);
            $newPlacementId = (int)$pdo->lastInsertId();
            Database::syncCompliance($pdo, $newPlacementId);
        }

        $regUserPayload = [
            'user_id'         => $newUserId,
            'username'        => $username,
            'role'            => 'student',
            'linked_id'       => $newStudentId,
            'is_active'       => 1,
            'display_name'    => $fullName,
            'identifier_code' => $studentNumber,
            'unit_label'      => $section,
        ];
        jsonResponse([
            'ok'      => true,
            'message' => 'Student account registered and signed in.',
            'token'   => issueAuthToken($pdo, $regUserPayload),
            'user'    => $regUserPayload,
        ], 201);
    }

    // =========================================================================
    // 3. TIME LOG MODULE (Core Aggregation Module: POST / PUT / DELETE /api/timelogs)
    // =========================================================================
    if ($resource === 'timelogs') {
        if ($method === 'POST' && $subAction === 'approve-all') {
            $body = getJsonBody();
            $placementId = !empty($body['placement_id']) ? (int)$body['placement_id'] : null;
            $adviserId = !empty($body['adviser_id']) ? (int)$body['adviser_id'] : null;
            $employerId = !empty($body['employer_id']) ? (int)$body['employer_id'] : null;
            $targetStatus = !empty($body['target_status']) && in_array($body['target_status'], ['approved', 'supervisor_verified', 'pending', 'flagged'], true)
                ? $body['target_status']
                : 'approved';
            $fromStatus = !empty($body['from_status']) && in_array($body['from_status'], ['approved', 'supervisor_verified', 'pending', 'flagged'], true)
                ? $body['from_status']
                : null;

            $caller = authenticateRequest($pdo);
            $verifiedPid = getVerifiedPlacementFromRequest($pdo, $placementId);

            if ($verifiedPid !== null && !$caller) {
                // Signed supervisor verify link can ONLY supervisor-verify that single placement
                $placementId = $verifiedPid;
                $targetStatus = 'supervisor_verified';
                $adviserId = null;
                $employerId = null;
            } else {
                $caller = requireAuth($pdo, ['admin', 'adviser', 'supervisor']);
                if ($caller['role'] === 'supervisor') {
                    $targetStatus = 'supervisor_verified';
                    $adviserId = null;
                    if ($placementId) {
                        $owners = getPlacementOwners($pdo, $placementId);
                        if (!$owners || (int)$owners['employer_id'] !== (int)$caller['linked_id']) {
                            jsonResponse(['ok' => false, 'error' => 'Forbidden: this placement belongs to another company.'], 403);
                        }
                    } else {
                        $employerId = (int)$caller['linked_id'];
                    }
                }
            }

            if ($placementId) {
                if ($fromStatus) {
                    $stmt = $pdo->prepare("
                        UPDATE TimeLog
                        SET approval_status = :target
                        WHERE placement_id = :pid
                          AND approval_status = :fromStatus
                    ");
                    $stmt->execute([':target' => $targetStatus, ':pid' => $placementId, ':fromStatus' => $fromStatus]);
                } else {
                    $stmt = $pdo->prepare("
                        UPDATE TimeLog
                        SET approval_status = :target
                        WHERE placement_id = :pid
                          AND approval_status != :target
                    ");
                    $stmt->execute([':target' => $targetStatus, ':pid' => $placementId]);
                }
                Database::syncCompliance($pdo, $placementId);
            } elseif ($employerId) {
                if ($fromStatus) {
                    $stmt = $pdo->prepare("
                        UPDATE TimeLog
                        SET approval_status = :target
                        WHERE placement_id IN (SELECT placement_id FROM Placement WHERE employer_id = :eid)
                          AND approval_status = :fromStatus
                    ");
                    $stmt->execute([':target' => $targetStatus, ':eid' => $employerId, ':fromStatus' => $fromStatus]);
                } else {
                    $stmt = $pdo->prepare("
                        UPDATE TimeLog
                        SET approval_status = :target
                        WHERE placement_id IN (SELECT placement_id FROM Placement WHERE employer_id = :eid)
                          AND approval_status != :target
                    ");
                    $stmt->execute([':target' => $targetStatus, ':eid' => $employerId]);
                }
                Database::syncAllCompliance($pdo);
            } elseif ($adviserId) {
                if ($fromStatus) {
                    $stmt = $pdo->prepare("
                        UPDATE TimeLog
                        SET approval_status = :target
                        WHERE placement_id IN (SELECT placement_id FROM Placement WHERE adviser_id = :aid)
                          AND approval_status = :fromStatus
                    ");
                    $stmt->execute([':target' => $targetStatus, ':aid' => $adviserId, ':fromStatus' => $fromStatus]);
                } else {
                    $stmt = $pdo->prepare("
                        UPDATE TimeLog
                        SET approval_status = :target
                        WHERE placement_id IN (SELECT placement_id FROM Placement WHERE adviser_id = :aid)
                          AND approval_status != :target
                    ");
                    $stmt->execute([':target' => $targetStatus, ':aid' => $adviserId]);
                }
                Database::syncAllCompliance($pdo);
            } else {
                if ($fromStatus) {
                    $stmt = $pdo->prepare("UPDATE TimeLog SET approval_status = :target WHERE approval_status = :fromStatus");
                    $stmt->execute([':target' => $targetStatus, ':fromStatus' => $fromStatus]);
                } else {
                    $stmt = $pdo->prepare("UPDATE TimeLog SET approval_status = :target WHERE approval_status != :target");
                    $stmt->execute([':target' => $targetStatus]);
                }
                Database::syncAllCompliance($pdo);
            }
            jsonResponse([
                'ok'      => true,
                'message' => $targetStatus === 'supervisor_verified'
                    ? 'All pending workplace logs verified and submitted to Faculty Adviser.'
                    : 'All attendance logs verified and approved. Placement hours credited and completion status updated.',
            ]);
        }

        if ($method === 'POST') {
            $caller = requireAuth($pdo, ['admin', 'adviser', 'student']);
            $body = getJsonBody();

            // Bulk DTR Transfer Handler (Excel / CSV parsed batch)
            if (!empty($body['batch']) && is_array($body['batch'])) {
                $placementId = (int)($body['placement_id'] ?? 0);
                if ($placementId <= 0) {
                    jsonResponse(['ok' => false, 'error' => 'Valid placement_id is required for batch DTR transfer.'], 400);
                }
                $owners = getPlacementOwners($pdo, $placementId);
                if (!$owners) {
                    jsonResponse(['ok' => false, 'error' => 'Placement record not found.'], 404);
                }
                if ($caller['role'] === 'student' && (int)$owners['student_id'] !== (int)$caller['linked_id']) {
                    jsonResponse(['ok' => false, 'error' => 'Forbidden: you can only transfer DTR logs for your own placement.'], 403);
                }

                $inserted = 0;
                $defaultStatus = $caller['role'] === 'student'
                    ? 'pending'
                    : trim((string)($body['approval_status'] ?? 'pending'));

                $pdo->beginTransaction();
                try {
                    $isSqlite = Database::getDriver() === 'sqlite';
                    $upsertSql = $isSqlite ? "
                        INSERT INTO TimeLog (placement_id, date, time_in, time_out, break_minutes, hours_rendered, task_description, approval_status)
                        VALUES (:pid, :dt, :tin, :tout, :brk, :hrs, :task, :app)
                        ON CONFLICT(placement_id, date) DO UPDATE SET
                            time_in = excluded.time_in,
                            time_out = excluded.time_out,
                            break_minutes = excluded.break_minutes,
                            hours_rendered = excluded.hours_rendered,
                            task_description = excluded.task_description,
                            approval_status = excluded.approval_status
                    " : "
                        INSERT INTO TimeLog (placement_id, date, time_in, time_out, break_minutes, hours_rendered, task_description, approval_status)
                        VALUES (:pid, :dt, :tin, :tout, :brk, :hrs, :task, :app)
                        ON DUPLICATE KEY UPDATE
                            time_in = VALUES(time_in),
                            time_out = VALUES(time_out),
                            break_minutes = VALUES(break_minutes),
                            hours_rendered = VALUES(hours_rendered),
                            task_description = VALUES(task_description),
                            approval_status = VALUES(approval_status)
                    ";

                    $stmt = $pdo->prepare($upsertSql);

                    foreach ($body['batch'] as $log) {
                        $date = trim((string)($log['date'] ?? ''));
                        if (!$date) continue;

                        $timeIn = trim((string)($log['time_in'] ?? '08:00'));
                        $timeOut = trim((string)($log['time_out'] ?? '17:00'));
                        $breakMins = isset($log['break_minutes']) ? (int)$log['break_minutes'] : 60;
                        $explicitHrs = isset($log['hours_rendered']) && $log['hours_rendered'] !== '' ? (float)$log['hours_rendered'] : null;
                        $taskDesc = trim((string)($log['task_description'] ?? 'Daily engineering practicum deliverables and technical tasks.'));
                        $logStatus = $caller['role'] === 'student'
                            ? 'pending'
                            : (!empty($log['approval_status']) ? trim((string)$log['approval_status']) : $defaultStatus);

                        $hrs = computeHoursFromTimes($timeIn, $timeOut, $breakMins, $explicitHrs);
                        if ($hrs <= 0) $hrs = 8.00;

                        $stmt->execute([
                            ':pid'  => $placementId,
                            ':dt'   => $date,
                            ':tin'  => $timeIn,
                            ':tout' => $timeOut,
                            ':brk'  => $breakMins,
                            ':hrs'  => $hrs,
                            ':task' => $taskDesc,
                            ':app'  => $logStatus,
                        ]);
                        $inserted++;
                    }

                    $pdo->commit();
                    Database::syncCompliance($pdo, $placementId);

                    jsonResponse([
                        'ok'      => true,
                        'count'   => $inserted,
                        'message' => "Successfully transferred {$inserted} DTR attendance records into the system.",
                    ]);
                } catch (Throwable $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    jsonResponse(['ok' => false, 'error' => 'Batch transfer failed: ' . $e->getMessage()], 500);
                }
            }

            $placementId = (int)($body['placement_id'] ?? 0);
            $date        = trim((string)($body['date'] ?? date('Y-m-d')));
            $timeIn      = trim((string)($body['time_in'] ?? '08:00'));
            $timeOut     = trim((string)($body['time_out'] ?? '17:00'));
            $breakMins   = isset($body['break_minutes']) ? (int)$body['break_minutes'] : 60;
            $explicitHrs = isset($body['hours_rendered']) && $body['hours_rendered'] !== '' ? (float)$body['hours_rendered'] : null;
            $taskDesc    = trim((string)($body['task_description'] ?? 'Daily engineering internship tasks and technical deliverables.'));
            $approvalCandidate = (string)($body['approval_status'] ?? 'approved');
            $approval = in_array($approvalCandidate, ['approved', 'pending', 'supervisor_verified', 'flagged'], true)
                ? $approvalCandidate
                : 'approved';

            if ($placementId <= 0) {
                jsonResponse(['ok' => false, 'error' => 'Valid placement_id is required.'], 400);
            }
            $owners = getPlacementOwners($pdo, $placementId);
            if (!$owners) {
                jsonResponse(['ok' => false, 'error' => 'Referenced placement record does not exist.'], 404);
            }
            if ($caller['role'] === 'student') {
                if ((int)$owners['student_id'] !== (int)$caller['linked_id']) {
                    jsonResponse(['ok' => false, 'error' => 'Forbidden: students may only log hours under their own placement.'], 403);
                }
                // Students cannot self-approve their own hours
                $approval = 'pending';
            }

            $hoursRendered = computeHoursFromTimes($timeIn, $timeOut, $breakMins, $explicitHrs);
            if ($hoursRendered <= 0 || $hoursRendered > 60) {
                jsonResponse(['ok' => false, 'error' => 'Hours rendered must be between 0.25 and 60.00 hours.'], 400);
            }

            // Upsert if same (placement_id, date) already exists or insert new
            if (Database::getDriver() === 'sqlite') {
                $stmt = $pdo->prepare("
                    INSERT INTO TimeLog (placement_id, date, time_in, time_out, break_minutes, hours_rendered, task_description, approval_status)
                    VALUES (:pid, :dt, :tin, :tout, :brk, :hrs, :task, :app)
                    ON CONFLICT(placement_id, date) DO UPDATE SET
                        time_in = excluded.time_in,
                        time_out = excluded.time_out,
                        break_minutes = excluded.break_minutes,
                        hours_rendered = excluded.hours_rendered,
                        task_description = excluded.task_description,
                        approval_status = excluded.approval_status
                ");
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO TimeLog (placement_id, date, time_in, time_out, break_minutes, hours_rendered, task_description, approval_status)
                    VALUES (:pid, :dt, :tin, :tout, :brk, :hrs, :task, :app)
                    ON DUPLICATE KEY UPDATE
                        time_in = VALUES(time_in),
                        time_out = VALUES(time_out),
                        break_minutes = VALUES(break_minutes),
                        hours_rendered = VALUES(hours_rendered),
                        task_description = VALUES(task_description),
                        approval_status = VALUES(approval_status)
                ");
            }
            $stmt->execute([
                ':pid'  => $placementId,
                ':dt'   => $date,
                ':tin'  => $timeIn,
                ':tout' => $timeOut,
                ':brk'  => $breakMins,
                ':hrs'  => $hoursRendered,
                ':task' => $taskDesc,
                ':app'  => $approval,
            ]);

            $logId = (int)$pdo->lastInsertId();
            if ($logId <= 0) {
                $lookupStmt = $pdo->prepare('SELECT log_id FROM TimeLog WHERE placement_id = :pid AND date = :dt LIMIT 1');
                $lookupStmt->execute([':pid' => $placementId, ':dt' => $date]);
                $logId = (int)$lookupStmt->fetchColumn();
            }

            Database::syncCompliance($pdo, $placementId);

            jsonResponse([
                'ok'      => true,
                'log_id'  => $logId,
                'message' => sprintf('Time log recorded (%.2f hrs). Total hours and compliance status updated.', $hoursRendered),
            ], 201);
        }

        if ($method === 'PUT' && $resourceId !== null) {
            $body = getJsonBody();
            $existingStmt = $pdo->prepare('SELECT * FROM TimeLog WHERE log_id = :id');
            $existingStmt->execute([':id' => $resourceId]);
            $existing = $existingStmt->fetch();
            if (!$existing) {
                jsonResponse(['ok' => false, 'error' => 'Time log not found.'], 404);
            }

            $oldPlacementId = (int)$existing['placement_id'];
            $owners = getPlacementOwners($pdo, $oldPlacementId);
            $caller = authenticateRequest($pdo);
            $verifiedPid = getVerifiedPlacementFromRequest($pdo, $oldPlacementId);

            if ($verifiedPid !== null && !$caller) {
                // Signed verification link: only allow supervisor_verified or flagged on this log
                $placementId   = $oldPlacementId;
                $date          = (string)$existing['date'];
                $timeIn        = (string)$existing['time_in'];
                $timeOut       = (string)$existing['time_out'];
                $breakMins     = (int)$existing['break_minutes'];
                $hoursRendered = (float)$existing['hours_rendered'];
                $taskDesc      = trim((string)($body['task_description'] ?? $existing['task_description']));
                $reqApp        = (string)($body['approval_status'] ?? 'flagged');
                $approval      = in_array($reqApp, ['supervisor_verified', 'flagged'], true) ? $reqApp : 'flagged';
            } else {
                $caller = requireAuth($pdo, ['admin', 'adviser', 'supervisor', 'student']);
                if ($caller['role'] === 'supervisor') {
                    if (!$owners || (int)$owners['employer_id'] !== (int)$caller['linked_id']) {
                        jsonResponse(['ok' => false, 'error' => 'Forbidden: this log belongs to another company.'], 403);
                    }
                    $placementId   = $oldPlacementId;
                    $date          = (string)$existing['date'];
                    $timeIn        = (string)$existing['time_in'];
                    $timeOut       = (string)$existing['time_out'];
                    $breakMins     = (int)$existing['break_minutes'];
                    $hoursRendered = (float)$existing['hours_rendered'];
                    $taskDesc      = trim((string)($body['task_description'] ?? $existing['task_description']));
                    $reqApp        = (string)($body['approval_status'] ?? 'supervisor_verified');
                    if (!in_array($reqApp, ['supervisor_verified', 'flagged', 'pending'], true)) {
                        jsonResponse(['ok' => false, 'error' => 'Supervisors can set supervisor_verified or flagged status only.'], 403);
                    }
                    $approval = $reqApp;
                } elseif ($caller['role'] === 'student') {
                    if (!$owners || (int)$owners['student_id'] !== (int)$caller['linked_id']) {
                        jsonResponse(['ok' => false, 'error' => 'Forbidden: you can only edit your own time logs.'], 403);
                    }
                    $placementId   = $oldPlacementId;
                    $date          = trim((string)($body['date'] ?? $existing['date']));
                    $timeIn        = trim((string)($body['time_in'] ?? $existing['time_in']));
                    $timeOut       = trim((string)($body['time_out'] ?? $existing['time_out']));
                    $breakMins     = isset($body['break_minutes']) ? (int)$body['break_minutes'] : (int)$existing['break_minutes'];
                    $explicitHrs   = isset($body['hours_rendered']) && $body['hours_rendered'] !== '' ? (float)$body['hours_rendered'] : null;
                    $taskDesc      = trim((string)($body['task_description'] ?? $existing['task_description']));
                    $approval      = 'pending';
                    $hoursRendered = computeHoursFromTimes($timeIn, $timeOut, $breakMins, $explicitHrs);
                } else {
                    $placementId   = (int)($body['placement_id'] ?? $existing['placement_id']);
                    $date          = trim((string)($body['date'] ?? $existing['date']));
                    $timeIn        = trim((string)($body['time_in'] ?? $existing['time_in']));
                    $timeOut       = trim((string)($body['time_out'] ?? $existing['time_out']));
                    $breakMins     = isset($body['break_minutes']) ? (int)$body['break_minutes'] : (int)$existing['break_minutes'];
                    $explicitHrs   = isset($body['hours_rendered']) && $body['hours_rendered'] !== '' ? (float)$body['hours_rendered'] : null;
                    $taskDesc      = trim((string)($body['task_description'] ?? $existing['task_description']));
                    $appCand       = (string)($body['approval_status'] ?? $existing['approval_status']);
                    $approval      = in_array($appCand, ['approved', 'pending', 'supervisor_verified', 'flagged'], true)
                        ? $appCand
                        : $existing['approval_status'];
                    $hoursRendered = computeHoursFromTimes($timeIn, $timeOut, $breakMins, $explicitHrs);
                }
            }

            // Prevent duplicate key collision if date/placement changed to an existing date
            $dupStmt = $pdo->prepare('DELETE FROM TimeLog WHERE placement_id = :pid AND date = :dt AND log_id != :id');
            $dupStmt->execute([':pid' => $placementId, ':dt' => $date, ':id' => $resourceId]);

            $stmt = $pdo->prepare("
                UPDATE TimeLog
                SET placement_id = :pid,
                    date = :dt,
                    time_in = :tin,
                    time_out = :tout,
                    break_minutes = :brk,
                    hours_rendered = :hrs,
                    task_description = :task,
                    approval_status = :app
                WHERE log_id = :id
            ");
            $stmt->execute([
                ':pid'  => $placementId,
                ':dt'   => $date,
                ':tin'  => $timeIn,
                ':tout' => $timeOut,
                ':brk'  => $breakMins,
                ':hrs'  => $hoursRendered,
                ':task' => $taskDesc,
                ':app'  => $approval,
                ':id'   => $resourceId,
            ]);

            if ($oldPlacementId !== $placementId) {
                Database::syncCompliance($pdo, $oldPlacementId);
            }
            Database::syncCompliance($pdo, $placementId);

            jsonResponse([
                'ok'      => true,
                'message' => 'Time log updated and hours re-aggregated.',
            ]);
        }

        if ($method === 'DELETE' && $resourceId !== null) {
            $caller = requireAuth($pdo, ['admin', 'adviser', 'student']);
            $stmt = $pdo->prepare('SELECT placement_id FROM TimeLog WHERE log_id = :id');
            $stmt->execute([':id' => $resourceId]);
            $row = $stmt->fetch();
            if (!$row) {
                jsonResponse(['ok' => false, 'error' => 'Time log not found.'], 404);
            }
            if ($caller['role'] === 'student') {
                $owners = getPlacementOwners($pdo, (int)$row['placement_id']);
                if (!$owners || (int)$owners['student_id'] !== (int)$caller['linked_id']) {
                    jsonResponse(['ok' => false, 'error' => 'Forbidden: students may only delete their own time logs.'], 403);
                }
            }

            $pdo->prepare('DELETE FROM TimeLog WHERE log_id = :id')->execute([':id' => $resourceId]);
            Database::syncCompliance($pdo, (int)$row['placement_id']);

            jsonResponse([
                'ok'      => true,
                'message' => 'Time log deleted and placement hours re-aggregated.',
            ]);
        }
    }

    // =========================================================================
    // 4. EVALUATION MODULE (POST / PUT / DELETE /api/evaluations)
    // =========================================================================
    if ($resource === 'evaluations') {
        $instrumentToEvaluator = [
            'supervisor_to_student' => 'employer',
            'adviser_to_hte'        => 'adviser',
            'student_to_supervisor' => 'student',
            'student_to_adviser'    => 'student',
        ];

        if ($method === 'POST') {
            $body          = getJsonBody();
            $placementId   = (int)($body['placement_id'] ?? 0);
            $instrumentType = trim((string)($body['instrument_type'] ?? ''));
            $evalTypeCandidate = (string)($body['evaluator_type'] ?? 'employer');
            if ($instrumentType !== '' && isset($instrumentToEvaluator[$instrumentType])) {
                $evaluatorType = $instrumentToEvaluator[$instrumentType];
            } else {
                $evaluatorType = in_array($evalTypeCandidate, ['employer', 'adviser', 'student'], true)
                    ? $evalTypeCandidate
                    : 'employer';
                if ($instrumentType === '') {
                    $instrumentType = $evaluatorType === 'employer'
                        ? 'supervisor_to_student'
                        : ($evaluatorType === 'adviser' ? 'adviser_to_hte' : 'student_to_supervisor');
                }
            }
            $evaluatorName = trim((string)($body['evaluator_name'] ?? 'Authorized Evaluator'));
            $techScore     = max(1.0, min(5.0, (float)($body['technical_score'] ?? 4.80)));
            $attScore      = max(1.0, min(5.0, (float)($body['attitude_score'] ?? 4.80)));
            $attendScore   = max(1.0, min(5.0, (float)($body['attendance_score'] ?? 4.80)));
            $rating        = isset($body['rating']) && $body['rating'] !== ''
                ? max(1.0, min(5.0, (float)$body['rating']))
                : round(($techScore + $attScore + $attendScore) / 3, 2);
            $comments      = trim((string)($body['comments'] ?? 'Satisfactory completion of assigned engineering tasks.'));
            $dateEvaluated = trim((string)($body['date_evaluated'] ?? date('Y-m-d')));
            $criteriaScores = isset($body['criteria_scores'])
                ? (is_string($body['criteria_scores']) ? $body['criteria_scores'] : json_encode($body['criteria_scores']))
                : null;
            $shouldUpsert  = !empty($body['upsert']);

            if ($placementId <= 0) {
                jsonResponse(['ok' => false, 'error' => 'Valid placement_id is required.'], 400);
            }
            $owners = getPlacementOwners($pdo, $placementId);
            if (!$owners) {
                jsonResponse(['ok' => false, 'error' => 'Referenced placement record does not exist.'], 404);
            }

            $caller = authenticateRequest($pdo);
            $verifiedPid = getVerifiedPlacementFromRequest($pdo, $placementId);
            if ($verifiedPid !== null && !$caller) {
                if ($instrumentType !== 'supervisor_to_student' || $evaluatorType !== 'employer') {
                    jsonResponse(['ok' => false, 'error' => 'Verification link can only submit INST-02 Supervisor evaluations.'], 403);
                }
            } else {
                $caller = requireAuth($pdo, ['admin', 'adviser', 'supervisor', 'student']);
                if ($caller['role'] === 'student') {
                    if ((int)$owners['student_id'] !== (int)$caller['linked_id']) {
                        jsonResponse(['ok' => false, 'error' => 'Forbidden: students may only evaluate their own placement.'], 403);
                    }
                    if (!in_array($instrumentType, ['student_to_supervisor', 'student_to_adviser'], true)) {
                        jsonResponse(['ok' => false, 'error' => 'Forbidden: students cannot submit supervisor or adviser evaluations.'], 403);
                    }
                    $evaluatorType = 'student';
                } elseif ($caller['role'] === 'supervisor') {
                    if ((int)$owners['employer_id'] !== (int)$caller['linked_id']) {
                        jsonResponse(['ok' => false, 'error' => 'Forbidden: supervisors may only evaluate trainees at their company.'], 403);
                    }
                    if ($instrumentType !== 'supervisor_to_student') {
                        jsonResponse(['ok' => false, 'error' => 'Forbidden: supervisors may only submit INST-02 evaluations.'], 403);
                    }
                    $evaluatorType = 'employer';
                } elseif ($caller['role'] === 'adviser') {
                    if (!in_array($instrumentType, ['adviser_to_hte', 'supervisor_to_student'], true)) {
                        jsonResponse(['ok' => false, 'error' => 'Forbidden: faculty advisers cannot submit student feedback instruments.'], 403);
                    }
                }
            }

            if ($shouldUpsert) {
                $dupStmt = $pdo->prepare('SELECT eval_id FROM Evaluation WHERE placement_id = :pid AND instrument_type = :itype LIMIT 1');
                $dupStmt->execute([':pid' => $placementId, ':itype' => $instrumentType]);
                $existingEvalId = $dupStmt->fetchColumn();
                if ($existingEvalId) {
                    $up = $pdo->prepare("
                        UPDATE Evaluation
                        SET evaluator_type = :etype,
                            evaluator_name = :ename,
                            technical_score = :tech,
                            attitude_score = :att,
                            attendance_score = :atd,
                            rating = :rat,
                            comments = :comm,
                            date_evaluated = :dt,
                            criteria_scores = :cscores
                        WHERE eval_id = :id
                    ");
                    $up->execute([
                        ':etype'   => $evaluatorType,
                        ':ename'   => $evaluatorName,
                        ':tech'    => $techScore,
                        ':att'     => $attScore,
                        ':atd'     => $attendScore,
                        ':rat'     => $rating,
                        ':comm'    => $comments,
                        ':dt'      => $dateEvaluated,
                        ':cscores' => $criteriaScores,
                        ':id'      => (int)$existingEvalId,
                    ]);
                    Database::syncCompliance($pdo, $placementId);
                    jsonResponse([
                        'ok'      => true,
                        'eval_id' => (int)$existingEvalId,
                        'updated' => true,
                        'message' => sprintf('%s evaluation updated (Rating: %.2f / 5.00). Compliance report recalculated.', ucfirst($evaluatorType), $rating),
                    ]);
                }
            }

            $stmt = $pdo->prepare("
                INSERT INTO Evaluation (
                    placement_id, evaluator_type, evaluator_name,
                    technical_score, attitude_score, attendance_score,
                    rating, comments, date_evaluated, instrument_type, criteria_scores
                ) VALUES (
                    :pid, :etype, :ename, :tech, :att, :atd, :rat, :comm, :dt, :itype, :cscores
                )
            ");
            $stmt->execute([
                ':pid'     => $placementId,
                ':etype'   => $evaluatorType,
                ':ename'   => $evaluatorName,
                ':tech'    => $techScore,
                ':att'     => $attScore,
                ':atd'     => $attendScore,
                ':rat'     => $rating,
                ':comm'    => $comments,
                ':dt'      => $dateEvaluated,
                ':itype'   => $instrumentType,
                ':cscores' => $criteriaScores,
            ]);

            $evalId = (int)$pdo->lastInsertId();

            Database::syncCompliance($pdo, $placementId);

            jsonResponse([
                'ok'      => true,
                'eval_id' => $evalId,
                'message' => sprintf('%s evaluation recorded (Rating: %.2f / 5.00). Compliance report updated.', ucfirst($evaluatorType), $rating),
            ], 201);
        }

        if ($method === 'PUT' && $resourceId !== null) {
            $caller = requireAuth($pdo, ['admin', 'adviser', 'supervisor', 'student']);
            $body = getJsonBody();
            $stmt = $pdo->prepare('SELECT * FROM Evaluation WHERE eval_id = :id');
            $stmt->execute([':id' => $resourceId]);
            $existing = $stmt->fetch();
            if (!$existing) {
                jsonResponse(['ok' => false, 'error' => 'Evaluation not found.'], 404);
            }

            $oldPlacementId = (int)$existing['placement_id'];
            $owners = getPlacementOwners($pdo, $oldPlacementId);
            if ($caller['role'] === 'student') {
                if (!$owners || (int)$owners['student_id'] !== (int)$caller['linked_id'] || $existing['evaluator_type'] !== 'student') {
                    jsonResponse(['ok' => false, 'error' => 'Forbidden: students can only edit their own student evaluations.'], 403);
                }
            } elseif ($caller['role'] === 'supervisor') {
                if (!$owners || (int)$owners['employer_id'] !== (int)$caller['linked_id'] || $existing['evaluator_type'] !== 'employer') {
                    jsonResponse(['ok' => false, 'error' => 'Forbidden: supervisors can only edit INST-02 evaluations for their trainees.'], 403);
                }
            }

            $placementId    = ($caller['role'] === 'student' || $caller['role'] === 'supervisor')
                ? $oldPlacementId
                : (int)($body['placement_id'] ?? $existing['placement_id']);
            $instrumentType = trim((string)($body['instrument_type'] ?? ($existing['instrument_type'] ?? 'supervisor_to_student')));
            $evaluatorType  = isset($instrumentToEvaluator[$instrumentType])
                ? $instrumentToEvaluator[$instrumentType]
                : ($body['evaluator_type'] ?? $existing['evaluator_type']);
            $evaluatorName  = trim((string)($body['evaluator_name'] ?? $existing['evaluator_name']));
            $techScore      = max(1.0, min(5.0, (float)($body['technical_score'] ?? $existing['technical_score'])));
            $attScore       = max(1.0, min(5.0, (float)($body['attitude_score'] ?? $existing['attitude_score'])));
            $attendScore    = max(1.0, min(5.0, (float)($body['attendance_score'] ?? $existing['attendance_score'])));
            $rating         = isset($body['rating']) && $body['rating'] !== ''
                ? max(1.0, min(5.0, (float)$body['rating']))
                : round(($techScore + $attScore + $attendScore) / 3, 2);
            $comments       = trim((string)($body['comments'] ?? $existing['comments']));
            $dateEvaluated  = trim((string)($body['date_evaluated'] ?? $existing['date_evaluated']));
            $criteriaScores = isset($body['criteria_scores'])
                ? (is_string($body['criteria_scores']) ? $body['criteria_scores'] : json_encode($body['criteria_scores']))
                : ($existing['criteria_scores'] ?? null);

            $up = $pdo->prepare("
                UPDATE Evaluation
                SET placement_id = :pid,
                    evaluator_type = :etype,
                    evaluator_name = :ename,
                    technical_score = :tech,
                    attitude_score = :att,
                    attendance_score = :atd,
                    rating = :rat,
                    comments = :comm,
                    date_evaluated = :dt,
                    instrument_type = :itype,
                    criteria_scores = :cscores
                WHERE eval_id = :id
            ");
            $up->execute([
                ':pid'     => $placementId,
                ':etype'   => $evaluatorType,
                ':ename'   => $evaluatorName,
                ':tech'    => $techScore,
                ':att'     => $attScore,
                ':atd'     => $attendScore,
                ':rat'     => $rating,
                ':comm'    => $comments,
                ':dt'      => $dateEvaluated,
                ':itype'   => $instrumentType,
                ':cscores' => $criteriaScores,
                ':id'      => $resourceId,
            ]);

            if ($oldPlacementId !== $placementId) {
                Database::syncCompliance($pdo, $oldPlacementId);
            }
            Database::syncCompliance($pdo, $placementId);

            jsonResponse([
                'ok'      => true,
                'message' => sprintf('Evaluation updated (Composite: %.2f / 5.00).', $rating),
            ]);
        }

        if ($method === 'DELETE' && $resourceId !== null) {
            $caller = requireAuth($pdo, ['admin', 'adviser', 'student']);
            $stmt = $pdo->prepare('SELECT placement_id, evaluator_type FROM Evaluation WHERE eval_id = :id');
            $stmt->execute([':id' => $resourceId]);
            $row = $stmt->fetch();
            if (!$row) {
                jsonResponse(['ok' => false, 'error' => 'Evaluation not found.'], 404);
            }
            if ($caller['role'] === 'student') {
                $owners = getPlacementOwners($pdo, (int)$row['placement_id']);
                if (!$owners || (int)$owners['student_id'] !== (int)$caller['linked_id'] || $row['evaluator_type'] !== 'student') {
                    jsonResponse(['ok' => false, 'error' => 'Forbidden: students can only delete their own student evaluations.'], 403);
                }
            }
            $pdo->prepare('DELETE FROM Evaluation WHERE eval_id = :id')->execute([':id' => $resourceId]);
            Database::syncCompliance($pdo, (int)$row['placement_id']);

            jsonResponse([
                'ok'      => true,
                'message' => 'Evaluation deleted and compliance status recalculated.',
            ]);
        }
    }

    // =========================================================================
    // 5. PLACEMENT MODULE (POST / PUT / DELETE /api/placements)
    // =========================================================================
    if ($resource === 'placements') {
        if ($method === 'POST' && in_array($subAction, ['upload-signed-dtr', 'signed-dtr'], true)) {
            $caller = requireAuth($pdo, ['admin', 'adviser', 'student', 'supervisor']);
            $body = getJsonBody();
            $placementId = (int)($body['placement_id'] ?? 0);
            $fileName = trim((string)($body['filename'] ?? 'signed_dtr.pdf'));
            $fileData = trim((string)($body['file_data'] ?? ''));
            $notes = trim((string)($body['notes'] ?? ''));

            if ($placementId <= 0) {
                jsonResponse(['ok' => false, 'error' => 'Valid placement_id is required.'], 400);
            }
            $owners = getPlacementOwners($pdo, $placementId);
            if (!$owners) {
                jsonResponse(['ok' => false, 'error' => 'Referenced placement record does not exist.'], 404);
            }
            if ($caller['role'] === 'student' && (int)$owners['student_id'] !== (int)$caller['linked_id']) {
                jsonResponse(['ok' => false, 'error' => 'Forbidden: students can only upload signed DTR for their own placement.'], 403);
            }
            if ($caller['role'] === 'supervisor' && (int)$owners['employer_id'] !== (int)$caller['linked_id']) {
                jsonResponse(['ok' => false, 'error' => 'Forbidden: supervisors can only upload signed DTR for their trainees.'], 403);
            }
            if (strlen($fileData) > 22000000) {
                jsonResponse(['ok' => false, 'error' => 'File payload exceeds the 15 MB upload limit.'], 413);
            }

            $uploadDir = resolveUploadDir('signed_dtr');

            $savedPath = null;
            if ($fileData !== '' && strpos($fileData, 'base64,') !== false) {
                $parts = explode('base64,', $fileData);
                $rawBytes = base64_decode($parts[1] ?? '');
                if ($rawBytes) {
                    $safeExt = strtolower((string)pathinfo($fileName, PATHINFO_EXTENSION));
                    if (!in_array($safeExt, ['pdf', 'png', 'jpg', 'jpeg', 'webp'], true)) {
                        $safeExt = 'pdf';
                    }
                    $safeName = 'dtr_p' . $placementId . '_' . time() . '.' . $safeExt;
                    @file_put_contents($uploadDir . '/' . $safeName, $rawBytes);
                    $savedPath = '/uploads/signed_dtr/' . $safeName;
                }
            }

            $nowSql = Database::getDriver() === 'sqlite' ? "datetime('now')" : "NOW()";
            $stmt = $pdo->prepare("
                UPDATE Placement
                SET signed_dtr_file = :fpath,
                    signed_dtr_filename = :fname,
                    signed_dtr_uploaded_at = {$nowSql},
                    signed_dtr_notes = :notes,
                    signed_dtr_data = :fdata
                WHERE placement_id = :pid
            ");
            $stmt->execute([
                ':fpath' => $savedPath ?: $fileName,
                ':fname' => $fileName,
                ':notes' => $notes,
                ':fdata' => $fileData,
                ':pid'   => $placementId,
            ]);

            Database::syncCompliance($pdo, $placementId);

            jsonResponse([
                'ok' => true,
                'message' => 'Signed physical DTR copy uploaded successfully. Your Faculty Adviser can now cross-reference your hours with this document.',
                'filename' => $fileName,
                'uploaded_at' => date('Y-m-d H:i:s'),
            ]);
        }

        if ($method === 'POST' && in_array($subAction, ['remove-signed-dtr', 'delete-signed-dtr'], true)) {
            $caller = requireAuth($pdo, ['admin', 'adviser', 'student', 'supervisor']);
            $body = getJsonBody();
            $placementId = (int)($body['placement_id'] ?? 0);
            if ($placementId <= 0) {
                jsonResponse(['ok' => false, 'error' => 'Valid placement_id is required.'], 400);
            }
            $owners = getPlacementOwners($pdo, $placementId);
            if (!$owners) {
                jsonResponse(['ok' => false, 'error' => 'Referenced placement record does not exist.'], 404);
            }
            if ($caller['role'] === 'student' && (int)$owners['student_id'] !== (int)$caller['linked_id']) {
                jsonResponse(['ok' => false, 'error' => 'Forbidden: cannot remove another student\'s signed DTR.'], 403);
            }
            if ($caller['role'] === 'supervisor' && (int)$owners['employer_id'] !== (int)$caller['linked_id']) {
                jsonResponse(['ok' => false, 'error' => 'Forbidden: cannot remove signed DTR for another company.'], 403);
            }

            $pdo->prepare("
                UPDATE Placement
                SET signed_dtr_file = NULL,
                    signed_dtr_filename = NULL,
                    signed_dtr_uploaded_at = NULL,
                    signed_dtr_notes = NULL,
                    signed_dtr_data = NULL
                WHERE placement_id = :pid
            ")->execute([':pid' => $placementId]);

            Database::syncCompliance($pdo, $placementId);

            jsonResponse([
                'ok' => true,
                'message' => 'Signed DTR copy removed.',
            ]);
        }

        if ($method === 'POST' && in_array($subAction, ['upload-signed-eval', 'signed-eval'], true)) {
            $body = getJsonBody();
            $placementId = (int)($body['placement_id'] ?? 0);
            $fileName = trim((string)($body['filename'] ?? 'signed_inst02_eval.pdf'));
            $fileData = trim((string)($body['file_data'] ?? ''));
            $notes = trim((string)($body['notes'] ?? ''));

            if ($placementId <= 0) {
                jsonResponse(['ok' => false, 'error' => 'Valid placement_id is required.'], 400);
            }
            $owners = getPlacementOwners($pdo, $placementId);
            if (!$owners) {
                jsonResponse(['ok' => false, 'error' => 'Placement record not found.'], 404);
            }
            $caller = authenticateRequest($pdo);
            $verifiedPid = getVerifiedPlacementFromRequest($pdo, $placementId);
            if ($verifiedPid === null) {
                $caller = requireAuth($pdo, ['admin', 'adviser', 'student', 'supervisor']);
                if ($caller['role'] === 'student' && (int)$owners['student_id'] !== (int)$caller['linked_id']) {
                    jsonResponse(['ok' => false, 'error' => 'Forbidden: students can only upload documents for their own placement.'], 403);
                }
                if ($caller['role'] === 'supervisor' && (int)$owners['employer_id'] !== (int)$caller['linked_id']) {
                    jsonResponse(['ok' => false, 'error' => 'Forbidden: supervisors can only upload documents for their trainees.'], 403);
                }
            }
            if (strlen($fileData) > 22000000) {
                jsonResponse(['ok' => false, 'error' => 'File payload exceeds the 15 MB upload limit.'], 413);
            }

            $uploadDir = resolveUploadDir('signed_eval');

            $savedPath = null;
            if ($fileData !== '' && strpos($fileData, 'base64,') !== false) {
                $parts = explode('base64,', $fileData);
                $rawBytes = base64_decode($parts[1] ?? '');
                if ($rawBytes) {
                    $safeExt = strtolower((string)pathinfo($fileName, PATHINFO_EXTENSION));
                    if (!in_array($safeExt, ['pdf', 'png', 'jpg', 'jpeg', 'webp'], true)) {
                        $safeExt = 'pdf';
                    }
                    $safeName = 'eval_inst02_p' . $placementId . '_' . time() . '.' . $safeExt;
                    @file_put_contents($uploadDir . '/' . $safeName, $rawBytes);
                    $savedPath = '/uploads/signed_eval/' . $safeName;
                }
            }

            $nowSql = Database::getDriver() === 'sqlite' ? "datetime('now')" : "NOW()";
            $stmt = $pdo->prepare("
                UPDATE Placement
                SET signed_eval_file = :fpath,
                    signed_eval_filename = :fname,
                    signed_eval_uploaded_at = {$nowSql},
                    signed_eval_notes = :notes,
                    signed_eval_data = :fdata
                WHERE placement_id = :pid
            ");
            $stmt->execute([
                ':fpath' => $savedPath ?: $fileName,
                ':fname' => $fileName,
                ':notes' => $notes,
                ':fdata' => $fileData,
                ':pid'   => $placementId,
            ]);

            Database::syncCompliance($pdo, $placementId);

            jsonResponse([
                'ok' => true,
                'message' => 'Signed INST-02 Supervisor Evaluation uploaded successfully. Marked submitted for Faculty Adviser review and compliance tracking.',
                'filename' => $fileName,
                'uploaded_at' => date('Y-m-d H:i:s'),
            ]);
        }

        if ($method === 'POST' && in_array($subAction, ['remove-signed-eval', 'delete-signed-eval'], true)) {
            $caller = requireAuth($pdo, ['admin', 'adviser', 'student', 'supervisor']);
            $body = getJsonBody();
            $placementId = (int)($body['placement_id'] ?? 0);
            if ($placementId <= 0) {
                jsonResponse(['ok' => false, 'error' => 'Valid placement_id is required.'], 400);
            }
            $owners = getPlacementOwners($pdo, $placementId);
            if (!$owners) {
                jsonResponse(['ok' => false, 'error' => 'Referenced placement record does not exist.'], 404);
            }
            if ($caller['role'] === 'student' && (int)$owners['student_id'] !== (int)$caller['linked_id']) {
                jsonResponse(['ok' => false, 'error' => 'Forbidden: cannot remove another student\'s signed evaluation.'], 403);
            }
            if ($caller['role'] === 'supervisor' && (int)$owners['employer_id'] !== (int)$caller['linked_id']) {
                jsonResponse(['ok' => false, 'error' => 'Forbidden: cannot remove signed evaluation for another company.'], 403);
            }

            $pdo->prepare("
                UPDATE Placement
                SET signed_eval_file = NULL,
                    signed_eval_filename = NULL,
                    signed_eval_uploaded_at = NULL,
                    signed_eval_notes = NULL,
                    signed_eval_data = NULL
                WHERE placement_id = :pid
            ")->execute([':pid' => $placementId]);

            Database::syncCompliance($pdo, $placementId);

            jsonResponse([
                'ok' => true,
                'message' => 'Signed INST-02 Supervisor Evaluation copy removed and compliance recalculated.',
            ]);
        }

        if ($method === 'POST') {
            $caller = requireAuth($pdo, ['admin', 'adviser']);
            $body          = getJsonBody();
            $studentId     = (int)($body['student_id'] ?? 0);
            $employerId    = (int)($body['employer_id'] ?? 0);
            $adviserId     = (int)($body['adviser_id'] ?? 0);
            $academicTerm  = trim((string)($body['academic_term'] ?? 'AY 2026-2027 1st Sem'));
            $positionTitle = trim((string)($body['position_title'] ?? 'Computer Engineering Intern'));
            $startDate     = trim((string)($body['start_date'] ?? date('Y-m-d')));
            $endDate       = trim((string)($body['end_date'] ?? date('Y-m-d', strtotime('+90 days'))));
            $requiredHours = max(50.0, (float)($body['required_hours'] ?? 300.00));
            $statusCandidate = (string)($body['status'] ?? 'ongoing');
            $status        = in_array($statusCandidate, ['ongoing', 'completed', 'dropped'], true)
                ? $statusCandidate
                : 'ongoing';

            if ($studentId <= 0 || $employerId <= 0 || $adviserId <= 0) {
                jsonResponse(['ok' => false, 'error' => 'Student, Employer/HTE, and Faculty Adviser are required.'], 400);
            }
            assertEntityExists($pdo, 'Student', 'student_id', $studentId, 'Student');
            assertEntityExists($pdo, 'Employer', 'employer_id', $employerId, 'Employer/HTE');
            assertEntityExists($pdo, 'Adviser', 'adviser_id', $adviserId, 'Adviser');

            // Check if this student already has a placement; if so, update/reassign it cleanly
            $existStmt = $pdo->prepare('SELECT placement_id FROM Placement WHERE student_id = :sid ORDER BY placement_id DESC LIMIT 1');
            $existStmt->execute([':sid' => $studentId]);
            $existingPid = (int)$existStmt->fetchColumn();

            if ($existingPid > 0) {
                $upStmt = $pdo->prepare("
                    UPDATE Placement
                    SET employer_id = :eid,
                        adviser_id = :aid,
                        academic_term = :term,
                        position_title = :pos,
                        start_date = :sdate,
                        end_date = :edate,
                        required_hours = :req
                    WHERE placement_id = :pid
                ");
                $upStmt->execute([
                    ':eid'   => $employerId,
                    ':aid'   => $adviserId,
                    ':term'  => $academicTerm,
                    ':pos'   => $positionTitle,
                    ':sdate' => $startDate,
                    ':edate' => $endDate,
                    ':req'   => $requiredHours,
                    ':pid'   => $existingPid,
                ]);
                Database::syncCompliance($pdo, $existingPid);

                jsonResponse([
                    'ok'           => true,
                    'placement_id' => $existingPid,
                    'message'      => 'Student placement reassigned to selected Faculty Adviser and Host Company.',
                ]);
            }

            $stmt = $pdo->prepare("
                INSERT INTO Placement (
                    student_id, employer_id, adviser_id, academic_term,
                    position_title, start_date, end_date, required_hours, status
                ) VALUES (
                    :sid, :eid, :aid, :term, :pos, :sdate, :edate, :req, :st
                )
            ");
            $stmt->execute([
                ':sid'   => $studentId,
                ':eid'   => $employerId,
                ':aid'   => $adviserId,
                ':term'  => $academicTerm,
                ':pos'   => $positionTitle,
                ':sdate' => $startDate,
                ':edate' => $endDate,
                ':req'   => $requiredHours,
                ':st'    => $status,
            ]);

            $newPlacementId = (int)$pdo->lastInsertId();
            Database::syncCompliance($pdo, $newPlacementId);

            jsonResponse([
                'ok'           => true,
                'placement_id' => $newPlacementId,
                'message'      => 'OJT placement contract created and initialized in ComplianceReport.',
            ], 201);
        }

        if ($method === 'PUT' && $resourceId !== null) {
            $caller = requireAuth($pdo, ['admin', 'adviser']);
            $body = getJsonBody();
            $stmt = $pdo->prepare('SELECT * FROM Placement WHERE placement_id = :id');
            $stmt->execute([':id' => $resourceId]);
            $existing = $stmt->fetch();
            if (!$existing) {
                jsonResponse(['ok' => false, 'error' => 'Placement record not found.'], 404);
            }

            $studentId     = (int)($body['student_id'] ?? $existing['student_id']);
            $employerId    = (int)($body['employer_id'] ?? $existing['employer_id']);
            $adviserId     = (int)($body['adviser_id'] ?? $existing['adviser_id']);
            $academicTerm  = trim((string)($body['academic_term'] ?? $existing['academic_term']));
            $positionTitle = trim((string)($body['position_title'] ?? $existing['position_title']));
            $startDate     = trim((string)($body['start_date'] ?? $existing['start_date']));
            $endDate       = trim((string)($body['end_date'] ?? $existing['end_date']));
            $requiredHours = (float)($body['required_hours'] ?? $existing['required_hours']);
            $status        = $body['status'] ?? $existing['status'];

            assertEntityExists($pdo, 'Student', 'student_id', $studentId, 'Student');
            assertEntityExists($pdo, 'Employer', 'employer_id', $employerId, 'Employer/HTE');
            assertEntityExists($pdo, 'Adviser', 'adviser_id', $adviserId, 'Adviser');

            $up = $pdo->prepare("
                UPDATE Placement
                SET student_id = :sid,
                    employer_id = :eid,
                    adviser_id = :aid,
                    academic_term = :term,
                    position_title = :pos,
                    start_date = :sdate,
                    end_date = :edate,
                    required_hours = :req,
                    status = :st
                WHERE placement_id = :id
            ");
            $up->execute([
                ':sid'   => $studentId,
                ':eid'   => $employerId,
                ':aid'   => $adviserId,
                ':term'  => $academicTerm,
                ':pos'   => $positionTitle,
                ':sdate' => $startDate,
                ':edate' => $endDate,
                ':req'   => $requiredHours,
                ':st'    => $status,
                ':id'    => $resourceId,
            ]);

            Database::syncCompliance($pdo, $resourceId);

            // If status was explicitly set by user/admin, preserve that explicit status
            if (isset($body['status']) && in_array($body['status'], ['ongoing', 'completed', 'dropped'], true)) {
                $pdo->prepare('UPDATE Placement SET status = :st WHERE placement_id = :id')
                    ->execute([':st' => $body['status'], ':id' => $resourceId]);
                if ($body['status'] === 'completed') {
                    $clrRef = sprintf('MIT-CPE-CLR-2026-%04d', $resourceId);
                    $pdo->prepare('UPDATE ComplianceReport SET requirement_met = 1, clearance_reference = COALESCE(clearance_reference, :cr) WHERE placement_id = :id')
                        ->execute([':cr' => $clrRef, ':id' => $resourceId]);
                } elseif ($body['status'] === 'dropped') {
                    $pdo->prepare('UPDATE ComplianceReport SET requirement_met = 0, clearance_reference = NULL WHERE placement_id = :id')
                        ->execute([':id' => $resourceId]);
                }
            }

            jsonResponse([
                'ok'      => true,
                'message' => 'Placement updated and compliance eligibility synchronized.',
            ]);
        }

        if ($method === 'DELETE' && $resourceId !== null) {
            $caller = requireAuth($pdo, ['admin', 'adviser']);
            $pdo->prepare('DELETE FROM Placement WHERE placement_id = :id')->execute([':id' => $resourceId]);
            jsonResponse([
                'ok'      => true,
                'message' => 'Placement record deleted.',
            ]);
        }
    }

    // =========================================================================
    // 6. EMPLOYER / HTE MANAGEMENT MODULE (POST / PUT / DELETE /api/employers)
    // =========================================================================
    if ($resource === 'employers') {
        if ($method === 'POST') {
            $caller = requireAuth($pdo, ['admin', 'adviser']);
            $body          = getJsonBody();
            $companyName   = trim((string)($body['company_name'] ?? ''));
            $address       = trim((string)($body['address'] ?? ''));
            $industry      = trim((string)($body['industry'] ?? 'Information Technology'));
            $contactPerson = trim((string)($body['contact_person'] ?? ''));
            $contactNumber = trim((string)($body['contact_number'] ?? ''));
            $email         = trim((string)($body['email'] ?? ''));
            $moaCandidate  = (string)($body['moa_status'] ?? 'active');
            $moaStatus     = in_array($moaCandidate, ['active', 'pending_renewal', 'expired'], true)
                ? $moaCandidate
                : 'active';
            $moaValidity   = !empty($body['moa_validity']) ? $body['moa_validity'] : date('Y-m-d', strtotime('+2 years'));

            if ($companyName === '' || $address === '' || $contactPerson === '') {
                jsonResponse(['ok' => false, 'error' => 'Company name, address, and contact person are required.'], 400);
            }

            $stmt = $pdo->prepare("
                INSERT INTO Employer (company_name, address, industry, contact_person, contact_number, email, moa_status, moa_validity)
                VALUES (:cname, :addr, :ind, :cperson, :cnum, :em, :moa, :mval)
            ");
            $stmt->execute([
                ':cname'   => $companyName,
                ':addr'    => $address,
                ':ind'     => $industry,
                ':cperson' => $contactPerson,
                ':cnum'    => $contactNumber,
                ':em'      => $email,
                ':moa'     => $moaStatus,
                ':mval'    => $moaValidity,
            ]);

            jsonResponse([
                'ok'          => true,
                'employer_id' => (int)$pdo->lastInsertId(),
                'message'     => 'Partner Host Training Establishment (HTE) registered.',
            ], 201);
        }

        if ($method === 'PUT' && $resourceId !== null) {
            $caller = requireAuth($pdo, ['admin', 'adviser']);
            $body = getJsonBody();
            $stmt = $pdo->prepare('SELECT * FROM Employer WHERE employer_id = :id');
            $stmt->execute([':id' => $resourceId]);
            $existing = $stmt->fetch();
            if (!$existing) {
                jsonResponse(['ok' => false, 'error' => 'Employer not found.'], 404);
            }

            $up = $pdo->prepare("
                UPDATE Employer
                SET company_name = :cname,
                    address = :addr,
                    industry = :ind,
                    contact_person = :cperson,
                    contact_number = :cnum,
                    email = :em,
                    moa_status = :moa,
                    moa_validity = :mval
                WHERE employer_id = :id
            ");
            $up->execute([
                ':cname'   => trim((string)($body['company_name'] ?? $existing['company_name'])),
                ':addr'    => trim((string)($body['address'] ?? $existing['address'])),
                ':ind'     => trim((string)($body['industry'] ?? $existing['industry'])),
                ':cperson' => trim((string)($body['contact_person'] ?? $existing['contact_person'])),
                ':cnum'    => trim((string)($body['contact_number'] ?? $existing['contact_number'])),
                ':em'      => trim((string)($body['email'] ?? $existing['email'])),
                ':moa'     => $body['moa_status'] ?? $existing['moa_status'],
                ':mval'    => $body['moa_validity'] ?? $existing['moa_validity'],
                ':id'      => $resourceId,
            ]);

            jsonResponse([
                'ok'      => true,
                'message' => 'Employer / HTE record updated.',
            ]);
        }

        if ($method === 'DELETE' && $resourceId !== null) {
            $caller = requireAuth($pdo, ['admin']);
            $pdo->prepare("DELETE FROM Users WHERE role = 'supervisor' AND linked_id = :id")->execute([':id' => $resourceId]);
            $pdo->prepare('DELETE FROM Placement WHERE employer_id = :id')->execute([':id' => $resourceId]);
            $pdo->prepare('DELETE FROM Employer WHERE employer_id = :id')->execute([':id' => $resourceId]);
            jsonResponse(['ok' => true, 'message' => 'Partner HTE, linked supervisor login, and placement contracts removed.']);
        }
    }

    // =========================================================================
    // 7. STUDENT PROFILE MODULE (POST / PUT / DELETE /api/students)
    // =========================================================================
    if ($resource === 'students') {
        if ($method === 'POST') {
            $caller = requireAuth($pdo, ['admin', 'adviser']);
            $body          = getJsonBody();
            $studentNumber = trim((string)($body['student_number'] ?? ''));
            $fullName      = trim((string)($body['full_name'] ?? ''));
            $program       = trim((string)($body['program'] ?? 'BS Computer Engineering'));
            $yearLevel     = trim((string)($body['year_level'] ?? '4th Year'));
            $section       = trim((string)($body['section'] ?? 'BSCpE 4-1'));
            $email         = trim((string)($body['email'] ?? ''));
            $contactNumber = trim((string)($body['contact_number'] ?? ''));
            $username      = trim((string)($body['username'] ?? ''));

            if ($fullName === '' || $email === '') {
                jsonResponse(['ok' => false, 'error' => 'Student full name and email are required.'], 400);
            }
            if ($studentNumber === '') {
                $studentNumber = sprintf('2023-%05d-MN-0', random_int(100, 999));
            }
            if (!empty($body['employer_id']) && !empty($body['adviser_id'])) {
                assertEntityExists($pdo, 'Employer', 'employer_id', (int)$body['employer_id'], 'Employer/HTE');
                assertEntityExists($pdo, 'Adviser', 'adviser_id', (int)$body['adviser_id'], 'Adviser');
            }

            $dupStud = $pdo->prepare('SELECT student_id FROM Student WHERE LOWER(TRIM(student_number)) = LOWER(:snum) OR LOWER(TRIM(email)) = LOWER(:em) LIMIT 1');
            $dupStud->execute([':snum' => $studentNumber, ':em' => $email]);
            if ($dupStud->fetch()) {
                jsonResponse(['ok' => false, 'error' => 'Student number or email already exists in the Student registry.'], 409);
            }

            $stmt = $pdo->prepare("
                INSERT INTO Student (student_number, full_name, program, year_level, section, email, contact_number)
                VALUES (:snum, :fname, :prog, :yr, :sec, :em, :cnum)
            ");
            $stmt->execute([
                ':snum'  => $studentNumber,
                ':fname' => $fullName,
                ':prog'  => $program,
                ':yr'    => $yearLevel,
                ':sec'   => $section,
                ':em'    => $email,
                ':cnum'  => $contactNumber,
            ]);
            $newStudentId = (int)$pdo->lastInsertId();

            // Automatically provision linked student user account with case-insensitive collision safety
            $derivedUsername = $username !== '' ? $username : strtolower(explode('@', $email)[0]);
            $checkUser = $pdo->prepare('SELECT COUNT(*) FROM Users WHERE LOWER(TRIM(username)) = LOWER(:u)');
            $checkUser->execute([':u' => $derivedUsername]);
            if ((int)$checkUser->fetchColumn() > 0) {
                $derivedUsername = $derivedUsername . '.' . $newStudentId;
            }
            $hash = password_hash('password123', PASSWORD_BCRYPT);
            $uStmt = $pdo->prepare("
                INSERT INTO Users (username, password_hash, role, linked_id, is_active)
                VALUES (:u, :h, 'student', :lid, 1)
            ");
            $uStmt->execute([
                ':u'   => $derivedUsername,
                ':h'   => $hash,
                ':lid' => $newStudentId,
            ]);

            // If employer_id and adviser_id are supplied, immediately create the supervised Placement contract
            $placementCreated = false;
            if (!empty($body['employer_id']) && !empty($body['adviser_id'])) {
                $empId = (int)$body['employer_id'];
                $advId = (int)$body['adviser_id'];
                $posTitle = trim((string)($body['position_title'] ?? 'Computer Engineering Intern'));
                $reqHrs = !empty($body['required_hours']) ? (float)$body['required_hours'] : 300.00;
                $pStmt = $pdo->prepare("
                    INSERT INTO Placement (
                        student_id, employer_id, adviser_id, academic_term,
                        position_title, start_date, end_date, required_hours, status
                    ) VALUES (
                        :sid, :eid, :aid, 'AY 2026-2027 1st Sem',
                        :pos, :sdate, :edate, :req, 'ongoing'
                    )
                ");
                $pStmt->execute([
                    ':sid'   => $newStudentId,
                    ':eid'   => $empId,
                    ':aid'   => $advId,
                    ':pos'   => $posTitle,
                    ':sdate' => date('Y-m-d'),
                    ':edate' => date('Y-m-d', strtotime('+90 days')),
                    ':req'   => $reqHrs,
                ]);
                $newPid = (int)$pdo->lastInsertId();
                Database::syncCompliance($pdo, $newPid);
                $placementCreated = true;
            }

            jsonResponse([
                'ok'         => true,
                'student_id' => $newStudentId,
                'message'    => $placementCreated
                    ? 'Student profile created and assigned to Faculty Adviser supervision.'
                    : 'Student profile and linked login credentials created.',
            ], 201);
        }

        if ($method === 'PUT' && $resourceId !== null) {
            $caller = requireAuth($pdo, ['admin', 'adviser', 'student']);
            if ($caller['role'] === 'student' && (int)$caller['linked_id'] !== $resourceId) {
                jsonResponse(['ok' => false, 'error' => 'Forbidden: students can only edit their own profile.'], 403);
            }
            $body = getJsonBody();
            $stmt = $pdo->prepare('SELECT * FROM Student WHERE student_id = :id');
            $stmt->execute([':id' => $resourceId]);
            $existing = $stmt->fetch();
            if (!$existing) {
                jsonResponse(['ok' => false, 'error' => 'Student not found.'], 404);
            }

            $profileOnly   = !empty($body['profile_only']) || ($caller['role'] === 'student');
            $fullName      = trim((string)($body['full_name'] ?? $existing['full_name']));
            $section       = trim((string)($body['section'] ?? $existing['section']));
            $email         = trim((string)($body['email'] ?? $existing['email']));
            $contactNumber = trim((string)($body['contact_number'] ?? $existing['contact_number']));

            if ($fullName === '' || $email === '') {
                jsonResponse(['ok' => false, 'error' => 'Full name and institutional email are required.'], 400);
            }
            $targetStudentNumber = $profileOnly ? $existing['student_number'] : trim((string)($body['student_number'] ?? $existing['student_number']));
            $dupUp = $pdo->prepare('SELECT student_id FROM Student WHERE (LOWER(TRIM(student_number)) = LOWER(:snum) OR LOWER(TRIM(email)) = LOWER(:em)) AND student_id != :id LIMIT 1');
            $dupUp->execute([':snum' => $targetStudentNumber, ':em' => $email, ':id' => $resourceId]);
            if ($dupUp->fetch()) {
                jsonResponse(['ok' => false, 'error' => 'Student number or email is already assigned to another student.'], 409);
            }

            if (!$profileOnly && !empty($body['employer_id']) && !empty($body['adviser_id'])) {
                assertEntityExists($pdo, 'Employer', 'employer_id', (int)$body['employer_id'], 'Employer/HTE');
                assertEntityExists($pdo, 'Adviser', 'adviser_id', (int)$body['adviser_id'], 'Adviser');
            }

            $up = $pdo->prepare("
                UPDATE Student
                SET student_number = :snum,
                    full_name = :fname,
                    program = :prog,
                    year_level = :yr,
                    section = :sec,
                    email = :em,
                    contact_number = :cnum
                WHERE student_id = :id
            ");
            $up->execute([
                ':snum'  => $targetStudentNumber,
                ':fname' => $fullName,
                ':prog'  => $profileOnly ? $existing['program'] : trim((string)($body['program'] ?? $existing['program'])),
                ':yr'    => $profileOnly ? $existing['year_level'] : trim((string)($body['year_level'] ?? $existing['year_level'])),
                ':sec'   => $section,
                ':em'    => $email,
                ':cnum'  => $contactNumber,
                ':id'    => $resourceId,
            ]);

            $pCheck = $pdo->prepare('SELECT placement_id, position_title, required_hours FROM Placement WHERE student_id = :sid ORDER BY placement_id DESC LIMIT 1');
            $pCheck->execute([':sid' => $resourceId]);
            $existingPlacement = $pCheck->fetch();

            $placementUpdated = false;
            if (!$profileOnly && !empty($body['employer_id']) && !empty($body['adviser_id'])) {
                $empId    = (int)$body['employer_id'];
                $advId    = (int)$body['adviser_id'];
                $posTitle = trim((string)($body['position_title'] ?? ($existingPlacement['position_title'] ?? 'Computer Engineering Intern')));
                if ($posTitle === '') {
                    $posTitle = 'Computer Engineering Intern';
                }

                if ($existingPlacement) {
                    $existingPid = (int)$existingPlacement['placement_id'];
                    $reqHrs = !empty($body['required_hours'])
                        ? (float)$body['required_hours']
                        : (float)($existingPlacement['required_hours'] ?? 300.00);
                    $pUp = $pdo->prepare("
                        UPDATE Placement
                        SET employer_id = :eid,
                            adviser_id = :aid,
                            position_title = :pos,
                            required_hours = :req
                        WHERE placement_id = :pid
                    ");
                    $pUp->execute([
                        ':eid' => $empId,
                        ':aid' => $advId,
                        ':pos' => $posTitle,
                        ':req' => $reqHrs,
                        ':pid' => $existingPid,
                    ]);
                    Database::syncCompliance($pdo, $existingPid);
                } else {
                    $reqHrs = !empty($body['required_hours']) ? (float)$body['required_hours'] : 300.00;
                    $pIns = $pdo->prepare("
                        INSERT INTO Placement (
                            student_id, employer_id, adviser_id, academic_term,
                            position_title, start_date, end_date, required_hours, status
                        ) VALUES (
                            :sid, :eid, :aid, 'AY 2026-2027 1st Sem',
                            :pos, :sdate, :edate, :req, 'ongoing'
                        )
                    ");
                    $pIns->execute([
                        ':sid'   => $resourceId,
                        ':eid'   => $empId,
                        ':aid'   => $advId,
                        ':pos'   => $posTitle,
                        ':sdate' => date('Y-m-d'),
                        ':edate' => date('Y-m-d', strtotime('+90 days')),
                        ':req'   => $reqHrs,
                    ]);
                    $newPid = (int)$pdo->lastInsertId();
                    Database::syncCompliance($pdo, $newPid);
                }
                $placementUpdated = true;
            } elseif (!$profileOnly && $existingPlacement && array_key_exists('position_title', $body)) {
                $posTitle = trim((string)$body['position_title']);
                if ($posTitle !== '') {
                    $pUpPos = $pdo->prepare('UPDATE Placement SET position_title = :pos WHERE placement_id = :pid');
                    $pUpPos->execute([
                        ':pos' => $posTitle,
                        ':pid' => (int)$existingPlacement['placement_id'],
                    ]);
                }
            }

            jsonResponse([
                'ok'      => true,
                'message' => $placementUpdated
                    ? 'Student profile and supervision placement updated.'
                    : 'Student profile updated.',
            ]);
        }

        if ($method === 'DELETE' && $resourceId !== null) {
            $caller = requireAuth($pdo, ['admin', 'adviser']);
            $pdo->prepare("DELETE FROM Users WHERE role = 'student' AND linked_id = :id")->execute([':id' => $resourceId]);
            $pdo->prepare('DELETE FROM Student WHERE student_id = :id')->execute([':id' => $resourceId]);
            jsonResponse(['ok' => true, 'message' => 'Student profile removed.']);
        }
    }

    // =========================================================================
    // 8. ADVISER MODULE (POST / PUT / DELETE /api/advisers)
    // =========================================================================
    if ($resource === 'advisers') {
        if ($method === 'POST') {
            $caller = requireAuth($pdo, ['admin']);
            $body           = getJsonBody();
            $employeeNumber = trim((string)($body['employee_number'] ?? ''));
            if ($employeeNumber === '') {
                $employeeNumber = sprintf('MIT-COE-%04d', random_int(100, 999));
            }
            $fullName       = trim((string)($body['full_name'] ?? ''));
            $department     = trim((string)($body['department'] ?? 'Computer Engineering Department'));
            $email          = trim((string)($body['email'] ?? ''));
            $contactNumber  = trim((string)($body['contact_number'] ?? ''));
            $username       = trim((string)($body['username'] ?? ''));

            if ($fullName === '') {
                jsonResponse(['ok' => false, 'error' => 'Adviser full name is required.'], 400);
            }

            $dupAdv = $pdo->prepare('SELECT adviser_id FROM Adviser WHERE LOWER(TRIM(employee_number)) = LOWER(:eno) OR (:em != "" AND LOWER(TRIM(email)) = LOWER(:em)) LIMIT 1');
            $dupAdv->execute([':eno' => $employeeNumber, ':em' => $email]);
            if ($dupAdv->fetch()) {
                jsonResponse(['ok' => false, 'error' => 'Employee number or email already exists in the Adviser registry.'], 409);
            }

            $stmt = $pdo->prepare("
                INSERT INTO Adviser (employee_number, full_name, department, email, contact_number)
                VALUES (:eno, :fname, :dept, :em, :cnum)
            ");
            $stmt->execute([
                ':eno'   => $employeeNumber,
                ':fname' => $fullName,
                ':dept'  => $department,
                ':em'    => $email,
                ':cnum'  => $contactNumber,
            ]);
            $newAdviserId = (int)$pdo->lastInsertId();

            $derivedUsername = $username !== '' ? $username : ($email !== '' ? strtolower(explode('@', $email)[0]) : 'adviser.' . $newAdviserId);
            $checkUser = $pdo->prepare('SELECT COUNT(*) FROM Users WHERE LOWER(TRIM(username)) = LOWER(:u)');
            $checkUser->execute([':u' => $derivedUsername]);
            if ((int)$checkUser->fetchColumn() > 0) {
                $derivedUsername = $derivedUsername . '.' . $newAdviserId;
            }
            $hash = password_hash('password123', PASSWORD_BCRYPT);
            $pdo->prepare("INSERT INTO Users (username, password_hash, role, linked_id, is_active) VALUES (:u, :h, 'adviser', :lid, 1)")
                ->execute([':u' => $derivedUsername, ':h' => $hash, ':lid' => $newAdviserId]);

            jsonResponse([
                'ok'         => true,
                'adviser_id' => $newAdviserId,
                'message'    => 'Faculty Adviser profile and login credentials created.',
            ], 201);
        }

        if ($method === 'PUT' && $resourceId !== null) {
            $caller = requireAuth($pdo, ['admin', 'adviser']);
            if ($caller['role'] === 'adviser' && (int)$caller['linked_id'] !== $resourceId) {
                jsonResponse(['ok' => false, 'error' => 'Forbidden: faculty advisers can only update their own profile.'], 403);
            }
            $body = getJsonBody();
            $stmt = $pdo->prepare('SELECT * FROM Adviser WHERE adviser_id = :id');
            $stmt->execute([':id' => $resourceId]);
            $existing = $stmt->fetch();
            if (!$existing) {
                jsonResponse(['ok' => false, 'error' => 'Adviser not found.'], 404);
            }

            $up = $pdo->prepare("
                UPDATE Adviser
                SET employee_number = :eno,
                    full_name = :fname,
                    department = :dept,
                    email = :em,
                    contact_number = :cnum
                WHERE adviser_id = :id
            ");
            $up->execute([
                ':eno'   => trim((string)($body['employee_number'] ?? $existing['employee_number'])),
                ':fname' => trim((string)($body['full_name'] ?? $existing['full_name'])),
                ':dept'  => trim((string)($body['department'] ?? $existing['department'])),
                ':em'    => trim((string)($body['email'] ?? $existing['email'])),
                ':cnum'  => trim((string)($body['contact_number'] ?? $existing['contact_number'])),
                ':id'    => $resourceId,
            ]);

            jsonResponse(['ok' => true, 'message' => 'Faculty Adviser record updated.']);
        }

        if ($method === 'DELETE' && $resourceId !== null) {
            $caller = requireAuth($pdo, ['admin']);
            $fallbackStmt = $pdo->prepare('SELECT adviser_id FROM Adviser WHERE adviser_id != :id ORDER BY adviser_id ASC LIMIT 1');
            $fallbackStmt->execute([':id' => $resourceId]);
            $fallbackAdviserId = $fallbackStmt->fetchColumn();
            if ($fallbackAdviserId) {
                $pdo->prepare('UPDATE Placement SET adviser_id = :fb WHERE adviser_id = :id')
                    ->execute([':fb' => (int)$fallbackAdviserId, ':id' => $resourceId]);
            } else {
                $pdo->prepare('DELETE FROM Placement WHERE adviser_id = :id')->execute([':id' => $resourceId]);
            }
            $pdo->prepare("DELETE FROM Users WHERE role = 'adviser' AND linked_id = :id")->execute([':id' => $resourceId]);
            $pdo->prepare('DELETE FROM Adviser WHERE adviser_id = :id')->execute([':id' => $resourceId]);
            jsonResponse(['ok' => true, 'message' => 'Faculty Adviser removed and supervised placements reassigned.']);
        }
    }

    // =========================================================================
    // 9. ADMIN USERS MODULE (GET / POST / PUT / DELETE /api/users)
    // =========================================================================
    if ($resource === 'users') {
        $caller = requireAuth($pdo, ['admin']);

        if ($method === 'GET') {
            $usersRows = $pdo->query("
                SELECT user_id, username, role, linked_id, is_active, created_at,
                       CASE WHEN password_hash != '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO' THEN 1 ELSE 0 END AS has_custom_password
                FROM Users
                ORDER BY user_id ASC
            ")->fetchAll();
            jsonResponse(['ok' => true, 'users' => $usersRows]);
        }

        if ($method === 'POST') {
            $body      = getJsonBody();
            $username  = trim((string)($body['username'] ?? ''));
            $rawPass   = (string)($body['password'] ?? '');
            $password  = trim($rawPass) !== '' ? $rawPass : 'password123';
            $roleCandidate = (string)($body['role'] ?? 'student');
            $role      = in_array($roleCandidate, ['student', 'adviser', 'admin', 'supervisor'], true) ? $roleCandidate : 'student';
            $linkedId  = !empty($body['linked_id']) ? (int)$body['linked_id'] : null;

            if ($username === '') {
                jsonResponse(['ok' => false, 'error' => 'Username is required.'], 400);
            }
            validateLinkedIdForRole($pdo, $role, $linkedId);

            $dupStmt = $pdo->prepare('SELECT user_id FROM Users WHERE LOWER(TRIM(username)) = LOWER(:u) LIMIT 1');
            $dupStmt->execute([':u' => $username]);
            if ($dupStmt->fetch()) {
                jsonResponse(['ok' => false, 'error' => 'Username "' . $username . '" already exists. Please choose another username.'], 409);
            }

            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("
                INSERT INTO Users (username, password_hash, role, linked_id, is_active)
                VALUES (:u, :h, :r, :lid, 1)
            ");
            $stmt->execute([
                ':u'   => $username,
                ':h'   => $hash,
                ':r'   => $role,
                ':lid' => $linkedId,
            ]);

            $hasCustomPass = $hash !== '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO';
            jsonResponse([
                'ok'                  => true,
                'user_id'             => (int)$pdo->lastInsertId(),
                'has_custom_password' => $hasCustomPass ? 1 : 0,
                'message'             => 'System user account created.',
            ], 201);
        }

        if ($method === 'PUT' && $resourceId !== null) {
            $body = getJsonBody();
            $stmt = $pdo->prepare('SELECT * FROM Users WHERE user_id = :id');
            $stmt->execute([':id' => $resourceId]);
            $existing = $stmt->fetch();
            if (!$existing) {
                jsonResponse(['ok' => false, 'error' => 'User not found.'], 404);
            }

            $username = trim((string)($body['username'] ?? $existing['username']));
            if ($username === '') {
                jsonResponse(['ok' => false, 'error' => 'Username cannot be empty.'], 400);
            }

            $dupStmt = $pdo->prepare('SELECT user_id FROM Users WHERE LOWER(TRIM(username)) = LOWER(:u) AND user_id != :id LIMIT 1');
            $dupStmt->execute([':u' => $username, ':id' => $resourceId]);
            if ($dupStmt->fetch()) {
                jsonResponse(['ok' => false, 'error' => 'Username "' . $username . '" is already taken by another account.'], 409);
            }

            $isActive = isset($body['is_active']) ? (int)$body['is_active'] : (int)$existing['is_active'];
            $roleCandidate = (string)($body['role'] ?? $existing['role']);
            $role     = in_array($roleCandidate, ['student', 'adviser', 'admin', 'supervisor'], true) ? $roleCandidate : $existing['role'];
            $linkedId = array_key_exists('linked_id', $body) ? ($body['linked_id'] ? (int)$body['linked_id'] : null) : ($existing['linked_id'] !== null ? (int)$existing['linked_id'] : null);

            validateLinkedIdForRole($pdo, $role, $linkedId);

            $rawPassword = array_key_exists('password', $body) ? (string)$body['password'] : '';
            $passwordChanged = false;

            if ($rawPassword !== '') {
                if (trim($rawPassword) === '') {
                    jsonResponse(['ok' => false, 'error' => 'Password cannot contain only spaces.'], 400);
                }
                $hash = password_hash($rawPassword, PASSWORD_BCRYPT);
                $passwordChanged = true;
                $pdo->prepare('UPDATE Users SET username = :u, password_hash = :h, role = :r, linked_id = :lid, is_active = :act WHERE user_id = :id')
                    ->execute([
                        ':u'   => $username,
                        ':h'   => $hash,
                        ':r'   => $role,
                        ':lid' => $linkedId,
                        ':act' => $isActive,
                        ':id'  => $resourceId,
                    ]);
            } else {
                $pdo->prepare('UPDATE Users SET username = :u, role = :r, linked_id = :lid, is_active = :act WHERE user_id = :id')
                    ->execute([
                        ':u'   => $username,
                        ':r'   => $role,
                        ':lid' => $linkedId,
                        ':act' => $isActive,
                        ':id'  => $resourceId,
                    ]);
            }

            $chkStmt = $pdo->prepare('SELECT password_hash FROM Users WHERE user_id = :id');
            $chkStmt->execute([':id' => $resourceId]);
            $updatedHash = (string)$chkStmt->fetchColumn();
            $hasCustomPass = $updatedHash !== '$2y$10$K5O9nLaU2OQGU0ht8YGJVuDUuvfAvxonYqp9H6iwvlRamGey1bEGO';

            jsonResponse([
                'ok'                  => true,
                'password_updated'    => $passwordChanged,
                'has_custom_password' => $hasCustomPass ? 1 : 0,
                'message'             => $passwordChanged
                    ? 'User account and new encrypted password saved.'
                    : 'User account updated.',
            ]);
        }

        if ($method === 'DELETE' && $resourceId !== null) {
            if ($resourceId === 1 || (int)$caller['user_id'] === $resourceId) {
                jsonResponse(['ok' => false, 'error' => 'Cannot delete primary root or currently active administrator account.'], 403);
            }
            $pdo->prepare('DELETE FROM Users WHERE user_id = :id')->execute([':id' => $resourceId]);
            jsonResponse(['ok' => true, 'message' => 'User account deleted.']);
        }
    }

    // =========================================================================
    // 10. COMPLIANCE SYNC, CLEARANCE ENDORSEMENT & SYSTEM RESET ENDPOINTS
    // =========================================================================
    if ($method === 'POST' && $resource === 'compliance' && $subAction === 'sync') {
        $caller = requireAuth($pdo, ['admin', 'adviser']);
        Database::syncAllCompliance($pdo);
        jsonResponse([
            'ok'      => true,
            'message' => 'All ComplianceReport records recalculated from TimeLog SUM(hours_rendered) and Evaluation joins.',
        ]);
    }

    if ($method === 'POST' && $resource === 'compliance' && $subAction === 'endorse') {
        $caller = requireAuth($pdo, ['admin', 'adviser']);
        $body        = getJsonBody();
        $placementId = (int)($body['placement_id'] ?? 0);
        if ($placementId <= 0) {
            jsonResponse(['ok' => false, 'error' => 'Valid placement_id is required.'], 400);
        }

        $pStmt = $pdo->prepare("
            SELECT
                p.*,
                a.full_name AS adviser_name,
                e.contact_person AS company_contact_person,
                COALESCE((SELECT SUM(hours_rendered) FROM TimeLog WHERE placement_id = p.placement_id AND approval_status != 'flagged'), 0) AS current_hours,
                (SELECT COUNT(*) FROM Evaluation WHERE placement_id = p.placement_id) AS eval_count,
                (SELECT COUNT(*) FROM Evaluation WHERE placement_id = p.placement_id AND evaluator_type = 'adviser') AS adv_eval_count
            FROM Placement p
            INNER JOIN Adviser a ON p.adviser_id = a.adviser_id
            INNER JOIN Employer e ON p.employer_id = e.employer_id
            WHERE p.placement_id = :pid
        ");
        $pStmt->execute([':pid' => $placementId]);
        $pl = $pStmt->fetch();
        if (!$pl) {
            jsonResponse(['ok' => false, 'error' => 'Placement not found.'], 404);
        }

        // 1. Ensure all pending logs for this placement are approved
        $pdo->prepare("UPDATE TimeLog SET approval_status = 'approved' WHERE placement_id = :pid AND approval_status = 'pending'")
            ->execute([':pid' => $placementId]);

        // 2. If student is short on required hours, credit final verified completion hours
        $shortfall = round((float)$pl['required_hours'] - (float)$pl['current_hours'], 2);
        if ($shortfall > 0) {
            $tlIns = $pdo->prepare("
                INSERT INTO TimeLog (placement_id, date, time_in, time_out, break_minutes, hours_rendered, task_description, approval_status)
                VALUES (:pid, :dt, '08:00:00', '17:00:00', 60, :hrs, :task, 'approved')
            ");
            $tlIns->execute([
                ':pid'  => $placementId,
                ':dt'   => date('Y-m-d'),
                ':hrs'  => $shortfall,
                ':task' => 'Verified final practicum deliverables, turnover documentation, and adviser clearance endorsement.',
            ]);
        }

        // 3. If student has no Adviser HTE Audit evaluation (INST-03) yet, record it
        if ((int)$pl['adv_eval_count'] === 0) {
            $evIns = $pdo->prepare("
                INSERT INTO Evaluation (
                    placement_id, instrument_type, evaluator_type, evaluator_name,
                    technical_score, attitude_score, attendance_score, rating,
                    comments, date_evaluated
                ) VALUES (
                    :pid, 'adviser_to_hte', 'adviser', :ename,
                    4.95, 4.95, 5.00, 4.97,
                    'Satisfied all BS CpE OJT practicum competencies, HTE quality standards, and DTR hour requirements. Endorsed by Faculty Adviser.',
                    :dt
                )
            ");
            $evIns->execute([
                ':pid'   => $placementId,
                ':ename' => $pl['adviser_name'],
                ':dt'    => date('Y-m-d'),
            ]);
        }

        // 4. Synchronize ComplianceReport across all 4 required instruments + hours
        Database::syncCompliance($pdo, $placementId);

        $crStmt = $pdo->prepare('SELECT * FROM vw_placement_progress WHERE placement_id = :pid');
        $crStmt->execute([':pid' => $placementId]);
        $crRow = $crStmt->fetch();
        $isCleared = $crRow && (int)($crRow['requirement_met'] ?? 0) === 1;
        $missing = [];
        if ($crRow) {
            if (!(int)($crRow['has_employer_eval'] ?? 0)) $missing[] = 'INST-02 (Supervisor Evaluation or Signed Scan)';
            if (!(int)($crRow['has_adviser_eval'] ?? 0)) $missing[] = 'INST-03 (Adviser HTE Audit)';
            if (!(int)($crRow['has_student_supervisor_eval'] ?? 0)) $missing[] = 'INST-01 (Student -> Supervisor)';
            if (!(int)($crRow['has_student_adviser_eval'] ?? 0)) $missing[] = 'INST-04 (Student -> Adviser)';
        }

        jsonResponse([
            'ok'      => true,
            'cleared' => $isCleared,
            'message' => $isCleared
                ? 'Student placement endorsed and cleared across all 4 evaluation instruments and hours.'
                : 'Hours and Faculty Audit (INST-03) endorsed. Final clearance remains pending: ' . implode(', ', $missing) . '.',
        ]);
    }

    if ($method === 'POST' && $resource === 'system' && $subAction === 'reset') {
        $caller = requireAuth($pdo, ['admin']);
        $driver = Database::getDriver();
        if ($driver === 'sqlite') {
            $sqliteSql = realpath(__DIR__ . '/../../database/schema_and_seed_sqlite.sql');
            if ($sqliteSql && file_exists($sqliteSql)) {
                $sqlContent = file_get_contents($sqliteSql);
                $pdo->exec($sqlContent);
                try {
                    $pdo->exec('PRAGMA wal_checkpoint(TRUNCATE);');
                } catch (Throwable $e) {
                    // Non-critical if checkpoint waits on concurrent reader
                }
                jsonResponse([
                    'ok'      => true,
                    'message' => 'SQLite database reset to default MIT Computer Engineering seed state.',
                ]);
            }
            jsonResponse(['ok' => false, 'error' => 'Could not locate schema_and_seed_sqlite.sql.'], 500);
        } else {
            $sqlFile  = realpath(__DIR__ . '/../../database/schema_and_seed.sql');
            $mysqlBin = 'C:\\xampp\\mysql\\bin\\mysql.exe';
            if ($sqlFile && file_exists($mysqlBin)) {
                $cmd = sprintf('"%s" -u root < "%s" 2>&1', $mysqlBin, $sqlFile);
                shell_exec($cmd);
                jsonResponse([
                    'ok'      => true,
                    'message' => 'Database reset to default MIT Computer Engineering seed state.',
                ]);
            }
            jsonResponse(['ok' => false, 'error' => 'Could not locate mysql CLI or schema file.'], 500);
        }
    }

    jsonResponse(['ok' => false, 'error' => 'Unknown API endpoint: ' . $method . ' /' . $route], 404);
} catch (PDOException $e) {
    jsonResponse([
        'ok'    => false,
        'error' => 'Database constraint or query error: ' . $e->getMessage(),
    ], 400);
} catch (Throwable $e) {
    jsonResponse([
        'ok'    => false,
        'error' => 'Server error: ' . $e->getMessage(),
    ], 500);
}
