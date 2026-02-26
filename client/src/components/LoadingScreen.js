import React from 'react';

const LoadingScreen = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-medium animate-pulse">Syncing your workspace...</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
