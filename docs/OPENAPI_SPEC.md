# OpenAPI 3.0 Specification — SIBERMAS API v1

> Note: Install `knuckleswtf/scribe` or `zircote/swagger-php` for auto-generation from code annotations.
> This spec serves as the manual reference until auto-generation is configured.

```yaml
openapi: 3.0.3
info:
  title: SIBERMAS API
  description: API backend untuk aplikasi SIBERMAS (KKN UIN SAIZU).
  version: 1.0.0
  contact:
    name: LPPM UIN SAIZU
    url: https://sibermas.uinsaizu.ac.id

servers:
  - url: https://sibermas.uinsaizu.ac.id/api/v1
    description: Production
  - url: http://localhost:8000/api/v1
    description: Local Development

paths:
  /auth/captcha:
    get:
      tags: [Auth]
      summary: Generate CAPTCHA challenge
      responses:
        '200':
          description: CAPTCHA data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiSuccess'

  /auth/login:
    post:
      tags: [Auth]
      summary: Authenticate user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                login: { type: string }
                password: { type: string }
                captcha_id: { type: string }
                captcha_answer: { type: string }
      responses:
        '200':
          description: Auth success with token
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiSuccess'
        '422':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiError'

  /auth/logout:
    post:
      tags: [Auth]
      summary: Logout current session
      security: [BearerAuth: []]
      responses:
        '200':
          description: Logout success

  /auth/user:
    get:
      tags: [Auth]
      summary: Get authenticated user profile
      security: [BearerAuth: []]
      responses:
        '200':
          description: User data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiSuccess'

  /public/home:
    get:
      tags: [Public]
      summary: Home page public data
      responses:
        '200':
          description: Featured content and stats
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiSuccess'

  /public/announcements:
    get:
      tags: [Public]
      summary: List announcements
      responses:
        '200':
          description: Paginated announcements
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiSuccess'

  /period-context:
    get:
      tags: [Period]
      summary: Get active KKN period context
      security: [BearerAuth: []]
      responses:
        '200':
          description: Period data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiSuccess'

  /profile:
    get:
      tags: [Profile]
      summary: Get user profile
      security: [BearerAuth: []]
      responses:
        '200':
          description: Profile data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiSuccess'

    patch:
      tags: [Profile]
      summary: Update user profile
      security: [BearerAuth: []]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                phone: { type: string }
                address: { type: string }
      responses:
        '200':
          description: Updated profile

  /health:
    get:
      tags: [Monitoring]
      summary: Liveness probe
      responses:
        '200':
          description: Service is alive
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, example: ok }
                  timestamp: { type: string, format: date-time }

  /ready:
    get:
      tags: [Monitoring]
      summary: Readiness probe
      responses:
        '200':
          description: Dependencies are healthy
        '503':
          description: At least one dependency is unavailable

components:
  schemas:
    ApiSuccess:
      type: object
      properties:
        success: { type: boolean, example: true }
        message: { type: string }
        data: { type: object }

    ApiError:
      type: object
      properties:
        success: { type: boolean, example: false }
        error:
          type: object
          properties:
            code:
              type: string
              enum: [VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, RATE_LIMITED, METHOD_NOT_ALLOWED, SERVER_ERROR]
            message: { type: string }

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```
