<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            margin: 0;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 32px;
            text-align: center;
        }

        .header h1 {
            color: #fff;
            margin: 0;
            font-size: 24px;
        }

        .body {
            padding: 32px;
        }

        .key-box {
            background: #f0f0f0;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 16px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            word-break: break-all;
            margin: 16px 0;
        }

        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 16px;
            border-radius: 4px;
            margin: 16px 0;
            font-size: 14px;
        }

        .code-block {
            background: #1e1e1e;
            color: #d4d4d4;
            border-radius: 8px;
            padding: 16px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            overflow-x: auto;
            margin: 12px 0;
        }

        h2 {
            color: #333;
            font-size: 18px;
        }

        h3 {
            color: #555;
            font-size: 15px;
        }

        p {
            color: #555;
            line-height: 1.6;
        }

        .footer {
            background: #f9f9f9;
            padding: 20px 32px;
            text-align: center;
            font-size: 12px;
            color: #999;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>🔑 API Key Siap!</h1>
        </div>
        <div class="body">
            <h2>Halo!</h2>
            <p>API Key untuk project <strong>{{ $projectName }}</strong> sudah dibuat.</p>

            <h3>API Key Kamu:</h3>
            <div class="key-box">{{ $apiKey }}</div>

            <div class="warning">
                ⚠️ <strong>Jangan bagikan key ini ke orang lain!</strong> Simpan di file <code>.env</code> dan jangan
                commit ke repository publik.
            </div>

            <h3>Cara Pakai:</h3>
            <div class="code-block">
                fetch('{{ $serverUrl }}/api/v1/TABLE_NAME', {<br>
                &nbsp;&nbsp;headers: { 'x-api-key': '{{ $apiKey }}' }<br>
                })
            </div>

            <p>Ganti <code>TABLE_NAME</code> dengan nama tabel yang ingin diakses.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} {{ config('app.name') }} — API Key Distribution System
        </div>
    </div>
</body>

</html>