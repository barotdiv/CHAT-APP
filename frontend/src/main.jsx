import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Theme } from '@astryxdesign/core/theme'
import { LinkProvider } from '@astryxdesign/core/Link'
import { stoneTheme } from '@astryxdesign/theme-stone/built'
import { Link } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Theme theme={stoneTheme}>
        <LinkProvider component={Link}>
          <App />
        </LinkProvider>
      </Theme>
    </BrowserRouter>
  </React.StrictMode>,
)
