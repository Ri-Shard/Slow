import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { PlayCircle, Settings } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getSkippedUnlocksCountToday, getTopApps } from '@/services/database/schema';
import { getAppReadableName } from '@/utils/formatters';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';

export default function HomeScreen() {
    const router = useRouter();
    const [savedMinutes, setSavedMinutes] = useState(0);
    const [skippedCount, setSkippedCount] = useState(0);
    const [topApps, setTopApps] = useState<{ app_opened: string, unlocks: number }[]>([]);

    const loadData = async () => {
        const count = await getSkippedUnlocksCountToday();
        setSkippedCount(count);
        setSavedMinutes(count * 15);

        const apps = await getTopApps(3);
        setTopApps(apps);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Hola, Bienvenido</Text>
                <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconButton}>
                    <Settings color={Colors.textSoft} size={24} />
                </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Tu compañero de consciencia digital</Text>

            <TouchableOpacity
                style={styles.statsCard}
                activeOpacity={0.8}
                onPress={() => router.push('/stats')}
            >
                <Text style={styles.statsTitle}>Tiempo Ahorrado Hoy</Text>
                <Text style={styles.statsValue}>{savedMinutes} Min</Text>
                <Text style={styles.statsLabel}>Has evitado {skippedCount} distracciones hoy.</Text>
            </TouchableOpacity>

            {topApps.length > 0 && (
                <View style={styles.dashboardSection}>
                    <Text style={styles.sectionTitle}>Apps más usadas hoy</Text>
                    {topApps.map((app, index) => (
                        <View key={index} style={styles.appRow}>
                            <Text style={styles.appName}>{getAppReadableName(app.app_opened)}</Text>
                            <Text style={styles.appCount}>{app.unlocks} veces</Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.actionContainer}>
                <Text style={styles.actionPrompt}>¿Quieres probar una pausa?</Text>
                <TouchableOpacity
                    style={styles.simulateButton}
                    onPress={() => router.push({ pathname: '/pause', params: { simulated: 'true' } })}
                    activeOpacity={0.8}
                >
                    <PlayCircle color="white" size={20} />
                    <Text style={styles.simulateButtonText}>Simular Desbloqueo</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 24,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconButton: {
        padding: 8,
    },
    greeting: {
        color: Colors.text,
        fontSize: 28,
        fontFamily: 'CormorantGaramond_600SemiBold',
    },
    subtitle: {
        color: Colors.textSoft,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        marginBottom: 40,
    },
    statsCard: {
        backgroundColor: Colors.secondary,
        borderRadius: 20,
        padding: 24,
        marginBottom: 40,
        alignItems: 'center',
    },
    statsTitle: {
        color: Colors.textSoft,
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    statsValue: {
        color: Colors.accentPrimary,
        fontSize: 48,
        fontFamily: 'CormorantGaramond_600SemiBold',
        marginBottom: 8,
    },
    statsLabel: {
        color: Colors.success,
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
    },
    actionContainer: {
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    actionPrompt: {
        color: Colors.textSoft,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        marginBottom: 16,
    },
    simulateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.accentPrimary,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 30,
        gap: 8,
    },
    simulateButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    dashboardSection: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 16,
    },
    appRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.background,
    },
    appName: {
        color: Colors.text,
        fontSize: 15,
        fontFamily: 'Inter_400Regular',
    },
    appCount: {
        color: Colors.accentPrimary,
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
    },
});
