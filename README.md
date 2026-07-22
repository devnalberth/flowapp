# flowapp

## Recuperação de senha com Supabase

Defina `VITE_APP_URL` no ambiente de produção com a URL pública do frontend,
sem barra no final. Use o arquivo `.env.example` como referência.

No Supabase Dashboard, acesse **Authentication → URL Configuration** e configure:

- **Site URL:** `https://flowapp-two.vercel.app`
- **Redirect URLs:** `https://flowapp-two.vercel.app/recuperar-senha`
- Para desenvolvimento, adicione também `http://localhost:5173/recuperar-senha`.

Em **Authentication → Email Templates → Reset password**, o link do botão deve
usar `{{ .ConfirmationURL }}`. O destino enviado pelo frontend é
`https://flowapp-two.vercel.app/recuperar-senha`.

Depois de alterar `VITE_APP_URL` no provedor de hospedagem, gere um novo deploy:
variáveis `VITE_*` são incorporadas ao frontend durante o build.
