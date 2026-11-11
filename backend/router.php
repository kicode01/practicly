<?php
declare(strict_types=1);

/**
 * Metropolitan Institute of Technology — Department of Computer Engineering
 * Nexis Practicum & Internship Management System
 *
 * Unified All-in-One Development & Production Router
 * Serves the React Astryx Frontend (from dist/) and REST API (/api/*) on Port 8000
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

// 1. API Route Dispatcher
if (strpos($uri, '/api') === 0) {
    require __DIR__ . '/api/index.php';
    return true;
}

// 2. Static Asset Dispatcher (dist/ and public/ directories)
$publicDir = realpath(__DIR__ . '/../public');
if ($publicDir && is_dir($publicDir)) {
    $pubFile = realpath($publicDir . $uri);
    if ($pubFile && strpos($pubFile, $publicDir) === 0 && is_file($pubFile)) {
        $ext = strtolower(pathinfo($pubFile, PATHINFO_EXTENSION));
        $mimeTypes = [
            'pdf'   => 'application/pdf',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'webp'  => 'image/webp',
            'svg'   => 'image/svg+xml',
        ];
        if (isset($mimeTypes[$ext])) {
            header('Content-Type: ' . $mimeTypes[$ext]);
        }
        readfile($pubFile);
        return true;
    }
}

$distDir = realpath(__DIR__ . '/../dist');
if ($distDir && is_dir($distDir)) {
    $filePath = realpath($distDir . $uri);
    if ($filePath && strpos($filePath, $distDir) === 0 && is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'html'  => 'text/html; charset=utf-8',
            'css'   => 'text/css; charset=utf-8',
            'js'    => 'application/javascript; charset=utf-8',
            'json'  => 'application/json; charset=utf-8',
            'svg'   => 'image/svg+xml',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'webp'  => 'image/webp',
            'ico'   => 'image/x-icon',
            'woff'  => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf'   => 'font/ttf',
        ];

        if (isset($mimeTypes[$ext])) {
            header('Content-Type: ' . $mimeTypes[$ext]);
        }
        // Development headers to prevent caching issues during editing
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        readfile($filePath);
        return true;
    }

    // Static assets requested from /assets/ that do not exist must return 404, NEVER index.html
    if (strpos($uri, '/assets/') === 0) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        echo "404 Asset Not Found: " . htmlspecialchars($uri);
        return true;
    }

    // SPA Fallback: Serve index.html for client-side routing
    $indexHtml = $distDir . DIRECTORY_SEPARATOR . 'index.html';
    if (is_file($indexHtml)) {
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        readfile($indexHtml);
        return true;
    }
}

// 3. Root API fallback if dist has not yet been built
require __DIR__ . '/api/index.php';
return true;
