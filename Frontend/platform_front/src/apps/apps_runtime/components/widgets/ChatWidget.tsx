import React, { useState, useRef, useEffect } from 'react';
import {
    Box, TextField, IconButton, Stack,
    Typography, Paper, Avatar, alpha,
    Menu, MenuItem, Divider, Tooltip
} from '@mui/material';
import { Send, User, Bot, Sparkles, Plus, ChevronDown, MessageSquare } from 'lucide-react';
import { useWorkflowChat, useChatHistory, useChatConversations } from '../../../workflows/api/queries';
import { useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatWidgetProps {
    nodeId: string;
    workflowId: string;
    agentId?: string;
    contextNodeIds?: string[];
}

/** Clean raw LaTeX from AI responses into readable plain text */
const cleanLatex = (text: string): string => {
    if (!text || !text.includes('\\')) return text;
    let t = text;
    // Remove display/inline math delimiters
    t = t.replace(/\\\[/g, '').replace(/\\\]/g, '');
    t = t.replace(/\\\(/g, '').replace(/\\\)/g, '');
    // \text{...} -> contents
    t = t.replace(/\\text\{([^}]*)\}/g, '$1');
    t = t.replace(/\\textbf\{([^}]*)\}/g, '**$1**');
    // \frac{a}{b} -> (a / b) — multiple passes for nesting
    for (let i = 0; i < 5; i++) t = t.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1 / $2)');
    // \sqrt{x} -> √(x)
    t = t.replace(/\\sqrt\{([^}]*)\}/g, '√($1)');
    // Symbols
    t = t.replace(/\\times/g, '×').replace(/\\cdot/g, '·');
    t = t.replace(/\\pm/g, '±').replace(/\\div/g, '÷');
    t = t.replace(/\\leq/g, '≤').replace(/\\geq/g, '≥');
    t = t.replace(/\\neq/g, '≠').replace(/\\approx/g, '≈');
    t = t.replace(/\\infty/g, '∞').replace(/\\%/g, '%');
    // \left( and \right) -> just parens
    t = t.replace(/\\left\s*([([{|])/g, '$1');
    t = t.replace(/\\right\s*([)\]}|])/g, '$1');
    t = t.replace(/\\left\s*\\./g, '').replace(/\\right\s*\\./g, '');
    // Superscripts: x^{2} -> x²
    const sups: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', 'n': 'ⁿ' };
    t = t.replace(/\^\{([^}]*)\}/g, (_, e) => e.length === 1 && sups[e] ? sups[e] : `^(${e})`);
    // Subscripts: x_{i} -> x_i
    t = t.replace(/_\{([^}]*)\}/g, '_$1');
    // Greek letters
    const greek: Record<string, string> = { '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε', '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ', '\\pi': 'π', '\\sigma': 'σ', '\\phi': 'φ', '\\omega': 'ω', '\\sum': 'Σ', '\\int': '∫', '\\partial': '∂', '\\nabla': '∇' };
    Object.entries(greek).forEach(([k, v]) => { t = t.replaceAll(k, v); });
    // Remaining \command{...} -> contents
    t = t.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1');
    // Remaining bare \commands
    t = t.replace(/\\([a-zA-Z]{2,})/g, '$1');
    // Clean extra spaces
    t = t.replace(/ {2,}/g, ' ');
    return t;
};

