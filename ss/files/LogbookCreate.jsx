// resources/js/Pages/Logbook/Create.jsx

import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Calendar, 
    MapPin, 
    FileText, 
    Image as ImageIcon, 
    X,
    Upload,
    Loader2,
    CheckCircle2
} from 'lucide-react';

export default function CreateLogbook({ auth, group }) {
    const [previewImages, setPreviewImages] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { data, setData, post, processing, errors, progress } = useForm({
        activity_date: '',
        village: group.village || '',
        activity_type: 'Pending',
        activity_description: '',
        documentation: [],
    });

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        // Validate file size (max 5MB per file)
        const validFiles = files.filter(file => {
            if (file.size > 5242880) {
                alert(`${file.name} exceeds 5MB limit`);
                return false;
            }
            return true;
        });

        // Create preview URLs
        const newPreviews = validFiles.map(file => ({
            file,
            url: URL.createObjectURL(file),
            name: file.name
        }));

        setPreviewImages(prev => [...prev, ...newPreviews]);
        setData('documentation', [...data.documentation, ...validFiles]);
    };

    const removeImage = (index) => {
        const newPreviews = previewImages.filter((_, i) => i !== index);
        const newFiles = data.documentation.filter((_, i) => i !== index);
        
        // Revoke object URL to prevent memory leaks
        URL.revokeObjectURL(previewImages[index].url);
        
        setPreviewImages(newPreviews);
        setData('documentation', newFiles);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        post(route('logbook.store'), {
            forceFormData: true,
            onProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress(percentCompleted);
            },
            onSuccess: () => {
                setPreviewImages([]);
                setUploadProgress(0);
            },
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Create Logbook Entry" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            New Logbook Entry
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Record your daily KKN activities
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <GlassCard>
                            <div className="space-y-6">
                                {/* Activity Date */}
                                <FormField
                                    label="Activity Date"
                                    icon={Calendar}
                                    error={errors.activity_date}
                                >
                                    <input
                                        type="date"
                                        value={data.activity_date}
                                        onChange={e => setData('activity_date', e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </FormField>

                                {/* Village */}
                                <FormField
                                    label="Village (Desa)"
                                    icon={MapPin}
                                    error={errors.village}
                                >
                                    <input
                                        type="text"
                                        value={data.village}
                                        onChange={e => setData('village', e.target.value)}
                                        placeholder="Enter village name"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </FormField>

                                {/* Activity Type */}
                                <FormField
                                    label="Activity Type"
                                    icon={CheckCircle2}
                                    error={errors.activity_type}
                                >
                                    <div className="grid grid-cols-3 gap-3">
                                        {['ACC', 'Tolak', 'Pending'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setData('activity_type', type)}
                                                className={`
                                                    px-4 py-3 rounded-xl font-medium transition-all
                                                    ${data.activity_type === type
                                                        ? 'bg-blue-500 text-white shadow-lg scale-105'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                    }
                                                `}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </FormField>

                                {/* Activity Description */}
                                <FormField
                                    label="Activity Description"
                                    icon={FileText}
                                    error={errors.activity_description}
                                >
                                    <textarea
                                        value={data.activity_description}
                                        onChange={e => setData('activity_description', e.target.value)}
                                        rows={6}
                                        placeholder="Describe your activities in detail..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        required
                                    />
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        {data.activity_description.length} characters
                                    </p>
                                </FormField>

                                {/* Documentation Upload */}
                                <FormField
                                    label="Documentation (Photos)"
                                    icon={ImageIcon}
                                    error={errors.documentation}
                                >
                                    <div className="space-y-4">
                                        {/* Upload Button */}
                                        <label className="block">
                                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer group">
                                                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Click to upload or drag and drop
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    PNG, JPG up to 5MB each
                                                </p>
                                            </div>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>

                                        {/* Preview Grid */}
                                        {previewImages.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {previewImages.map((preview, index) => (
                                                    <div 
                                                        key={index}
                                                        className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800"
                                                    >
                                                        <img
                                                            src={preview.url}
                                                            alt={preview.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Upload Progress */}
                                        {processing && uploadProgress > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">
                                                        Uploading...
                                                    </span>
                                                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                        {uploadProgress}%
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </FormField>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4 mt-8">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>Submit Entry</span>
                                        </>
                                    )}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </GlassCard>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// Glass Card Component
function GlassCard({ children, className = '' }) {
    return (
        <div className={`
            backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 
            border border-white/20 dark:border-slate-700/50
            rounded-2xl p-8 
            shadow-xl shadow-black/5
            ${className}
        `}>
            {children}
        </div>
    );
}

// Form Field Component
function FormField({ label, icon: Icon, error, children }) {
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {Icon && <Icon className="w-5 h-5" />}
                {label}
            </label>
            {children}
            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {error}
                </p>
            )}
        </div>
    );
}
