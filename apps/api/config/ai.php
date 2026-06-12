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

    'default' => env('AI_PROVIDER', 'rizquna'),
    'default_for_images' => env('AI_IMAGE_PROVIDER', env('AI_PROVIDER', 'rizquna')),
    'default_for_audio' => env('AI_AUDIO_PROVIDER', env('AI_PROVIDER', 'rizquna')),
    'default_for_transcription' => env('AI_TRANSCRIPTION_PROVIDER', env('AI_PROVIDER', 'rizquna')),
    'default_for_embeddings' => env('AI_EMBEDDINGS_PROVIDER', env('AI_PROVIDER', 'rizquna')),
    'default_for_reranking' => env('AI_RERANKING_PROVIDER', env('AI_PROVIDER', 'rizquna')),

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

        'rizquna' => [
            'driver' => 'openai',
            'key' => env('RIZQUNA_API_KEY', env('AI_PRIMARY_KEY')),
            'url' => env('RIZQUNA_URL', env('AI_PRIMARY_URL', 'https://router.rizquna.id/v1')),
            'type' => 'chat',
            'models' => [
                'text' => [
                    'default' => env('RIZQUNA_MODEL', env('AI_PRIMARY_MODEL', 'ag/gemini-3-flash')),
                    'cheapest' => env('RIZQUNA_FAST_MODEL', 'ag/gemini-3-flash'),
                    'smartest' => env('RIZQUNA_SMARTEST_MODEL', 'ag/gemini-3.1-pro-low'),
                ],
                'vision' => [
                    'default' => env('RIZQUNA_VISION_MODEL', env('AI_VISION_MODEL', env('RIZQUNA_MODEL', env('AI_PRIMARY_MODEL', 'ag/gemini-3-flash')))),
                    'smartest' => env('RIZQUNA_VISION_SMARTEST_MODEL', 'ag/gemini-3.1-pro-low'),
                ],
                'code' => [
                    'default' => env('RIZQUNA_CODE_MODEL', env('AI_CODE_MODEL', 'cx/gpt-5.3-codex')),
                    'smartest' => env('RIZQUNA_CODE_SMARTEST_MODEL', 'cx/gpt-5.1-codex-max'),
                ],
                'embeddings' => [
                    'default' => env('RIZQUNA_EMBEDDINGS_MODEL', 'text-embedding-3-small'),
                ],
            ],
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
    ],

    /*
    |--------------------------------------------------------------------------
    | Failover AI Providers (Avatar Validation + AI Playground)
    |--------------------------------------------------------------------------
    |
    | Primary gateway menggunakan Rizquna Router
    | (https://router.rizquna.id/v1) yang OpenAI-compatible.
    |
    | Semua tier default ke Rizquna Router. Fallback dan tertiary opsional:
    | isi key terpisah bila ingin retry dengan token/model Rizquna lain.
    |
    | Behavior tanpa env:
    |   - Tier tanpa API key di-skip otomatis.
    |   - Jika SEMUA tier kosong, fitur AI masuk graceful fallback/manual review.
    |   - Tidak ada hard dependency ke provider lain.
    |
    | Urutan: Primary → Fallback → Tertiary → manual review (Layer 4).
    |
    */
    'failover' => [
        'primary' => [
            'url' => env('AI_PRIMARY_URL', 'https://router.rizquna.id/v1'),
            'key' => env('AI_PRIMARY_KEY', env('RIZQUNA_API_KEY')),
            'model' => env('AI_PRIMARY_MODEL', env('RIZQUNA_MODEL', 'ag/gemini-3-flash')),
        ],
        'fallback' => [
            'url' => env('AI_FALLBACK_URL', 'https://router.rizquna.id/v1'),
            'key' => env('AI_FALLBACK_KEY'),
            'model' => env('AI_FALLBACK_MODEL', 'ag/gemini-3-flash'),
        ],
        'tertiary' => [
            'url' => env('AI_TERTIARY_URL', 'https://router.rizquna.id/v1'),
            'key' => env('AI_TERTIARY_KEY'),
            'model' => env('AI_TERTIARY_MODEL', 'ag/gemini-3-flash'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Router (Legacy env compatibility)
    |--------------------------------------------------------------------------
    |
    | Maps AI_ROUTER_* env vars into config so they work with config:cache.
    | AiHealthController and AvatarValidationService reference these.
    |
    */
    'router' => [
        'url' => env('AI_ROUTER_URL', env('AI_PRIMARY_URL', 'https://router.rizquna.id/v1')),
        'key' => env('AI_ROUTER_KEY', env('AI_PRIMARY_KEY', env('RIZQUNA_API_KEY'))),
        'models' => env('AI_ROUTER_MODELS', env('AI_PRIMARY_MODEL', 'ag/gemini-3-flash')),
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
        'assistant' => [
            'provider' => env('AI_ASSISTANT_PROVIDER', env('AI_PROVIDER', 'rizquna')),
            'model' => env('AI_ASSISTANT_MODEL', env('RIZQUNA_MODEL', env('AI_PRIMARY_MODEL', 'ag/gemini-3-flash'))),
            'max_tokens' => 800,
            'temperature' => 0.3,
            'timeout' => 30,
        ],

        // Real-time error alerting — prioritas: speed + cost
        'alerting' => [
            'model' => env('AI_ALERTING_MODEL', 'ag/gemini-3-flash'),
            'max_tokens' => 200,
            'temperature' => 0.1,
            'timeout' => 10,
        ],

        // Logbook analysis — prioritas: accuracy + structured output
        'analysis' => [
            'model' => env('AI_ANALYSIS_MODEL', 'ag/gemini-3-flash'),
            'max_tokens' => 1400,
            'temperature' => 0.2,
            'timeout' => 45,
        ],

        // Daily digest / weekly report — prioritas: reasoning + summarization
        'digest' => [
            'model' => env('AI_DIGEST_MODEL', 'ag/gemini-3-flash'),
            'max_tokens' => 400,
            'temperature' => 0.3,
            'timeout' => 30,
        ],

        // Avatar validation — prioritas: vision accuracy
        'vision' => [
            'model' => env('AI_VISION_MODEL', 'ag/gemini-3-flash'),
            'max_tokens' => 500,
            'temperature' => 0.1,
            'timeout' => 30,
        ],

        // Code analysis (CodeGuardian) — prioritas: code understanding
        'code' => [
            'provider' => env('AI_CODE_PROVIDER', env('AI_PROVIDER', 'rizquna')),
            'model' => env('AI_CODE_MODEL', 'cx/gpt-5.3-codex'),
            'max_tokens' => 1000,
            'temperature' => 0.1,
            'timeout' => 60,
        ],

        'self_healer' => [
            'provider' => env('AI_SELF_HEALER_PROVIDER', env('AI_PROVIDER', 'rizquna')),
            'model' => env('AI_SELF_HEALER_MODEL', env('AI_CODE_MODEL', 'cx/gpt-5.3-codex')),
            'max_tokens' => 1800,
            'temperature' => 0.1,
            'timeout' => 60,
        ],

        // Activity logbook reviewer — Rizquna-first.
        'activity_reviewer' => [
            'provider' => env('AI_ACTIVITY_REVIEWER_PROVIDER', env('AI_PROVIDER', 'rizquna')),
            'model' => env('AI_ACTIVITY_REVIEWER_MODEL', env('AI_ANALYSIS_MODEL', 'ag/gemini-3-flash')),
        ],
    ],

];
