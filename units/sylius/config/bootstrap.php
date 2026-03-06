<?php

use Symfony\Component\Dotenv\Dotenv;

if (file_exists(dirname(__DIR__).'/.env')) {
    (new Dotenv())->bootEnv(dirname(__DIR__).'/.env');
}
