# Dockerfile - PHP-FPM pour Landing Page Dorevia-Vault (Sylius)
# Version: 1.2
# Base: PHP 8.2 FPM Alpine

FROM php:8.2-fpm-alpine

# Installer les dépendances système et extensions PHP nécessaires
RUN apk add --no-cache \
    postgresql-dev \
    libpq \
    && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    && docker-php-ext-enable \
    pdo \
    pdo_pgsql

# Installer Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Définir le répertoire de travail
WORKDIR /var/www/html

# Exposer le port PHP-FPM
EXPOSE 9000

# Commande par défaut
CMD ["php-fpm"]
