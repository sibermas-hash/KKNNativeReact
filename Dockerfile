FROM php:8.4-fpm

ARG INSTALL_DEV=true

WORKDIR /var/www

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock /var/www/

RUN composer install \
    --no-interaction \
    --no-scripts \
    --optimize-autoloader \
    $([ "$INSTALL_DEV" = "true" ] && echo "--dev" || echo "--no-dev")

COPY . /var/www

RUN groupadd -g 1000 www \
    && useradd -u 1000 -ms /bin/bash -g www www \
    && chown -R www:www /var/www

# Dump autoload as root before switching user
RUN composer dump-autoload --optimize

USER www

EXPOSE 9000
CMD ["php-fpm"]
