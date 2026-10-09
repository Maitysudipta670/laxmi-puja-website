$port = 8080
$prefix = "http://localhost:$port/"
$folder = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "=========================================================" -ForegroundColor Yellow
    Write-Host " Laxmi Puja Mandap Server Running!" -ForegroundColor Green
    Write-Host " Local URL : $prefix" -ForegroundColor Cyan
    Write-Host " Press Ctrl+C in this terminal to stop the server." -ForegroundColor Gray
    Write-Host "=========================================================" -ForegroundColor Yellow

    Start-Process $prefix

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rel = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($rel)) { $rel = 'index.html' }
        $filePath = Join-Path $folder $rel

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = 'text/plain'
            if ($ext -eq '.html') { $mime = 'text/html; charset=utf-8' }
            elseif ($ext -eq '.css') { $mime = 'text/css; charset=utf-8' }
            elseif ($ext -eq '.js') { $mime = 'application/javascript; charset=utf-8' }
            elseif ($ext -eq '.json') { $mime = 'application/json; charset=utf-8' }
            elseif ($ext -eq '.png') { $mime = 'image/png' }
            elseif ($ext -eq '.jpg' -or $ext -eq '.jpeg') { $mime = 'image/jpeg' }
            elseif ($ext -eq '.svg') { $mime = 'image/svg+xml' }
            
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $err = [System.Text.Encoding]::UTF8.GetBytes('File not found')
            $response.ContentLength64 = $err.Length
            $response.OutputStream.Write($err, 0, $err.Length)
        }
        $response.Close()
    }
}
finally {
    if ($listener -ne $null) {
        $listener.Stop()
    }
}
