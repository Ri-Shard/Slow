import { Colors } from '@/constants/Colors';
import { AIService } from '@/services/aiService';
import { recordUnlock } from '@/services/database/schema';
import { UsageStatsService } from '@/services/usageStats';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PauseScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();

    // UI States
    const [question, setQuestion] = useState('¿Qué necesitas ahora mismo?');
    const [reflection, setReflection] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastApp, setLastApp] = useState<string | null>(null);
    const [unlockCount, setUnlockCount] = useState<number>(0);

    const options = ['Conexión', 'Distracción', 'Información', 'Calma'];

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getAppReadableName = (packageName: string | null) => {
        if (!packageName) return 'el móvil';
        if (packageName.includes('instagram')) return 'Instagram';
        if (packageName.includes('whatsapp')) return 'WhatsApp';
        if (packageName.includes('facebook')) return 'Facebook';
        if (packageName.includes('tiktok')) return 'TikTok';
        if (packageName.includes('youtube')) return 'YouTube';
        if (packageName.includes('chrome')) return 'Chrome';
        return packageName.split('.').pop() || packageName;
    };

    const handleGenerateReflection = async (appContext: string | null, history: any[], count: number, choice: string) => {
        setIsLoadingAI(true);
        // Pequeño retraso artificial para que la transición en la interfaz no sea tan brusca.
        await new Promise(resolve => setTimeout(resolve, 1500));

        let response = '';
        try {
            const { getTopApps } = require('@/services/database/schema');
            const apps = await getTopApps(3);
            const topAppsString = apps.map((a: any) => getAppReadableName(a.app_opened)).join(', ') || 'ninguna en especial';

            response = await AIService.generateReflection(appContext, choice, topAppsString);
        } catch (error) {
            console.error('Error generating reflection:', error);
            response = `Has elegido ${choice}. Tómate un respiro antes de continuar.`;
        }

        if (isFocused) {
            setReflection(response);
            setIsLoadingAI(false);
        }
    };

    const isInitializingRef = useRef(false);

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (isInitializingRef.current) return;
            isInitializingRef.current = true;

            try {
                console.log('PauseScreen: Initializing logic (Auto-dismiss enabled)...');

                const app = await UsageStatsService.getLastUsedApp();
                if (!isMounted) return;
                setLastApp(app);

                const { getRecentUnlocks, getTodayUnlockCount } = require('@/services/database/schema');
                const history = await getRecentUnlocks(10);
                const count = await getTodayUnlockCount();
                if (!isMounted) return;
                setUnlockCount(count + 1); // visually show count + 1 to account for current unlock

                // Show loading spinner while AI decides
                setIsLoadingAI(true);

                // Inject the current newly-occurred unlock into the checks natively
                const currentUnlock = {
                    id: -1,
                    timestamp: new Date().toISOString(),
                    app_opened: app,
                    skipped: false,
                    intervention_type: 'Evaluando...'
                };
                const adjustedHistory = [currentUnlock, ...history];
                const adjustedCount = count + 1;

                // Ask AI if we should intervene based on the unlock history and current app
                const shouldBlock = await AIService.shouldIntervene(adjustedHistory, app, adjustedCount);

                if (!isMounted || !isFocused) {
                    console.log('PauseScreen evaluated but is no longer focused. Aborting.');
                    return;
                }

                if (!shouldBlock) {
                    console.log('AI determined usage is intentional. Auto-dismissing...');
                    await recordUnlock('Automático (Permitido)', true, app);
                    handleDismiss(); // Auto-close seamlessly
                    return; // Stop execution
                }

                console.log('AI determined usage is compulsive. Waiting for user intention...');
                // Turn off loading so user can select their intention
                setIsLoadingAI(false);
            } catch (e) {
                if (isMounted && isFocused) {
                    console.error('Error in PauseScreen init:', e);
                    setIsLoadingAI(false);
                }
            } finally {
                isInitializingRef.current = false; // Allow re-init if remounted later
            }
        };
        init();

        return () => {
            isMounted = false;
            console.log('PauseScreen unmounted, aborting operations');
        };
    }, []); // Removed isFocused from dependencies to prevent re-evaluation every time focus changes, we just abort stale references

    const handleOptionSelect = async (option: string) => {
        console.log(`User selected: ${option}`);
        await recordUnlock(`Opción seleccionada: ${option}`, false, lastApp);

        // Instead of dismissing right away, we now fetch the reflection
        const { getRecentUnlocks, getTodayUnlockCount } = require('@/services/database/schema');
        const history = await getRecentUnlocks(10);
        const count = await getTodayUnlockCount();
        await handleGenerateReflection(lastApp, history, count, option);
    };

    const handleSkip = async () => {
        console.log('User skipped pause');
        await recordUnlock('Omitida explícitamente', true, lastApp);
        handleDismiss();
    };

    const handleDismiss = () => {
        console.log('User is continuing to the mobile...');
        // Let React Navigation transition back to index before minimizing the app
        router.replace('/');
        setTimeout(() => {
            const { BackHandler } = require('react-native');
            BackHandler.exitApp();
        }, 100);
    };

    const getDayName = () => {
        return currentTime.toLocaleDateString('es-ES', { weekday: 'long' });
    };

    const getFormattedTime = () => {
        return currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
            <View style={styles.header}>
                <Text style={styles.time}>{getFormattedTime()}</Text>
                <Text style={styles.day}>{getDayName()}</Text>
                {unlockCount > 0 && (
                    <Text style={styles.statsText}>{unlockCount} desbloqueos hoy</Text>
                )}
            </View>

            <View style={styles.imageContainer}>
                <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>[Imagen de Calma]</Text>
                </View>
            </View>

            <View style={styles.content}>
                {isLoadingAI ? (
                    <View style={{ alignItems: 'center', marginBottom: 24 }}>
                        <ActivityIndicator color={Colors.accentPrimary} size="large" />
                        <Text style={[styles.question, { marginTop: 16, fontSize: 16, opacity: 0.7 }]}>
                            Analizando tu intención...
                        </Text>
                    </View>
                ) : reflection ? (
                    <>
                        <Text style={[styles.question, { fontSize: 24, fontFamily: 'Inter_600SemiBold', color: Colors.accentPrimary }]}>
                            {reflection}
                        </Text>
                        <TouchableOpacity
                            style={styles.continueButton}
                            activeOpacity={0.7}
                            onPress={handleDismiss}
                        >
                            <Text style={styles.continueText}>Continuar al móvil</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.question}>{question}</Text>
                        <View style={styles.optionsGrid}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.optionButton}
                                    activeOpacity={0.7}
                                    onPress={() => handleOptionSelect(option)}
                                >
                                    <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.skipContainer}
                            activeOpacity={0.6}
                            onPress={handleSkip}
                        >
                            <Text style={styles.skipText}>Omitir esta vez</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
    },
    time: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 48,
        color: Colors.text,
    },
    day: {
        fontFamily: 'Inter_400Regular',
        fontSize: 18,
        color: Colors.textSoft,
        textTransform: 'capitalize',
        marginTop: -8,
        marginBottom: 8,
    },
    statsText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.accentPrimary,
        backgroundColor: Colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    imageContainer: {
        width: width * 0.75,
        aspectRatio: 1,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: Colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 30,
        elevation: 2,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: Colors.textSoft,
        fontFamily: 'Inter_400Regular',
        opacity: 0.5,
    },
    content: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    question: {
        fontFamily: 'Inter_400Regular',
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 24,
        color: Colors.text,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 32,
    },
    optionButton: {
        backgroundColor: Colors.accentPrimary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    optionText: {
        fontFamily: 'Inter_600SemiBold',
        color: 'white',
        fontSize: 15,
    },
    continueButton: {
        width: '100%',
        paddingVertical: 16,
        backgroundColor: Colors.secondary,
        borderRadius: 30,
        alignItems: 'center',
    },
    continueText: {
        fontFamily: 'Inter_600SemiBold',
        color: Colors.text,
        fontSize: 16,
    },
    skipContainer: {
        marginTop: 20,
        padding: 10,
    },
    skipText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSoft,
        textDecorationLine: 'underline',
        paddingBottom: 20,
    },
});
