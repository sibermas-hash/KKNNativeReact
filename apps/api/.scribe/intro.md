# Introduction


        <h1>SIBERMAS API Documentation</h1>
        <p>
        Sistem Informasi Bimbingan Pengabdian Masyarakat (SIBERMAS) REST API v1.
        This documentation covers all available endpoints for KKN management at UIN Prof. K.H. Saifuddin Zuhri Purwokerto.
        </p>
        <h2>Authentication</h2>
        <p>Most endpoints require authentication via Sanctum Bearer tokens. Use the `/api/v1/auth/login` endpoint to obtain your token.</p>
        <h2>Rate Limiting</h2>
        <p>API endpoints are rate-limited to prevent abuse. Exceeding limits will result in HTTP 429 (Too Many Requests) responses.</p>
        <h2>Error Responses</h2>
        <p>All error responses follow a standard format with <code>success: false</code>, error code, and message.</p>
    

<aside>
    <strong>Base URL</strong>: <code>http://localhost:8000</code>
</aside>

    This documentation aims to provide all the information you need to work with our API.

    <aside>As you scroll, you'll see code examples for working with the API in different programming languages in the dark area to the right (or as part of the content on mobile).
    You can switch the language used with the tabs at the top right (or from the nav menu at the top left on mobile).</aside>

