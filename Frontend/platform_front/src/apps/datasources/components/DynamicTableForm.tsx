import React, { useState, useRef } from 'react';
import {
    TextField,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    FormControl,
    Select,
    MenuItem,
    Typography,
    Box,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    alpha,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    Tabs,
    Tab
} from '@mui/material';
import { Trash2, Plus, Link2, Unlink, FileUp, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { DynamicTable } from '../types';
import { useDataSources, useDynamicTables } from '../api/queries';

interface DynamicTableFormProps {
    initialData?: Partial<DynamicTable>;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

interface Column {
    name: string;
    type: string;
    foreign_key?: {
        target_table_id: string;
        target_column: string;
        relationship_type: 'one_to_one' | 'many_to_one';
    }
}

const DynamicTableForm: React.FC<DynamicTableFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [dataSourceId, setDataSourceId] = useState(initialData?.data_source || '');

    // For Relationship Modal
    const [settingsIdx, setSettingsIdx] = useState<number | null>(null);

    // Fetch available data sources and tables in the same data source
    const { data: dataSources } = useDataSources();
    const { data: sourceTables } = useDynamicTables(dataSourceId ? { datasource_id: dataSourceId } : undefined);

    // Parse nested columns or default to empty array
    const initialColumns = initialData?.schema_definition?.columns || [];
    const [columns, setColumns] = useState<Column[]>(initialColumns.length > 0 ? initialColumns : [{ name: '', type: 'string' }]);

    // For Schema Tabs
    const [tabIndex, setTabIndex] = useState(0);

    // For File Upload Wizard
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [extractedColumns, setExtractedColumns] = useState<{name: string, originalName: string, type: string, checked: boolean}[]>([]);

    const inferType = (values: any[]): string => {
        let inferred = 'integer'; // start strict
        
        for (const value of values) {
             if (value === null || value === undefined || value === '') continue;
             
             if (inferred === 'string') break; // can't get more generic than string
             
             if (typeof value === 'boolean') {
                  if (inferred === 'integer') inferred = 'boolean';
                  continue;
             }
             
             if (typeof value === 'number') {
                 if (!Number.isInteger(value) && inferred === 'integer') inferred = 'float';
                 continue;
             }
             
             if (typeof value === 'string') {
                 const lowerVal = value.toLowerCase().trim();
                 if (lowerVal === 'true' || lowerVal === 'false') {
                      if (inferred === 'integer') inferred = 'boolean';
                      continue;
                 }
                 
                 // Number check
                 if (!isNaN(Number(value))) {
                      if (value.includes('.') && inferred === 'integer') inferred = 'float';
                      continue;
                 }
                 
                 // Date check
                 const dateVal = new Date(value);
                 if (!isNaN(dateVal.getTime()) && value.length >= 8) {
                     if (inferred === 'integer' || inferred === 'float' || inferred === 'boolean') {
                         inferred = value.includes('T') || value.includes(' ') ? 'datetime' : 'date';
                     }
                     continue;
                 }
                 
                 try {
                     if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                         if (inferred !== 'string') inferred = 'json';
                         continue;
                     }
                 } catch (e) {
                     // Not JSON
                 }
                 
                 // If we reached here, it's just a normal string.
                 inferred = 'string';
             }
        }
        
        // If we only saw empty values, default to string
        if (inferred === 'integer' && values.every(v => v === null || v === undefined || v === '')) return 'string';
        
        return inferred;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert sheet to JSON array (defval: '' ensures empty cells are included in keys)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
                
                if (jsonData.length > 0) {
                    const headers = jsonData[0] as string[];
                    const sampleRows = jsonData.slice(1, 51); // Check up to 50 rows
                    
                    const exCols = headers.map((header, index) => {
                        const originalName = header ? String(header).trim() : `Column${index + 1}`;
                        // Sanitize to snake_case for DB compatibility roughly
                        const cleanName = originalName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                        
                        // Gather sample values for this column across our sample rows
                        const sampleValues = sampleRows.map(row => row[index]);
                        const inferredType = inferType(sampleValues);
                        
                        return {
                            name: cleanName || `column_${index + 1}`,
                            originalName: originalName,
                            type: inferredType,
                            checked: true
                        };
                    });
                    
                    setExtractedColumns(exCols);
                    setWizardOpen(true);
                }
            } catch (error) {
                console.error("Error parsing file:", error);
                alert("Failed to parse the uploaded file. Please ensure it's a valid CSV or Excel file.");
            } finally {
                setIsUploading(false);
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };

        reader.onerror = () => {
             console.error("Error reading file.");
             setIsUploading(false);
        };

        reader.readAsBinaryString(file);
    };

    const handleConfirmExtractedColumns = () => {
        const selectedCols = extractedColumns.filter(c => c.checked).map(c => ({ name: c.name, type: c.type }));
        
        // If current columns is just the default empty one, replace it. Otherwise append.
        if (columns.length === 1 && columns[0].name === '' && !columns[0].foreign_key) {
            setColumns(selectedCols.length > 0 ? selectedCols : [{ name: '', type: 'string' }]);
        } else {
            setColumns([...columns, ...selectedCols]);
        }
        setWizardOpen(false);
    };

    const handleColumnChange = (index: number, field: keyof Column, value: any) => {
        const newColumns = [...columns];
        newColumns[index] = { ...newColumns[index], [field]: value };
        setColumns(newColumns);
    };

    const addColumn = () => {
        setColumns([...columns, { name: '', type: 'string' }]);
    };

    const removeColumn = (index: number) => {
        if (columns.length > 1) {
            setColumns(columns.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty columns
        const validColumns = columns.filter(c => c.name.trim() !== '');

        const schemaDefinition = {
            columns: validColumns
        };

        onSubmit({
            name,
            schema_definition: schemaDefinition,
            data_source: dataSourceId || null // Link to data source if selected
        });
    };

    const handleSaveFk = (index: number, fk: Column['foreign_key'] | undefined) => {
        const newColumns = [...columns];
        newColumns[index] = { ...newColumns[index], foreign_key: fk };

        // Automate: If relationship is added, force type to 'integer' to match PK
        if (fk) {
            newColumns[index].type = 'integer';

            // Optional: If column name is empty, default it to target table name
            if (!newColumns[index].name) {
                const targetTable = sourceTables?.find(t => t.id === fk.target_table_id);
                if (targetTable) {
                    newColumns[index].name = targetTable.name.toLowerCase().replace(/\s+/g, '_');
                }
            }
        }

        setColumns(newColumns);
        setSettingsIdx(null);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            <TextField
                label="Table Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                helperText="Display name for the table"
            />

            <FormControl fullWidth>
                <InputLabel>Link to Data Source (Optional)</InputLabel>
                <Select
                    value={dataSourceId}
                    label="Link to Data Source (Optional)"
                    onChange={(e) => setDataSourceId(e.target.value)}
                >
                    <MenuItem value="">
                        <em>None (Manual Data Entry)</em>
                    </MenuItem>
                    {dataSources?.map((source) => (
                        <MenuItem key={source.id} value={source.id}>
                            {source.name} ({source.source_type})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Schema Definition</Typography>
                
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)} aria-label="schema definition tabs">
                        <Tab label="Manual Entry" id="schema-tab-0" aria-controls="schema-tabpanel-0" />
                        <Tab label="Import from File" id="schema-tab-1" aria-controls="schema-tabpanel-1" />
                    </Tabs>
                </Box>
                
                <Box sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    {tabIndex === 0 && (
                        <>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                    <TableRow>
                                        <TableCell width="55%">Column Name</TableCell>
                                        <TableCell width="30%">Data Type</TableCell>
                                        <TableCell width="10%">Rel</TableCell>
                                        <TableCell width="5%"></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {columns.map((column, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    placeholder="e.g. user_id"
                                                    value={column.name}
                                                    onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                                                    required={columns.length === 1}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={column.type}
                                                        onChange={(e) => handleColumnChange(index, 'type', e.target.value)}
                                                    >
                                                        <MenuItem value="string">Text (String)</MenuItem>
                                                        <MenuItem value="integer">Number (Integer)</MenuItem>
                                                        <MenuItem value="float">Number (Float)</MenuItem>
                                                        <MenuItem value="boolean">Boolean</MenuItem>
                                                        <MenuItem value="date">Date</MenuItem>
                                                        <MenuItem value="datetime">DateTime</MenuItem>
                                                        <MenuItem value="json">JSON</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Tooltip title={column.foreign_key ? "Configure Relationship" : "Add Relationship"}>
                                                        <IconButton
                                                            size="small"
                                                            color={column.foreign_key ? "primary" : "default"}
                                                            onClick={() => setSettingsIdx(index)}
                                                        >
                                                            <Link2 size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {column.foreign_key && (
                                                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.65rem' }}>
                                                            {column.foreign_key.relationship_type === 'one_to_one' ? '1:1' : 'N:1'}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeColumn(index)}
                                                    disabled={columns.length === 1}
                                                    color="error"
                                                >
                                                    <Trash2 size={16} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Button
                                startIcon={<Plus size={16} />}
                                fullWidth
                                variant="text"
                                sx={{ borderRadius: 0, py: 1.5, textTransform: 'none', borderTop: '1px solid #e5e7eb' }}
                                onClick={addColumn}
                            >
                                Add manual column
                            </Button>
                        </>
                    )}

                    {tabIndex === 1 && (
                        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', bgcolor: alpha('#111827', 0.02) }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha('#3b82f6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                <Database size={24} color="#3b82f6" />
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                Generate schema from sample data
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: '400px', mb: 3 }}>
                                Upload a CSV or Excel file. We will extract the column names from the first row and automatically infer the data types.
                            </Typography>
                            <Button
                                startIcon={isUploading ? <CircularProgress size={16} /> : <FileUp size={16} />}
                                variant="contained"
                                color="primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                sx={{ px: 4 }}
                            >
                                {isUploading ? 'Extracting...' : 'Extract & Infer from File'}
                            </Button>
                            <input
                                type="file"
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                        </Box>
                    )}
                </Box>
            </Box>

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Table Schema'}
                </Button>
            </Stack>

            {/* Relationship Settings Modal */}
            <RelationshipModal
                open={settingsIdx !== null}
                onClose={() => setSettingsIdx(null)}
                tables={sourceTables || []}
                initialData={settingsIdx !== null ? columns[settingsIdx].foreign_key : undefined}
                onSave={(fk) => settingsIdx !== null && handleSaveFk(settingsIdx, fk)}
                columnName={settingsIdx !== null ? columns[settingsIdx].name : ''}
                hasDataSource={!!dataSourceId}
            />

            {/* Extracted Columns Wizard Modal */}
            <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Confirm Imported Columns</Typography>
                    <Typography variant="body2" color="text.secondary">Review the columns extracted and types inferred from your file. Uncheck any columns you don't want to add.</Typography>
                </DialogTitle>
                <DialogContent dividers sx={{ maxHeight: '60vh' }}>
                    <Stack spacing={2}>
                        {extractedColumns.map((col, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, bgcolor: alpha('#111827', 0.02), borderRadius: '8px' }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox 
                                            checked={col.checked} 
                                            onChange={(e) => {
                                                const newCols = [...extractedColumns];
                                                newCols[idx].checked = e.target.checked;
                                                setExtractedColumns(newCols);
                                            }}
                                            size="small"
                                        />
                                    }
                                    label=""
                                    sx={{ m: 0 }}
                                />
                                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5, pr: 1 }}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        label="Name (Snake Case)"
                                        value={col.name}
                                        onChange={(e) => {
                                             const newCols = [...extractedColumns];
                                             newCols[idx].name = e.target.value;
                                             setExtractedColumns(newCols);
                                        }}
                                        disabled={!col.checked}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 0.5 }}>
                                        Original: {col.originalName}
                                    </Typography>
                                </Box>
                                <Box sx={{ width: '180px', flexShrink: 0, alignSelf: 'flex-start' }}>
                                     <FormControl fullWidth size="small" disabled={!col.checked}>
                                        <InputLabel>Type</InputLabel>
                                        <Select
                                            value={col.type}
                                            label="Type"
                                            onChange={(e) => {
                                                 const newCols = [...extractedColumns];
                                                 newCols[idx].type = e.target.value;
                                                 setExtractedColumns(newCols);
                                            }}
                                        >
                                            <MenuItem value="string">Text (String)</MenuItem>
                                            <MenuItem value="integer">Number (Integer)</MenuItem>
                                            <MenuItem value="float">Number (Float)</MenuItem>
                                            <MenuItem value="boolean">Boolean</MenuItem>
                                            <MenuItem value="date">Date</MenuItem>
                                            <MenuItem value="datetime">DateTime</MenuItem>
                                            <MenuItem value="json">JSON</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                        ))}
                        {extractedColumns.length === 0 && (
                             <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                 No valid columns found in the selected file.
                             </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setWizardOpen(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleConfirmExtractedColumns}
                        disabled={extractedColumns.filter(c => c.checked).length === 0}
                    >
                        Add Selected Columns
                    </Button>
                </DialogActions>
            </Dialog>
        </form>
    );
};

