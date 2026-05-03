import React from 'react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
    const percentage = Math.round((currentStep / totalSteps) * 100);

    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Progres Validasi Kelayakan
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {percentage}%
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                <div 
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
                Langkah {currentStep} dari {totalSteps}
            </p>
        </div>
    );
}
