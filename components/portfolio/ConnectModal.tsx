'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    startupName: string;
    onConfirm: (message: string) => Promise<void>;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
    isOpen,
    onClose,
    startupName,
    onConfirm
}) => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm(message);
            onClose();
        } catch (error) {
            console.error("Connection failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-2">Connect with {startupName}</h2>
                <p className="text-gray-400 text-sm mb-6">
                    This will notify the startup that you are interested in investing.
                    You can discuss details after they respond.
                </p>

                <textarea
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-6 h-32 resize-none"
                    placeholder="Add a message (optional)..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />

                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            console.log("ConnectModal: Send Request Clicked");
                            handleConfirm();
                        }}
                        isLoading={isLoading}
                    >
                        Send Request
                    </Button>
                </div>

            </div>
        </div>
    );
};
