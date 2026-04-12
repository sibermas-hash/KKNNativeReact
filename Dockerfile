FROM php:8.4-fpm

ARG INSTALL_DEV=true

WORKDIR /var/www

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libonig-dev \
    libpng-dev \
    libpq-dev \
    libzip-dev \
    libicu-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql pgsql mbstring zip exif pcntl gd bcmath intl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /tmp/pear /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Node.js 20 for Inertia/React asset building
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY . /var/www

RUN if [ "$INSTALL_DEV" = "true" ]; then \
        composer install --no-interaction --optimize-autoloader; \
    else \
        composer install --no-interaction --optimize-autoloader --no-dev; \
    fi \
    && npm ci && npm run build \
    && rm -rf node_modules

RUN groupadd -g 1000 www \
    && useradd -u 1000 -ms /bin/bash -g www www \
    && chown -R www:www /var/www/storage /var/www/bootstrap/cache

USER www
EXPOSE 9000
RUN echo "expose_php = Off" >> /usr/local/etc/php/conf.d/docker-php.ini
CMD ["php-fpm"]
