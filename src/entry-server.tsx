import { renderToString } from 'react-dom/server'
import App, { type Quality } from './App'

export const render = (quality: Quality) => renderToString(<App quality={quality} />)
