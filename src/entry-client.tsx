import { hydrateRoot } from 'react-dom/client'
import App, { type Quality } from './App'
import './index.css'

const quality = (document.documentElement.dataset.quality as Quality) || 'hd'
hydrateRoot(document.getElementById('root')!, <App quality={quality} />)
