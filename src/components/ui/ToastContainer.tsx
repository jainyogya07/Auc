import { AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore';
import { Toast } from './Toast';

export const ToastContainer = () => {
    const toasts = useToastStore((state) => state.toasts);

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none p-4 md:p-0 w-full md:w-auto items-center md:items-end">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} />
                ))}
            </AnimatePresence>
        </div>
    );
};
