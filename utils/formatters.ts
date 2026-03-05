export const getAppReadableName = (packageName: string | null): string => {
    if (!packageName) return 'el móvil';
    if (packageName.includes('instagram')) return 'Instagram';
    if (packageName.includes('whatsapp')) return 'WhatsApp';
    if (packageName.includes('facebook')) return 'Facebook';
    if (packageName.includes('tiktok')) return 'TikTok';
    if (packageName.includes('musically')) return 'TikTok';
    if (packageName.includes('youtube')) return 'YouTube';
    if (packageName.includes('chrome')) return 'Chrome';
    return packageName.split('.').pop() || packageName;
};

export const getTimeOfDayContext = (hour: number): string => {
    if (hour < 6) return 'madrugada';
    if (hour < 12) return 'mañana';
    if (hour < 18) return 'tarde';
    return 'noche';
};
