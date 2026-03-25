import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    styled,
    alpha,
    TablePagination,
    Box,
    Typography
} from '@mui/material';
import LoadingSpinner from './LoadingSpinner';

const StyledTableContainer = styled(TableContainer)(() => ({
    background: '#fff',
    borderRadius: '0px',
    overflow: 'auto',
    boxShadow: 'none',
    flex: 1,
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
    backgroundColor: '#f8fafc',
    '& .MuiTableCell-head': {
        color: alpha('#111827', 0.45),
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '0.62rem',
        letterSpacing: '0.06em',
        borderBottom: `1px solid ${alpha('#111827', 0.06)}`,
        padding: theme.spacing(0.8, 1.5),
        height: '30px',
        whiteSpace: 'nowrap',
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    transition: 'background-color 0.1s ease',
    '&:hover': {
        backgroundColor: alpha('#111827', 0.015),
    },
    '& .MuiTableCell-body': {
        borderBottom: `1px solid ${alpha('#111827', 0.03)}`,
        padding: theme.spacing(0.6, 1.5),
        fontSize: '0.78rem',
        color: '#111827',
    },
    '&:last-child .MuiTableCell-body': {
        borderBottom: 'none',
    },
}));

interface Column {
    id: string;
    label: string;
    minWidth?: number;
    align?: 'right' | 'left' | 'center';
    format?: (value: any, row: any) => React.ReactNode;
}

interface CyberTableProps {
    columns: Column[];
    rows: any[];
    isLoading?: boolean;
    totalCount?: number;
    page?: number;
    rowsPerPage?: number;
    onPageChange?: (event: unknown, newPage: number) => void;
    onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    compact?: boolean;
}

export const CyberTable: React.FC<CyberTableProps> = ({
    columns,
    rows,
    isLoading,
    totalCount = 0,
    page = 0,
    rowsPerPage = 10,
    onPageChange,
    onRowsPerPageChange,
    compact
}) => {
    if (isLoading) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <LoadingSpinner />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: '0.75rem' }}>
                    Loading data...
                </Typography>
            </Box>
        );
    }

    const paginatedRows = onPageChange
        ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : rows;

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            overflow: 'hidden',
        }}>
            <StyledTableContainer>
                <Table stickyHeader size={compact ? 'small' : 'medium'}>
                    <StyledTableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={column.id}
                                    align={column.align}
                                    style={{ minWidth: column.minWidth }}
                                >
                                    {column.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </StyledTableHead>
                    <TableBody>
                        {paginatedRows.length > 0 ? (
                            paginatedRows.map((row, index) => (
                                <StyledTableRow hover tabIndex={-1} key={row.id || index}>
                                    {columns.map((column) => {
                                        const value = row[column.id];
                                        return (
                                            <TableCell key={column.id} align={column.align}>
                                                {column.format ? column.format(value, row) : (
                                                    typeof value === 'object' && value !== null
                                                        ? JSON.stringify(value)
                                                        : value ?? '—'
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </StyledTableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: alpha('#111827', 0.3) }}>
                                        No records found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </StyledTableContainer>
            {onPageChange && (
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={onPageChange}
                    onRowsPerPageChange={onRowsPerPageChange}
                    sx={{
                        flexShrink: 0,
                        borderTop: '1px solid',
                        borderColor: alpha('#111827', 0.04),
                        '& .MuiTablePagination-toolbar': {
                            minHeight: 36,
                            px: 1.5,
                        },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                            fontSize: '0.72rem',
                            color: alpha('#111827', 0.4),
                        },
                        '& .MuiTablePagination-select': {
                            fontSize: '0.72rem',
                        },
                        '& .MuiTablePagination-actions .MuiIconButton-root': {
                            padding: '4px',
                        },
                    }}
                />
            )}
        </Box>
    );
};

export default CyberTable;
