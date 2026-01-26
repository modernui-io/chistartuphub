import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import App from './App'
import './App.css'

// Initialize Convex client
const convexUrl = import.meta.env.VITE_CONVEX_URL

// Only wrap with ConvexProvider if URL is configured
const AppWithConvex = convexUrl ? (
  <ConvexProvider client={new ConvexReactClient(convexUrl)}>
    <App />
  </ConvexProvider>
) : (
  <App />
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {AppWithConvex}
  </React.StrictMode>
)
