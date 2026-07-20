import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SearchProvider } from "./Components/Search";
import { ThemeProvider } from "./Components/ThemeContext";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>

    <SearchProvider>

<App/>
    </SearchProvider>
     </ThemeProvider>
    
  </StrictMode>,
)