const defaultWelcome: Message = {
    id: 'welcome',
    role: 'assistant',
    content: `Hello! How can I assist you today?`,
    timestamp: new Date()
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ nodeId, workflowId, agentId, contextNodeIds }) => {
    const [messages, setMessages] = useState<Message[]>([defaultWelcome]);
    const [input, setInput] = useState('');
    const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const chatMutation = useWorkflowChat();
    const queryClient = useQueryClient();

    const { data: conversations } = useChatConversations(workflowId, nodeId);
    const { data: historyData } = useChatHistory(workflowId, nodeId, activeConversationId);

    const hasInitialized = useRef(false);

    // Auto-select the latest conversation only on initial load
    useEffect(() => {
        if (conversations && conversations.length > 0 && !activeConversationId && !hasInitialized.current) {
            setActiveConversationId(conversations[0].id);
            hasInitialized.current = true;
        }
    }, [conversations, activeConversationId]);

    // Load persisted chat history when data arrives
    useEffect(() => {
        if (!activeConversationId) {
            setMessages([defaultWelcome]);
            return;
        }

        if (historyData?.messages && historyData.messages.length > 0) {
            const loaded: Message[] = historyData.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.timestamp),
            }));
            setMessages([defaultWelcome, ...loaded]);
        } else {
            setMessages([defaultWelcome]);
        }
    }, [historyData, activeConversationId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, chatMutation.isPending]);

    const handleNewChat = () => {
        setActiveConversationId(undefined);
        setMessages([defaultWelcome]);
        setMenuAnchor(null);
    };

    const handleSelectConversation = (convId: string) => {
        setActiveConversationId(convId);
        setMenuAnchor(null);
    };

    const handleSend = async () => {
        if (!input.trim() || chatMutation.isPending) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');

        try {
            const response = await chatMutation.mutateAsync({
                workflowId,
                nodeId,
                message: currentInput,
                agentId,
                contextNodeIds,
                conversationId: activeConversationId
            });

            if (response.conversation_id) {
                setActiveConversationId(response.conversation_id);
                queryClient.invalidateQueries({ queryKey: ['chatConversations', workflowId, nodeId] });
            }

            const assistantMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: response.content || "I've processed your request.",
                timestamp: response.timestamp ? new Date(response.timestamp) : new Date()
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (error: any) {
            const errorMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Error: ${error.response?.data?.error || "Failed to connect to agent"}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    // Current conversation title
    const activeConv = conversations?.find((c: any) => c.id === activeConversationId);
    const headerTitle = activeConv?.title || 'New Conversation';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>
            {/* Header — matches widget card style */}
            <Box sx={{
                px: 2, py: 1.2,
                borderBottom: '1px solid',
                borderColor: alpha('#111827', 0.04),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: alpha('#f8fafc', 0.5),
                flexShrink: 0,
            }}>
                <Box
                    onClick={(e) => conversations && conversations.length > 0 ? setMenuAnchor(e.currentTarget) : null}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.8,
                        cursor: conversations?.length ? 'pointer' : 'default',
                        px: 0.8, py: 0.4,
                        borderRadius: '6px',
                        transition: 'all 0.15s ease',
                        '&:hover': conversations?.length ? {
                            bgcolor: alpha('#111827', 0.03),
                        } : {},
                    }}
                >
                    <Box sx={{
                        width: 22, height: 22, borderRadius: '5px',
                        bgcolor: alpha('#8b5cf6', 0.08),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <MessageSquare size={12} color="#8b5cf6" />
                    </Box>
                    <Typography sx={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 200,
                    }}>
                        {headerTitle}
                    </Typography>
                    {conversations && conversations.length > 0 && (
                        <ChevronDown size={13} style={{ color: alpha('#111827', 0.3), flexShrink: 0 }} />
                    )}
                </Box>

                <Tooltip title="New Chat" arrow>
                    <IconButton size="small" onClick={handleNewChat} sx={{
                        p: '4px', borderRadius: '6px',
                        color: alpha('#111827', 0.3),
                        '&:hover': { bgcolor: alpha('#111827', 0.04), color: '#111827' }
                    }}>
                        <Plus size={15} />
                    </IconButton>
                </Tooltip>

                {/* Conversation switcher menu */}
                <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => setMenuAnchor(null)}
                    PaperProps={{
                        sx: {
                            mt: 0.5,
                            minWidth: 220,
                            borderRadius: '10px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            border: '1px solid',
                            borderColor: alpha('#111827', 0.06),
                        }
                    }}
                >
                    <Typography sx={{ px: 2, py: 0.8, fontSize: '0.62rem', fontWeight: 700, color: alpha('#111827', 0.35), textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Conversations
                    </Typography>
                    {conversations?.map((conv: any) => (
                        <MenuItem
                            key={conv.id}
                            selected={conv.id === activeConversationId}
                            onClick={() => handleSelectConversation(conv.id)}
                            sx={{
                                fontSize: '0.78rem',
                                py: 0.8,
                                borderRadius: '6px',
                                mx: 0.5,
                                '&.Mui-selected': {
                                    bgcolor: alpha('#111827', 0.04),
                                    color: '#111827',
                                    fontWeight: 600,
                                }
                            }}
                        >
                            <Box>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: conv.id === activeConversationId ? 600 : 400 }}>
                                    {conv.title || 'Untitled Chat'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.58rem', color: alpha('#111827', 0.3) }}>
                                    {new Date(conv.updated_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))}
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={handleNewChat} sx={{
                        fontSize: '0.78rem', color: '#111827', fontWeight: 600,
                        borderRadius: '6px', mx: 0.5,
                    }}>
                        <Plus size={14} style={{ marginRight: 8 }} /> New Chat
                    </MenuItem>
                </Menu>
            </Box>

            {/* Messages Area */}
            <Box
                ref={scrollRef}
                sx={{
                    flexGrow: 1,
                    p: 2.5,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    bgcolor: alpha('#f8fafc', 0.4)
                }}
            >
                {messages.map((m) => (
                    <Box
                        key={m.id}
                        sx={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            display: 'flex',
                            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                            gap: 1.2
                        }}
                    >
                        <Avatar sx={{
                            width: 28,
                            height: 28,
                            bgcolor: m.role === 'user' ? '#111827' : '#fff',
                            color: m.role === 'user' ? '#fff' : '#111827',
                            border: m.role === 'assistant' ? '1px solid' : 'none',
                            borderColor: alpha('#111827', 0.08),
                            fontSize: '0.75rem',
                        }}>
                            {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </Avatar>

                        <Box>
                            <Paper sx={{
                                p: 1.5,
                                borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                                bgcolor: m.role === 'user' ? '#111827' : '#fff',
                                color: m.role === 'user' ? '#fff' : '#111827',
                                boxShadow: 'none',
                                border: m.role === 'assistant' ? '1px solid' : 'none',
                                borderColor: alpha('#111827', 0.06),
                            }}>
                                <Box className="markdown-content" sx={{
                                    fontSize: '0.82rem',
                                    lineHeight: 1.55,
                                    '& p': { m: 0, mb: m.role === 'assistant' ? 1 : 0 },
                                    '& p:last-child': { mb: 0 },
                                    '& table': { borderCollapse: 'collapse', my: 1, width: m.role === 'assistant' ? '100%' : 'auto' },
                                    '& th, & td': { border: `1px solid ${alpha('#111827', 0.1)}`, p: 0.5, fontSize: '0.75rem' },
                                    '& .katex-display': { my: 1, overflow: 'auto hidden' }
                                }}>
                                    <ReactMarkdown>
                                        {cleanLatex(m.content)}
                                    </ReactMarkdown>
                                </Box>
                            </Paper>
                            <Typography sx={{
                                fontSize: '0.6rem',
                                color: alpha('#111827', 0.3),
                                mt: 0.4,
                                textAlign: m.role === 'user' ? 'right' : 'left'
                            }}>
                                {m.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </Typography>
                        </Box>
                    </Box>
                ))}

                {chatMutation.isPending && (
                    <Box sx={{ alignSelf: 'flex-start', display: 'flex', gap: 1.2, alignItems: 'center' }}>
                        <Avatar sx={{
                            width: 28, height: 28, bgcolor: '#fff', color: '#111827',
                            border: '1px solid', borderColor: alpha('#111827', 0.08)
                        }}>
                            <Bot size={14} />
                        </Avatar>
                        <Stack direction="row" spacing={0.5} sx={{
                            p: 1, px: 1.5, bgcolor: '#fff', borderRadius: '10px',
                            border: '1px solid', borderColor: alpha('#111827', 0.06)
                        }}>
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: alpha('#111827', 0.25), animation: 'bounce 1s infinite' }} />
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: alpha('#111827', 0.25), animation: 'bounce 1s infinite 0.2s' }} />
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: alpha('#111827', 0.25), animation: 'bounce 1s infinite 0.4s' }} />
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: alpha('#111827', 0.04), bgcolor: '#fff' }}>
                <Stack direction="row" spacing={1}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                bgcolor: alpha('#f8fafc', 0.8),
                                fontSize: '0.82rem',
                                '& fieldset': { borderColor: alpha('#111827', 0.06) },
                                '&:hover fieldset': { borderColor: alpha('#111827', 0.12) },
                                '&.Mui-focused fieldset': { borderColor: alpha('#111827', 0.2) },
                            }
                        }}
                    />
                    <IconButton
                        onClick={handleSend}
                        disabled={!input.trim() || chatMutation.isPending}
                        sx={{
                            bgcolor: '#111827', color: '#fff',
                            '&:hover': { bgcolor: '#000' },
                            '&.Mui-disabled': { bgcolor: alpha('#111827', 0.15), color: alpha('#fff', 0.5) },
                            borderRadius: '8px',
                            width: 38, height: 38,
                            flexShrink: 0,
                        }}
                    >
                        <Send size={16} />
                    </IconButton>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 0.8, justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.25 }}>
                        <Sparkles size={10} />
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 600 }}>AI Powered</Typography>
                    </Box>
                </Stack>
            </Box>

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
            `}</style>
        </Box>
    );
};

export default ChatWidget;
