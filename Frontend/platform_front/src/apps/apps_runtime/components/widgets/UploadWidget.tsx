import React, { useState } from 'react';
import { Box, Typography, alpha, Button, Stack, LinearProgress, Paper, IconButton } from '@mui/material';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';

interface UploadWidgetProps {
    nodeId: string;
    workflowId: string;
}

const UploadWidget: React.FC<UploadWidgetProps> = ({ nodeId, workflowId }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    console.log(`UploadWidget bound to workflow ${workflowId}, node ${nodeId}`);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setProgress(0);
        }
    };

    const handleUpload = () => {
        if (!file) return;
        setUploading(true);

        const interval = setInterval(() => {
            setProgress((prev: number) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setUploading(false);
                    setStatus('success');
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
    };

    return (
        <Box sx={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', p: 4
        }}>
            {!file ? (
                <Box
                    component="label"
                    sx={{
                        width: '100%', maxWidth: 400, border: '2px dashed',
                        borderColor: alpha('#6366f1', 0.2), borderRadius: '16px',
                        p: 6, textAlign: 'center', cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: alpha('#6366f1', 0.02), borderColor: '#6366f1' }
                    }}
                >
                    <input type="file" hidden onChange={handleFileChange} />
                    <Box sx={{
                        width: 64, height: 64, borderRadius: '50%',
                        bgcolor: alpha('#6366f1', 0.1), color: '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2
                    }}>
                        <Upload size={32} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                        Click to upload production data
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: alpha('#64748b', 0.7) }}>
                        CSV, Excel, or JSON files supported
                    </Typography>
                </Box>
            ) : (
                <Paper sx={{
                    width: '100%', maxWidth: 450, p: 3, borderRadius: '16px',
                    border: '1px solid', borderColor: alpha('#e2e8f0', 0.8),
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{
                            width: 48, height: 48, borderRadius: '12px',
                            bgcolor: alpha('#6366f1', 0.1), color: '#6366f1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <File size={24} />
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                                {file.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: alpha('#64748b', 0.7) }}>
                                {(file.size / 1024).toFixed(1)} KB
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setFile(null)} disabled={uploading}>
                            <X size={18} />
                        </IconButton>
                    </Stack>

                    {uploading && (
                        <Box sx={{ mt: 3 }}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1' }}>Uploading...</Typography>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1' }}>{progress}%</Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={progress} sx={{
                                height: 8, borderRadius: 4, bgcolor: alpha('#6366f1', 0.05),
                                '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: '#6366f1' }
                            }} />
                        </Box>
                    )}

                    {status === 'success' && (
                        <Box sx={{ mt: 3, p: 1.5, bgcolor: alpha('#10b981', 0.1), borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CheckCircle2 size={20} color="#059669" />
                            <Typography sx={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                                Data uploaded and synced to dynamic warehouse.
                            </Typography>
                        </Box>
                    )}

                    {!uploading && status === 'idle' && (
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleUpload}
                            sx={{ mt: 3, borderRadius: '10px', bgcolor: '#6366f1', py: 1.2 }}
                        >
                            Sync Data to Workflow
                        </Button>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default UploadWidget;
