import React from 'react';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

export function withRBAC<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    allowedRoles: string[]
) {
    return function WithRBACComponent(props: P) {
        const { auth } = usePage<PageProps>().props;
        const userRoles = auth.user?.roles ?? [];
        const hasAccess = userRoles.length > 0 && userRoles.some(role => allowedRoles.includes(role));

        if (!hasAccess) {
            return (
                <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-center">
                    <p className="text-red-600 font-bold uppercase tracking-widest text-xs">
                        Akses Ditolak
                    </p>
                    <p className="text-red-400 text-sm mt-2">
                        Anda tidak memiliki izin untuk melihat bagian ini.
                    </p>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
}
