# Бот для js-игры

## Запуск

Нужные env-переменные:
```
PORT=
// Slack Apps -> Basic Information
SLACK_SIGNING_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
// Firebase Web App config
FB_API_KEY=
FB_AUTH_DOMAIN=
FB_RD=
FB_ID=
FB_STORAGE_BUCKET=
FB_SENDER_ID=
FB_APP_ID=
```
Бот поддерживает команды `/setbot` и `/gamehelp` - они же должны быть поддержаны и в настройках Slack App
Чтобы бота можно было устанавливать, в настройках приложения должен быть указан `https://<url деплоя>/slack/oauth_redirect` - OAuth Redirect url
