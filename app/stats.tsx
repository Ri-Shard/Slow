import { Colors } from '@/constants/Colors';
import { getRecentUnlocks, UnlockRecord } from '@/services/database/schema';
import { UsageStatsService } from '@/services/usageStats';
import { useRouter } from 'expo-router';
import { ArrowLeft, Database, Key } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StatsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [unlocks, setUnlocks] = useState<UnlockRecord[]>([]);
    const [hasPermission, setHasPermission] = useState<boolean>(false);

    useEffect(() => {
        loadData();
        checkPermissions();
    }, []);

    const loadData = async () => {
        const data = await getRecentUnlocks();
        setUnlocks(data);
    };

    const checkPermissions = async () => {
        const perm = await UsageStatsService.checkPermission();
        setHasPermission(perm);
    };

    const handleRequestPermission = () => {
        UsageStatsService.requestPermission();
        // Re-check after a brief timeout (user might return)
        setTimeout(checkPermissions, 5000);
    };

    return (
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Estadísticas Reales</Text>
                <TouchableOpacity onPress={loadData} style={styles.backButton}>
                    <Database color={Colors.textSoft} size={20} />
                </TouchableOpacity>
            </View>

            {!hasPermission && (
                <View style={styles.permissionCard}>
                    <Key color={Colors.warning} size={24} style={{ marginBottom: 8 }} />
                    <Text style={styles.permissionTitle}>Permiso Requerido</Text>
                    <Text style={styles.permissionDesc}>
                        Para registrar qué aplicaciones abres, necesitas otorgar permisos de Uso de Datos en Android.
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
                        <Text style={styles.permissionButtonText}>Otorgar Permiso</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Text style={styles.sectionTitle}>Últimos Desbloqueos ({unlocks.length})</Text>

            {unlocks.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No hay registros todavía.</Text>
                    <Text style={styles.emptyStateSub}>Bloquea y desbloquea tu teléfono.</Text>
                </View>
            ) : (
                <FlatList
                    data={unlocks}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    renderItem={({ item }) => (
                        <View style={styles.recordCard}>
                            <View>
                                <Text style={styles.recordTimestamp}>
                                    {new Date(item.timestamp).toLocaleString('es-ES')}
                                </Text>
                                <Text style={styles.recordType}>
                                    Intervención: {item.intervention_type}
                                </Text>
                            </View>
                            <View style={[styles.badge, item.skipped ? styles.badgeSkipped : styles.badgeEngaged]}>
                                <Text style={[styles.badgeText, item.skipped ? styles.badgeTextSkipped : styles.badgeTextEngaged]}>
                                    {item.skipped ? 'Omitido' : 'Consciente'}
                                </Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 24,
        color: Colors.text,
    },
    permissionCard: {
        backgroundColor: '#FFF0ED',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.warning,
    },
    permissionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.warning,
        marginBottom: 4,
    },
    permissionDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSoft,
        textAlign: 'center',
        marginBottom: 16,
    },
    permissionButton: {
        backgroundColor: Colors.warning,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    permissionButtonText: {
        fontFamily: 'Inter_600SemiBold',
        color: 'white',
        fontSize: 14,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
        marginBottom: 16,
    },
    recordCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 1,
        shadowColor: Colors.textSoft,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    recordTimestamp: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: Colors.text,
        marginBottom: 4,
    },
    recordType: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textSoft,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    badgeSkipped: {
        backgroundColor: '#FFEBEA',
    },
    badgeEngaged: {
        backgroundColor: '#E8F5E9',
    },
    badgeText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
    },
    badgeTextSkipped: {
        color: Colors.warning,
    },
    badgeTextEngaged: {
        color: Colors.success,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    emptyStateText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.textSoft,
    },
    emptyStateSub: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSoft,
        marginTop: 8,
    }
});
