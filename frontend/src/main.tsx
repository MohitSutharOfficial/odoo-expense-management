import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import AppLoader from './components/AppLoader';
import theme from './theme';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppLoader>
                <App />
            </AppLoader>
        </ThemeProvider>
    </BrowserRouter>
);
