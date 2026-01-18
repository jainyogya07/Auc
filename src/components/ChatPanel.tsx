import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../store/useAuctionStore';
import { MessageSquare, Send } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    time: number;
}

interface ChatPanelProps {
    senderName: string;
    className?: string;
}

export function ChatPanel({ senderName, className }: ChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'welcome', sender: 'System', text: 'Chat connected.', time: Date.now() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const socket = getSocket();

        const handleMsg = (msg: ChatMessage) => {
            setMessages(prev => [...prev, msg].slice(-50)); // Keep last 50 messages
        };

        socket.on('chat:broadcast', handleMsg);
        return () => { socket.off('chat:broadcast', handleMsg); };
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const msg = {
            id: Math.random().toString(36).slice(2),
            sender: senderName,
            text: inputValue.trim(),
            time: Date.now()
        };

        // Optimistic update? No, let server broadcast back. 
        // Actually, server broadcasts to everyone including sender usually? 
        // Let's assume server broadcasts to all including sender.
        getSocket().emit('chat:message', msg);
        setInputValue('');
    };

    return (
        <div className={cn("bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden h-full min-h-[300px]", className)}>
            <div className="p-4 border-b border-slate-800 font-medium text-slate-300 flex items-center gap-2 bg-slate-900/50">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                Live Chat
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-950/30"
            >
                {messages.map((msg) => {
                    const isSystem = msg.sender === 'System';
                    const isMe = msg.sender === senderName;

                    return (
                        <div key={msg.id} className={cn("text-sm", isMe ? "text-right" : "text-left")}>
                            <div className={cn(
                                "inline-block px-3 py-2 rounded-lg max-w-[85%]",
                                isSystem ? "bg-slate-800/50 text-slate-400 italic w-full text-center" :
                                    isMe ? "bg-emerald-500/20 text-emerald-100 rounded-tr-none border border-emerald-500/20" :
                                        "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                            )}>
                                {!isSystem && !isMe && <div className="text-[10px] font-bold text-slate-500 mb-1">{msg.sender}</div>}
                                <div>{msg.text}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-slate-800 flex gap-2 bg-slate-900">
                <input
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder={`Message as ${senderName}...`}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