interface RelationshipModalProps {
    open: boolean;
    onClose: () => void;
    tables: DynamicTable[];
    initialData?: Column['foreign_key'];
    onSave: (fk: Column['foreign_key'] | undefined) => void;
    columnName: string;
    hasDataSource: boolean;
}

const RelationshipModal: React.FC<RelationshipModalProps> = ({ open, onClose, tables, initialData, onSave, columnName, hasDataSource }) => {
    const [targetTableId, setTargetTableId] = useState(initialData?.target_table_id || '');
    const [relType, setRelType] = useState<'one_to_one' | 'many_to_one'>(initialData?.relationship_type || 'many_to_one');

    const handleSave = () => {
        if (!targetTableId) {
            onSave(undefined);
            return;
        }
        onSave({
            target_table_id: targetTableId,
            target_column: 'id',
            relationship_type: relType
        });
    };

    const handleClear = () => {
        onSave(undefined);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Relationship Settings</Typography>
                <Typography variant="caption" color="text.secondary">Configuring column: <strong>{columnName || 'Untitled'}</strong></Typography>
            </DialogTitle>
            <DialogContent>
                {!hasDataSource ? (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography color="error" variant="body2" sx={{ fontWeight: 600 }}>
                            No Data Source Selected
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: alpha('#111827', 0.5) }}>
                            You can only define relationships between tables that belong to the same Data Source. Please select a Data Source for this table first.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Target Table</InputLabel>
                            <Select
                                value={targetTableId}
                                label="Target Table"
                                onChange={(e) => setTargetTableId(e.target.value)}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {tables.map(t => (
                                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ p: 1.5, bgcolor: alpha('#111827', 0.03), borderRadius: '8px', border: '1px solid', borderColor: alpha('#111827', 0.05) }}>
                            <Typography sx={{ fontSize: '0.7rem', color: alpha('#111827', 0.5), lineHeight: 1.5 }}>
                                Relationship will automatically map to the <strong>id</strong> column of the target table (Django-style ForeignKey).
                            </Typography>
                        </Box>

                        <FormControl fullWidth>
                            <InputLabel>Relationship Type</InputLabel>
                            <Select
                                value={relType}
                                label="Relationship Type"
                                onChange={(e) => setRelType(e.target.value as any)}
                            >
                                <MenuItem value="many_to_one">Many-to-One (Standard FK)</MenuItem>
                                <MenuItem value="one_to_one">One-to-One (Unique FK)</MenuItem>
                            </Select>
                        </FormControl>

                        {relType === 'one_to_one' && (
                            <Box sx={{ p: 1.5, bgcolor: alpha('#3b82f6', 0.05), borderRadius: '8px', border: '1px solid', borderColor: alpha('#3b82f6', 0.1) }}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#1d4ed8' }}>
                                    <strong>One-to-One</strong>: This will enforce that each record in this table corresponds to exactly one record in the target table by adding a UNIQUE constraint.
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button onClick={handleClear} color="error" startIcon={<Unlink size={16} />}>Remove</Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={!targetTableId && relType !== 'many_to_one'}>Save Settings</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DynamicTableForm;
