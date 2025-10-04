import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Card,
    CardContent,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    FormControl,
    InputLabel,
    Select,
    InputAdornment,
    Stack,
} from '@mui/material';
import {
    ArrowBack,
    CloudUpload,
    Delete,
    Image as ImageIcon,
    Save,
    Send,
    AutoFixHigh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { expenseAPI, categoryAPI, departmentAPI } from '../services/api';
import { Category, Department } from '../types';

interface ExpenseFormData {
    title: string;
    description: string;
    amount: string;
    currency: string;
    date: string;
    categoryId: string;
    departmentId: string;
    merchantName: string;
    paymentMethod: string;
}

function NewExpense() {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form data
    const [formData, setFormData] = useState<ExpenseFormData>({
        title: '',
        description: '',
        amount: '',
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        departmentId: '',
        merchantName: '',
        paymentMethod: 'CARD',
    });

    // Receipt upload
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string>('');
    const [ocrData, setOcrData] = useState<any>(null);
    const [ocrLoading, setOcrLoading] = useState(false);

    const steps = ['Basic Details', 'Receipt Upload', 'Review & Submit'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [catsRes, deptsRes] = await Promise.all([
                categoryAPI.getAll(),
                departmentAPI.getAll(),
            ]);
            setCategories(catsRes.data);
            setDepartments(deptsRes.data);
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    };

    const handleInputChange = (field: keyof ExpenseFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please upload an image file (JPG, PNG, etc.)');
                return;
            }
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }

            setReceiptFile(file);
            setError('');

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Auto-trigger OCR
            performOCR(file);
        }
    };

    const performOCR = async (file: File) => {
        setOcrLoading(true);
        setError('');
        setSuccess('');

        try {
            console.log('🔍 Starting OCR processing for file:', file.name);

            // Create FormData with just the receipt file
            const formData = new FormData();
            formData.append('receipt', file);

            // Get API URL from environment variable
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            // Call backend OCR endpoint
            const response = await fetch(`${apiUrl}/expenses/ocr`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state.token : ''}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'OCR failed' }));
                throw new Error(errorData.error || `OCR request failed with status ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ OCR result:', result);

            // Handle both success and partial success cases
            if (result.data) {
                const ocrData = {
                    amount: result.data.amount?.toString() || '',
                    merchantName: result.data.merchant || '',
                    date: result.data.date || new Date().toISOString().split('T')[0],
                    text: result.data.text || ''
                };

                setOcrData(ocrData);

                // Auto-fill form with OCR data if available
                if (ocrData.amount || ocrData.merchantName) {
                    setFormData((prev) => ({
                        ...prev,
                        amount: ocrData.amount || prev.amount,
                        merchantName: ocrData.merchantName || prev.merchantName,
                        date: ocrData.date || prev.date,
                        title: ocrData.merchantName ? `Expense at ${ocrData.merchantName}` : prev.title
                    }));

                    setSuccess(`✅ Receipt scanned! Found: $${ocrData.amount || 'N/A'} at ${ocrData.merchantName || 'Unknown'}. Review and adjust if needed.`);
                } else {
                    // OCR didn't extract any data
                    throw new Error(result.error || 'Could not extract data from receipt. Please enter details manually.');
                }
            } else {
                throw new Error(result.error || 'OCR processing failed');
            }
        } catch (err: any) {
            console.error('❌ OCR failed:', err);
            setError(`OCR scan failed: ${err.message}. You can still manually enter the details.`);

            // Set basic OCR data so user knows attempt was made
            setOcrData({
                amount: '',
                merchantName: '',
                date: new Date().toISOString().split('T')[0],
                text: 'OCR processing failed'
            });
        } finally {
            setOcrLoading(false);
        }
    };

    const removeReceipt = () => {
        setReceiptFile(null);
        setReceiptPreview('');
        setOcrData(null);
    };

    const validateStep = (step: number): boolean => {
        if (step === 0) {
            if (!formData.title.trim()) {
                setError('Please enter an expense title');
                return false;
            }
            if (!formData.amount || parseFloat(formData.amount) <= 0) {
                setError('Please enter a valid amount');
                return false;
            }
            if (!formData.categoryId) {
                setError('Please select a category');
                return false;
            }
            if (!formData.date) {
                setError('Please select a date');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setError('');
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
        setError('');
    };

    const handleSubmit = async (isDraft: boolean) => {
        if (!validateStep(0)) return;

        setLoading(true);
        setError('');

        try {
            const submitData = new FormData();
            // Map frontend camelCase to backend snake_case
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('amount', formData.amount);
            submitData.append('currency', formData.currency);
            submitData.append('date', formData.date);
            submitData.append('category_id', formData.categoryId); // Backend expects category_id
            if (formData.departmentId) {
                submitData.append('department_id', formData.departmentId); // Backend expects department_id
            }
            submitData.append('merchant', formData.merchantName); // Backend expects merchant
            submitData.append('payment_method', formData.paymentMethod); // Backend expects payment_method
            submitData.append('status', isDraft ? 'DRAFT' : 'PENDING');

            if (receiptFile) {
                submitData.append('receipt', receiptFile);
            }

            await expenseAPI.create(submitData);

            setSuccess(isDraft ? 'Expense saved as draft!' : 'Expense submitted successfully!');
            setTimeout(() => {
                navigate('/expenses');
            }, 1500);
        } catch (err: any) {
            console.error('Failed to submit expense:', err);
            setError(err.response?.data?.message || 'Failed to submit expense. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Expense Title"
                                required
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="e.g., Team lunch at restaurant"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Amount"
                                required
                                type="number"
                                value={formData.amount}
                                onChange={(e) => handleInputChange('amount', e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Currency</InputLabel>
                                <Select
                                    value={formData.currency}
                                    label="Currency"
                                    onChange={(e) => handleInputChange('currency', e.target.value)}
                                >
                                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                                    <MenuItem value="EUR">EUR - Euro</MenuItem>
                                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                                    <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={formData.categoryId}
                                    label="Category"
                                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <span>{cat.icon}</span>
                                                <span>{cat.name}</span>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Date"
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Merchant Name"
                                value={formData.merchantName}
                                onChange={(e) => handleInputChange('merchantName', e.target.value)}
                                placeholder="e.g., Starbucks"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Payment Method</InputLabel>
                                <Select
                                    value={formData.paymentMethod}
                                    label="Payment Method"
                                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                                >
                                    <MenuItem value="CARD">Credit/Debit Card</MenuItem>
                                    <MenuItem value="CASH">Cash</MenuItem>
                                    <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                                    <MenuItem value="ONLINE">Online Payment</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    value={formData.departmentId}
                                    label="Department"
                                    onChange={(e) => handleInputChange('departmentId', e.target.value)}
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {departments.map((dept) => (
                                        <MenuItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={4}
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Add any additional details about this expense..."
                            />
                        </Grid>
                    </Grid>
                );

            case 1:
                return (
                    <Box>
                        {!receiptFile ? (
                            <Card
                                sx={{
                                    border: '2px dashed #ccc',
                                    bgcolor: '#f9f9f9',
                                    cursor: 'pointer',
                                    '&:hover': { borderColor: 'primary.main', bgcolor: '#f0f0f0' },
                                }}
                            >
                                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="receipt-upload"
                                        type="file"
                                        onChange={handleFileSelect}
                                    />
                                    <label htmlFor="receipt-upload">
                                        <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            Upload Receipt Image
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Drag and drop or click to select
                                        </Typography>
                                        <Button variant="contained" component="span">
                                            Choose File
                                        </Button>
                                        <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
                                            Supported: JPG, PNG, PDF (Max 10MB)
                                        </Typography>
                                    </label>
                                </CardContent>
                            </Card>
                        ) : (
                            <Box>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ImageIcon /> Receipt Preview
                                            </Typography>
                                            <IconButton color="error" onClick={removeReceipt}>
                                                <Delete />
                                            </IconButton>
                                        </Box>

                                        {receiptPreview && (
                                            <Box
                                                component="img"
                                                src={receiptPreview}
                                                alt="Receipt preview"
                                                sx={{
                                                    width: '100%',
                                                    maxHeight: 400,
                                                    objectFit: 'contain',
                                                    borderRadius: 1,
                                                    border: '1px solid #e0e0e0',
                                                }}
                                            />
                                        )}

                                        {ocrLoading && (
                                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                                <CircularProgress size={24} />
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                    Scanning receipt...
                                                </Typography>
                                            </Box>
                                        )}

                                        {ocrData && !ocrLoading && (
                                            <Alert severity="success" sx={{ mt: 2 }} icon={<AutoFixHigh />}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    Receipt scanned successfully!
                                                </Typography>
                                                <Typography variant="caption">
                                                    Detected: ${ocrData.amount} at {ocrData.merchantName}
                                                </Typography>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>

                                <Alert severity="info" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Tip:</strong> You can skip this step and add a receipt later if needed.
                                    </Typography>
                                </Alert>
                            </Box>
                        )}
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Please review your expense details before submitting
                        </Alert>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                                    <Typography variant="overline" color="text.secondary">
                                        Expense Details
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} gutterBottom>
                                        {formData.title}
                                    </Typography>
                                    {formData.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {formData.description}
                                        </Typography>
                                    )}
                                    <Stack direction="row" spacing={2} flexWrap="wrap">
                                        <Chip
                                            label={`$${formData.amount} ${formData.currency}`}
                                            color="primary"
                                            sx={{ fontWeight: 700 }}
                                        />
                                        <Chip
                                            label={categories.find((c) => c.id === formData.categoryId)?.name || 'N/A'}
                                            icon={<span>{categories.find((c) => c.id === formData.categoryId)?.icon}</span>}
                                        />
                                        <Chip label={new Date(formData.date).toLocaleDateString()} />
                                        {formData.merchantName && <Chip label={formData.merchantName} variant="outlined" />}
                                    </Stack>
                                </Paper>
                            </Grid>

                            {receiptPreview && (
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Receipt Attached
                                        </Typography>
                                        <Box
                                            component="img"
                                            src={receiptPreview}
                                            alt="Receipt"
                                            sx={{
                                                width: '100%',
                                                maxHeight: 200,
                                                objectFit: 'contain',
                                                borderRadius: 1,
                                            }}
                                        />
                                    </Paper>
                                </Grid>
                            )}

                            <Grid item xs={12} md={receiptPreview ? 6 : 12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Additional Information
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Payment Method: <strong>{formData.paymentMethod}</strong>
                                        </Typography>
                                        {formData.departmentId && (
                                            <Typography variant="body2" color="text.secondary">
                                                Department:{' '}
                                                <strong>{departments.find((d) => d.id === formData.departmentId)?.name}</strong>
                                            </Typography>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => navigate('/expenses')}>
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        New Expense
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create a new expense report
                    </Typography>
                </Box>
            </Box>

            {/* Stepper */}
            <Paper className="odoo-card" sx={{ p: 3, mb: 3 }}>
                <Stepper activeStep={activeStep}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                </Alert>
            )}

            {/* Form */}
            <Paper className="odoo-card" sx={{ p: 3 }}>
                {renderStepContent(activeStep)}

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        variant="outlined"
                    >
                        Back
                    </Button>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {activeStep === steps.length - 1 ? (
                            <>
                                <Button
                                    variant="outlined"
                                    startIcon={<Save />}
                                    onClick={() => handleSubmit(true)}
                                    disabled={loading}
                                >
                                    Save as Draft
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                                    onClick={() => handleSubmit(false)}
                                    disabled={loading}
                                    sx={{
                                        bgcolor: 'secondary.main',
                                        '&:hover': { bgcolor: 'secondary.dark' },
                                    }}
                                >
                                    {loading ? 'Submitting...' : 'Submit for Approval'}
                                </Button>
                            </>
                        ) : (
                            <Button variant="contained" onClick={handleNext}>
                                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

export default NewExpense;
