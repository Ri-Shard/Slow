import { Colors } from '@/constants/Colors';
import { AIService } from '@/services/aiService';
import { UsageStatsService } from '@/services/usageStats';
import { useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Brain, CheckCircle, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { AppState, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [imagesEnabled, setImagesEnabled] = useState(true);
    const [questionsEnabled, setQuestionsEnabled] = useState(true);
    const [quotesEnabled, setQuotesEnabled] = useState(false);

    const [hasUsagePermission, setHasUsagePermission] = useState(true);
    const [hasNotificationPermission, setHasNotificationPermission] = useState(true);
    const [hasOverlayPermission, setHasOverlayPermission] = useState(true);
    const [isAIAvailable, setIsAIAvailable] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const checkStatus = async () => {
        const usage = await UsageStatsService.checkPermission();
        setHasUsagePermission(usage);

        const overlay = await UsageStatsService.canDrawOverlays();
        setHasOverlayPermission(overlay);

        const ai = await AIService.isModelAvailable();
        setIsAIAvailable(ai);
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        setDownloadProgress(0);
        try {
            console.log('Initiating download via AIService...');
            const success = await AIService.downloadModel((progress) => {
                setDownloadProgress(progress);
            });

            if (success) {
                console.log('Download success, updating status');
                await checkStatus();
                alert('La IA ha sido descargada correctamente.');
            } else {
                console.warn('Download returned success=false');
                alert('Error al descargar el modelo. Revisa tu conexión a internet.');
            }
        } catch (err) {
            console.error('Error in handleDownload:', err);
            alert('Error inesperado durante la descarga.');
        } finally {
            setIsDownloading(false);
        }
    };

    useEffect(() => {
        checkStatus();

        // Re-check when app comes to foreground
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                checkStatus();
            }
        });

        return () => subscription.remove();
    }, []);

    const openUsageSettings = () => {
        UsageStatsService.requestPermission();
    };

    const openOverlaySettings = () => {
        UsageStatsService.requestOverlayPermission();
    };

    const openAppSettings = () => {
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
        } else {
            Linking.openSettings();
        }
    };

    return (
        <ScrollView
            style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ArrowLeft color={Colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configuración</Text>
                <View style={{ width: 24 }} />
            </View>

            <Text style={styles.sectionTitle}>Tipos de Intervención</Text>
            <Text style={styles.sectionDesc}>Elige qué tipo de pausas quieres ver al desbloquear tu móvil.</Text>

            <View style={styles.card}>
                <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTitle}>Imágenes de Calma</Text>
                        <Text style={styles.settingDesc}>Paisajes y texturas relajantes</Text>
                    </View>
                    <Switch
                        value={imagesEnabled}
                        onValueChange={setImagesEnabled}
                        trackColor={{ false: Colors.secondary, true: Colors.accentPrimary }}
                        thumbColor={'#fff'}
                    />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTitle}>Preguntas Reflexivas</Text>
                        <Text style={styles.settingDesc}>&quot;¿Qué necesitas ahora mismo?&quot;</Text>
                    </View>
                    <Switch
                        value={questionsEnabled}
                        onValueChange={setQuestionsEnabled}
                        trackColor={{ false: Colors.secondary, true: Colors.accentPrimary }}
                        thumbColor={'#fff'}
                    />
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTitle}>Frases Inspiradoras</Text>
                        <Text style={styles.settingDesc}>Citas sobre consciencia y tiempo</Text>
                    </View>
                    <Switch
                        value={quotesEnabled}
                        onValueChange={setQuotesEnabled}
                        trackColor={{ false: Colors.secondary, true: Colors.accentPrimary }}
                        thumbColor={'#fff'}
                    />
                </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Permisos del Sistema</Text>
            <Text style={styles.sectionDesc}>Configuraciones críticas para que Slow funcione correctamente.</Text>

            <View style={styles.card}>
                <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.settingTitle}>Acceso a Datos de Uso</Text>
                            {hasUsagePermission ? (
                                <CheckCircle size={14} color={Colors.success} />
                            ) : (
                                <AlertTriangle size={14} color={Colors.warning} />
                            )}
                        </View>
                        <Text style={styles.settingDesc}>Necesario para detectar desbloqueos</Text>
                    </View>
                    {!hasUsagePermission && (
                        <TouchableOpacity
                            style={styles.fixButton}
                            onPress={openUsageSettings}
                        >
                            <Text style={styles.fixButtonText}>Configurar</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTitle}>Notificaciones</Text>
                        <Text style={styles.settingDesc}>Para mostrarte la pausa al desbloquear</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.fixButton}
                        onPress={openAppSettings}
                    >
                        <Text style={styles.fixButtonText}>Ajustes</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.settingTitle}>Apertura Automática</Text>
                            {hasOverlayPermission ? (
                                <CheckCircle size={14} color={Colors.success} />
                            ) : (
                                <AlertTriangle size={14} color={Colors.warning} />
                            )}
                        </View>
                        <Text style={styles.settingDesc}>Permite que Slow salte directo al desbloquear</Text>
                    </View>
                    {!hasOverlayPermission && (
                        <TouchableOpacity
                            style={styles.fixButton}
                            onPress={openOverlaySettings}
                        >
                            <Text style={styles.fixButtonText}>Configurar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>IA Local (Cactus)</Text>
            <Text style={styles.sectionDesc}>Personalización inteligente sin salir de tu móvil.</Text>

            <View style={styles.card}>
                <View style={styles.settingRow}>
                    <View style={styles.settingTextContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.settingTitle}>Motor de Reflexión AI</Text>
                            {isAIAvailable ? (
                                <CheckCircle size={14} color={Colors.success} />
                            ) : (
                                <AlertTriangle size={14} color={Colors.warning} />
                            )}
                        </View>
                        <Text style={styles.settingDesc}>
                            {isDownloading ? `Descargando: ${Math.round(downloadProgress * 100)}%` :
                                isAIAvailable ? 'Activo y privado' : 'Modelo no encontrado'}
                        </Text>
                    </View>
                    {!isAIAvailable && !isDownloading && (
                        <TouchableOpacity
                            style={styles.fixButton}
                            onPress={handleDownload}
                        >
                            <Brain size={16} color={Colors.accentPrimary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.dangerZone}>
                <TouchableOpacity style={styles.resetButton}>
                    <RefreshCw color={Colors.warning} size={20} />
                    <Text style={styles.resetText}>Restablecer aprendizaje</Text>
                </TouchableOpacity>
                <Text style={styles.resetDesc}>Esta acción borrará tu historial de preferencias y efectividad de intervenciones local.</Text>
            </View>
        </ScrollView>
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
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: Colors.text,
        marginBottom: 4,
    },
    sectionDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: Colors.textSoft,
        marginBottom: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    settingTextContainer: {
        flex: 1,
        paddingRight: 16,
    },
    settingTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: Colors.text,
        marginBottom: 2,
    },
    settingDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: Colors.textSoft,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.background,
        marginVertical: 4,
    },
    dangerZone: {
        marginTop: 40,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF0ED', // Reddish subtle background
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        marginBottom: 8,
    },
    resetText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: Colors.warning,
    },
    resetDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: Colors.textSoft,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    fixButton: {
        backgroundColor: Colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    fixButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: Colors.accentPrimary,
    },
});
