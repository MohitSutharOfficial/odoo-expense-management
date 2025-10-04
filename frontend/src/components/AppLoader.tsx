import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '../store';

export default function AppLoader({ children }: { children: React.ReactNode }) {
    const hasHydrated = useAuthStore((state) => state._hasHydrated);

    if (!hasHydrated) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    bgcolor: '#714B67',
                }}
            >
                <CircularProgress size={60} sx={{ color: 'white' }} />
            </Box>
        );
    }

    return <>{children}</>;
}
