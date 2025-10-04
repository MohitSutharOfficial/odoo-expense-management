import { createTheme } from '@mui/material/styles';

// Odoo-inspired color palette
const theme = createTheme({
    palette: {
        primary: {
            main: '#714B67', // Odoo purple
            light: '#8e6280',
            dark: '#5a3b52',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#00A09D', // Odoo teal
            light: '#33b3b0',
            dark: '#00807d',
            contrastText: '#ffffff',
        },
        success: {
            main: '#28a745',
            light: '#48b560',
            dark: '#1e7e34',
        },
        warning: {
            main: '#f0ad4e',
            light: '#f3bd71',
            dark: '#ec971f',
        },
        error: {
            main: '#dc3545',
            light: '#e3596a',
            dark: '#bd2130',
        },
        info: {
            main: '#17a2b8',
            light: '#45b5c6',
            dark: '#117a8b',
        },
        background: {
            default: '#f0f0f1',
            paper: '#ffffff',
        },
        text: {
            primary: '#1f1f1f',
            secondary: '#5f5f5f',
        },
        divider: '#e0e0e0',
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.3,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.5,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.6,
        },
        button: {
            textTransform: 'none',
            fontWeight: 500,
        },
    },
    shape: {
        borderRadius: 8,
    },
    shadows: [
        'none',
        '0px 1px 3px rgba(0, 0, 0, 0.08)',
        '0px 2px 4px rgba(0, 0, 0, 0.08)',
        '0px 3px 6px rgba(0, 0, 0, 0.1)',
        '0px 4px 8px rgba(0, 0, 0, 0.1)',
        '0px 5px 10px rgba(0, 0, 0, 0.12)',
        '0px 6px 12px rgba(0, 0, 0, 0.12)',
        '0px 7px 14px rgba(0, 0, 0, 0.14)',
        '0px 8px 16px rgba(0, 0, 0, 0.14)',
        '0px 9px 18px rgba(0, 0, 0, 0.16)',
        '0px 10px 20px rgba(0, 0, 0, 0.16)',
        '0px 11px 22px rgba(0, 0, 0, 0.18)',
        '0px 12px 24px rgba(0, 0, 0, 0.18)',
        '0px 13px 26px rgba(0, 0, 0, 0.2)',
        '0px 14px 28px rgba(0, 0, 0, 0.2)',
        '0px 15px 30px rgba(0, 0, 0, 0.22)',
        '0px 16px 32px rgba(0, 0, 0, 0.22)',
        '0px 17px 34px rgba(0, 0, 0, 0.24)',
        '0px 18px 36px rgba(0, 0, 0, 0.24)',
        '0px 19px 38px rgba(0, 0, 0, 0.26)',
        '0px 20px 40px rgba(0, 0, 0, 0.26)',
        '0px 21px 42px rgba(0, 0, 0, 0.28)',
        '0px 22px 44px rgba(0, 0, 0, 0.28)',
        '0px 23px 46px rgba(0, 0, 0, 0.3)',
        '0px 24px 48px rgba(0, 0, 0, 0.3)',
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    padding: '8px 20px',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.2)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
                    '&:hover': {
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 6,
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    fontWeight: 500,
                },
            },
        },
    },
});

export default theme;
