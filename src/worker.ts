import manifest from '../dist/client/.vite/manifest.json'
import { render } from './entry-server'
import type { Quality } from './App'

interface Env { ASSETS: Fetcher }
type Entry = { file: string; css?: string[] }
const entry = (manifest as Record<string, Entry>)['src/entry-client.tsx']

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname !== '/') return env.ASSETS.fetch(req)

    // phones and data-saver users get the 720p file, everyone else 1080p
    const ua = req.headers.get('user-agent') ?? ''
    const mobile = req.headers.get('sec-ch-ua-mobile') === '?1' || /Mobi|Android|iPhone|iPad/i.test(ua)
    const quality: Quality = mobile || req.headers.get('save-data') === 'on' ? 'sd' : 'hd'

    const css = (entry.css ?? []).map((f) => `<link rel="stylesheet" href="/${f}">`).join('')
    const html = `<!doctype html>
<html lang="en" data-quality="${quality}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#000000">
<title>Mainframe</title>
<link rel="preload" as="image" href="/poster.jpg">
${css}
</head>
<body><div id="root">${render(quality)}</div>
<script type="module" src="/${entry.file}"></script>
</body>
</html>`

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
        vary: 'User-Agent, Sec-CH-UA-Mobile, Save-Data',
      },
    })
  },
}
