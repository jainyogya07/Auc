import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { type Toast as ToastType, useToastStore } from '../../store/useToastStore';
import { cn } from '../../lib/utils';

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const colors = {
    success: 'bg-emerald-500/10 border-emerald-500 text-emerald-400',
    error: 'bg-rose-500/10 border-rose-500 text-rose-400',
    warning: 'bg-amber-500/10 border-amber-500 text-amber-400',
    info: 'bg-blue-500/10 border-blue-500 text-blue-400',
};

const iconColors = {
    success: 'text-emerald-500',
    error: 'text-rose-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
};

interface ToastProps {
    toast: ToastType;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
    const removeToast = useToastStore((state) => state.removeToast);
    const Icon = icons[toast.type];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
                "relative overflow-hidden flex items-start gap-4 p-4 rounded-xl border backdrop-blur-md shadow-2xl min-w-[320px] max-w-md pointer-events-auto",
                colors[toast.type]
            )}
        >
            <Icon className={cn("w-6 h-6 shrink-0 mt-0.5", iconColors[toast.type])} />
            <div className="flex-1 z-10">
                <p className="font-bold text-sm md:text-base leading-tight mb-1 capitalize tracking-wide opacity-90">
                    {toast.type === 'info' ? 'Update' : toast.type}
                </p>
                <p className="font-medium text-sm md:text-base opacity-90">{toast.message}</p>
            </div>
            <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-lg z-10"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Progress Bar */}
            {toast.duration && toast.duration > 0 && (
                <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: toast.duration / 1000, ease: "linear" }}
                    className={cn(
                        "absolute bottom-0 left-0 h-1 bg-current opacity-30",
                        iconColors[toast.type].replace('text-', 'bg-')
                    )}
                />
            )}
        </motion.div>
    );
};
