<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default AI Provider Names
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the AI providers below should be the
    | default for AI operations when no explicit provider is provided
    | for the operation. This should be any provider defined below.
    |
    */

    'default' => env('AI_PROVIDER', 'gemini'),
    'default_for_images' => 'gemini',
    'default_for_audio' => 'openai',
    'default_for_transcription' => 'openai',
    'default_for_embeddings' => 'openai',
    'default_for_reranking' => 'cohere',

    /*
    |--------------------------------------------------------------------------
    | Caching
    |--------------------------------------------------------------------------
    |
    | Below you may configure caching strategies for AI related operations
    | such as embedding generation. You are free to adjust these values
    | based on your application's available caching stores and needs.
    |
    */

    'caching' => [
        'embeddings' => [
            'cache' => false,
            'store' => env('CACHE_STORE', 'database'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Providers
    |--------------------------------------------------------------------------
    |
    | Below are each of your AI providers defined for this application. Each
    | represents an AI provider and API key combination which can be used
    | to perform tasks like text, image, and audio creation via agents.
    |
    */

    'providers' => [
        'anthropic' => [
            'driver' => 'anthropic',
            'key' => env('ANTHROPIC_API_KEY'),
            'url' => env('ANTHROPIC_URL', 'https://api.anthropic.com/v1'),
        ],

        'azure' => [
            'driver' => 'azure',
            'key' => env('AZURE_OPENAI_API_KEY'),
            'url' => env('AZURE_OPENAI_URL'),
            'api_version' => env('AZURE_OPENAI_API_VERSION', '2024-10-21'),
            'deployment' => env('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o'),
            'embedding_deployment' => env('AZURE_OPENAI_EMBEDDING_DEPLOYMENT', 'text-embedding-3-small'),
        ],

        'cohere' => [
            'driver' => 'cohere',
            'key' => env('COHERE_API_KEY'),
        ],

        'deepseek' => [
            'driver' => 'deepseek',
            'key' => env('DEEPSEEK_API_KEY'),
        ],

        'eleven' => [
            'driver' => 'eleven',
            'key' => env('ELEVENLABS_API_KEY'),
        ],

        'gemini' => [
            'driver' => 'gemini',
            'key' => env('GEMINI_API_KEY'),
            'url' => env('GEMINI_URL', 'https://generativelanguage.googleapis.com/v1'),
            'models' => [
                'text' => [
                    // Production: gemini-2.0-flash (optimal untuk speed + quality)
                    'default' => 'gemini-2.0-flash',
                    // Fastest model untuk real-time responses (student notifications, etc)
                    'cheapest' => 'gemini-2.0-flash-lite',
                    // Most capable model untuk complex reasoning (admin review, verification)
                    'smartest' => 'gemini-1.5-pro',
                ],
            ],
        ],

        'groq' => [
            'driver' => 'groq',
            'key' => env('GROQ_API_KEY'),
            'url' => env('GROQ_URL', 'https://api.groq.com/openai/v1'),
        ],

        'jina' => [
            'driver' => 'jina',
            'key' => env('JINA_API_KEY'),
        ],

        'mistral' => [
            'driver' => 'mistral',
            'key' => env('MISTRAL_API_KEY'),
            'url' => env('MISTRAL_URL', 'https://api.mistral.ai/v1'),
        ],

        'ollama' => [
            'driver' => 'ollama',
            'key' => env('OLLAMA_API_KEY', ''),
            'url' => env('OLLAMA_BASE_URL', 'http://localhost:11434'),
        ],

        'openai' => [
            'driver' => 'openai',
            'key' => env('OPENAI_API_KEY'),
            'url' => env('OPENAI_URL', 'https://api.openai.com/v1'),
        ],

        'openrouter' => [
            'driver' => 'openrouter',
            'key' => env('OPENROUTER_API_KEY'),
        ],

        'voyageai' => [
            'driver' => 'voyageai',
            'key' => env('VOYAGEAI_API_KEY'),
        ],

        'xai' => [
            'driver' => 'xai',
            'key' => env('XAI_API_KEY'),
            'url' => env('XAI_URL', 'https://api.x.ai/v1'),
        ],

        'alibaba' => [
            'driver' => 'openai',
            'key' => env('ALIBABA_API_KEY'),
            'url' => env('ALIBABA_URL', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'),
            'type' => 'chat',
            'models' => [
                'text' => [
                    'default' => 'qwen-plus',
                    'cheapest' => 'qwen-turbo',
                    'smartest' => 'qwen-max',
                ],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Failover AI Providers (Avatar Validation + AI Playground)
    |--------------------------------------------------------------------------
    |
    | 3-tier failover via SumoPod (https://ai.sumopod.com/v1) yang OpenAI-compatible.
    |
    | Behavior tanpa env:
    |   - Tier tanpa API key di-skip otomatis (AvatarValidationService).
    |   - Jika SEMUA tier kosong, avatar diterima tanpa AI check (manual review).
    |   - Tidak ada error/crash — fitur AI gracefully disabled.
    |
    | Model picks per 2026-05-11:
    |   Primary:  gemini/gemini-2.5-pro    → 1M ctx, 64K out, smartest vision
    |   Fallback: gemini/gemini-2.5-flash  → 1M ctx, faster, masih kuat vision
    |   Tertiary: gpt-4o                    → 128K ctx, classic OpenAI vision
    |              (cross-vendor — berbeda family dari primary+fallback)
    |
    | Urutan: Primary → Fallback → Tertiary → manual review (Layer 4).
    |
    */
    'failover' => [
        'primary' => [
            'url' => env('AI_PRIMARY_URL', 'https://ai.sumopod.com/v1'),
            'key' => env('AI_PRIMARY_KEY'),
            'model' => env('AI_PRIMARY_MODEL', 'gemini/gemini-2.5-pro'),
        ],
        'fallback' => [
            'url' => env('AI_FALLBACK_URL', 'https://ai.sumopod.com/v1'),
            'key' => env('AI_FALLBACK_KEY'),
            'model' => env('AI_FALLBACK_MODEL', 'gemini/gemini-2.5-flash'),
        ],
        'tertiary' => [
            'url' => env('AI_TERTIARY_URL', 'https://ai.sumopod.com/v1'),
            'key' => env('AI_TERTIARY_KEY'),
            'model' => env('AI_TERTIARY_MODEL', 'gpt-4o'),
        ],
        // Direct provider fallback — bypass SumoPod jika token habis/gateway down.
        // Langsung ke API resmi masing-masing provider.
        'direct_gemini' => [
            'url' => env('GEMINI_DIRECT_URL', 'https://generativelanguage.googleapis.com/v1beta/openai'),
            'key' => env('GEMINI_API_KEY'),
            'model' => env('GEMINI_DIRECT_MODEL', 'gemini-2.0-flash'),
        ],
        'direct_openai' => [
            'url' => env('OPENAI_DIRECT_URL', 'https://api.openai.com/v1'),
            'key' => env('OPENAI_API_KEY'),
            'model' => env('OPENAI_DIRECT_MODEL', 'gpt-4o-mini'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Task-Specific Model Routing
    |--------------------------------------------------------------------------
    |
    | Optimal model selection per use case. Setiap task punya kebutuhan berbeda:
    | - Alerting: butuh cepat (< 2s), murah, tidak perlu reasoning mendalam
    | - Analysis: butuh akurat, structured output, reasoning kuat
    | - Vision: butuh multimodal (foto avatar, dokumen)
    | - Embeddings: butuh dimensi tinggi untuk semantic search
    |
    */
    'routing' => [
        // Real-time error alerting — prioritas: speed + cost
        'alerting' => [
            'model' => env('AI_ALERTING_MODEL', 'gemini/gemini-2.5-flash'),
            'max_tokens' => 200,
            'temperature' => 0.1,
            'timeout' => 10,
        ],

        // Logbook analysis — prioritas: accuracy + structured output
        'analysis' => [
            'model' => env('AI_ANALYSIS_MODEL', 'gemini/gemini-2.5-pro'),
            'max_tokens' => 800,
            'temperature' => 0.2,
            'timeout' => 45,
        ],

        // Daily digest / weekly report — prioritas: reasoning + summarization
        'digest' => [
            'model' => env('AI_DIGEST_MODEL', 'gemini/gemini-2.5-pro'),
            'max_tokens' => 400,
            'temperature' => 0.3,
            'timeout' => 30,
        ],

        // Avatar validation — prioritas: vision accuracy
        'vision' => [
            'model' => env('AI_VISION_MODEL', 'gemini/gemini-2.5-pro'),
            'max_tokens' => 500,
            'temperature' => 0.1,
            'timeout' => 30,
        ],

        // Code analysis (CodeGuardian) — prioritas: code understanding
        'code' => [
            'model' => env('AI_CODE_MODEL', 'gemini/gemini-2.5-pro'),
            'max_tokens' => 1000,
            'temperature' => 0.1,
            'timeout' => 60,
        ],

        // Activity logbook reviewer — default alibaba/qwen-plus (cost-effective)
        // Override via env when switching to Gemini or OpenAI
        'activity_reviewer' => [
            'provider' => env('AI_ACTIVITY_REVIEWER_PROVIDER', 'alibaba'),
            'model' => env('AI_ACTIVITY_REVIEWER_MODEL', 'qwen-plus'),
        ],
    ],

];
