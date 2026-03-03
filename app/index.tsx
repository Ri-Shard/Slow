import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { PlayCircle, Settings } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
    const router = useRouter();

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
                <Text style={styles.statsTitle}>Racha Actual</Text>
                <Text style={styles.statsValue}>0 Días</Text>
                <Text style={styles.statsLabel}>Tiempo rescatado hoy: 0 min. Toca para ver detalle.</Text>
            </TouchableOpacity>

            <View style={styles.actionContainer}>
                <Text style={styles.actionPrompt}>¿Quieres probar una pausa?</Text>
                <TouchableOpacity
                    style={styles.simulateButton}
                    onPress={() => router.push('/pause')}
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
});
