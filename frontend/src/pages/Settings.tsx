import { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
} from '@mui/material';
import {
    Person,
    Security,
    Tune,
    IntegrationInstructions,
} from '@mui/icons-material';
import ProfileTab from '../components/settings/ProfileTab';
import SecurityTab from '../components/settings/SecurityTab';
import PreferencesTab from '../components/settings/PreferencesTab';
import IntegrationsTab from '../components/settings/IntegrationsTab';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `settings-tab-${index}`,
        'aria-controls': `settings-tabpanel-${index}`,
    };
}

function Settings() {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your account settings and preferences
                </Typography>
            </Box>

            {/* Tabs Container */}
            <Paper className="odoo-card" sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="settings tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': {
                                minHeight: 64,
                                textTransform: 'none',
                                fontSize: '1rem',
                            },
                        }}
                    >
                        <Tab
                            icon={<Person />}
                            iconPosition="start"
                            label="Profile"
                            {...a11yProps(0)}
                        />
                        <Tab
                            icon={<Security />}
                            iconPosition="start"
                            label="Security"
                            {...a11yProps(1)}
                        />
                        <Tab
                            icon={<Tune />}
                            iconPosition="start"
                            label="Preferences"
                            {...a11yProps(2)}
                        />
                        <Tab
                            icon={<IntegrationInstructions />}
                            iconPosition="start"
                            label="Integrations"
                            {...a11yProps(3)}
                        />
                    </Tabs>
                </Box>

                {/* Tab Panels */}
                <Box sx={{ p: 3 }}>
                    <TabPanel value={tabValue} index={0}>
                        <ProfileTab />
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <SecurityTab />
                    </TabPanel>
                    <TabPanel value={tabValue} index={2}>
                        <PreferencesTab />
                    </TabPanel>
                    <TabPanel value={tabValue} index={3}>
                        <IntegrationsTab />
                    </TabPanel>
                </Box>
            </Paper>
        </Box>
    );
}

export default Settings;
