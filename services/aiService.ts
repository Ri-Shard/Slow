import { getTimeOfDayContext } from '@/utils/formatters';
import { CactusLM } from 'cactus-react-native';
import { NitroModules } from 'react-native-nitro-modules';
import { UnlockRecord } from './database/schema';

export class AIService {
    private static instance: CactusLM | null = null;
    private static isInitializing = false;
    private static modelName = 'qwen3-0.6b';
    private static aiQueue: Promise<any> = Promise.resolve();

    private static async clearInstance() {
        try {
            if (this.instance) {
                console.log('AIService: Destroying instance...');
                await this.instance.destroy();
                this.instance = null;
            }
        } catch (e) {
            console.error('Error clearing AI instance:', e);
            this.instance = null;
        }
    }

    static async isModelAvailable(): Promise<boolean> {
        try {
            const cactus = new CactusLM({ model: this.modelName });
            const fs = NitroModules.createHybridObject<any>('CactusFileSystem');
            return await fs.modelExists(cactus.getModelName());
        } catch {
            return false;
        }
    }

    private static async runExclusive<T>(task: () => Promise<T>): Promise<T> {
        // Enqueue the next task safely, ensuring the previous one completes
        // or fails before we hand it over to CactusLM native module.
        const currentTask = this.aiQueue;
        const nextTask = currentTask.then(async () => {
            try {
                return await task();
            } catch (error) {
                console.error('AI Queue Task failed:', error);
                throw error;
            }
        });

        // Catch errors so the queue doesn't get permanently stuck
        this.aiQueue = nextTask.catch(() => { });
        return nextTask;
    }

    static async initialize(): Promise<boolean> {
        if (this.instance) return true;
        if (this.isInitializing) {
            while (this.isInitializing) {
                await new Promise(r => setTimeout(r, 100));
            }
            return this.instance !== null;
        }

        try {
            this.isInitializing = true;
            console.log('Initializing AIService...');
            const cactus = new CactusLM({ model: this.modelName });
            await cactus.init();
            this.instance = cactus;
            console.log('AIService ready');
            return true;
        } catch (error) {
            console.error('Initialization failed:', error);
            this.instance = null;
            return false;
        } finally {
            this.isInitializing = false;
        }
    }

    static async shouldIntervene(recentHistory: UnlockRecord[], currentApp: string | null, todayCount: number = 0): Promise<boolean> {
        // purely deterministic model for saving battery and instant decision
        const now = Date.now();
        let unlocksInLast5Mins = 0;
        let unlocksInLast15Mins = 0;

        for (const record of recentHistory) {
            const timeDiff = now - new Date(record.timestamp).getTime();
            if (timeDiff <= 5 * 60 * 1000) unlocksInLast5Mins++;
            if (timeDiff <= 15 * 60 * 1000) unlocksInLast15Mins++;
        }

        console.log(`Evaluating Hard Rules: ${unlocksInLast5Mins} unlocks in 5m, ${unlocksInLast15Mins} in 15m. Today: ${todayCount}`);

        if (unlocksInLast5Mins >= 2) {
            console.log('HARD RULE TRIGGERED: High frequency (≥2 in 5 mins). Forcing intervention.');
            return true;
        }

        if (unlocksInLast15Mins >= 4) {
            console.log('HARD RULE TRIGGERED: Sustained frequency (≥4 in 15 mins). Forcing intervention.');
            return true;
        }

        if (todayCount > 25) {
            console.log('HARD RULE TRIGGERED: Daily limit exceeded (>25 unlocks). Forcing intervention.');
            return true;
        }

        console.log('Behavior is not compulsive. Allowing access.');
        return false;
    }

    static async generateReflection(app: string | null, intent: string, topApps: string): Promise<string> {
        return this.runExclusive(async () => {
            if (!this.instance && !(await this.initialize())) {
                return `Has elegido ${intent}. Tómate un respiro antes de continuar.`;
            }

            try {
                const hour = new Date().getHours();
                const timeOfDay = getTimeOfDayContext(hour);
                const appName = app ? app.split('.').pop() : 'su móvil';

                const result = await this.instance!.complete({
                    messages: [
                        {
                            role: 'user',
                            content: `Son las ${hour}:00 (${timeOfDay}). El usuario iba a abrir ${appName} y eligió la intención "${intent}". Sus apps más usadas son ${topApps}. Como su compañero compasivo de consciencia digital, dale un consejo breve y empático (máximo 15 palabras) validando su intención y motivándolo a usar su tiempo con propósito. Responde DIRECTAMENTE con el mensaje, sin comillas, introducciones ni explicaciones.`
                        }
                    ],
                    options: {
                        maxTokens: 30,
                        temperature: 0.8,
                        stopSequences: ["\n", "<"]
                    }
                });

                if (!result || !result.success || !result.response) {
                    return `Has elegido ${intent}. Tómate un respiro antes de continuar.`;
                }

                let aiResponse = result.response.trim();

                if (aiResponse.includes('<think>')) {
                    const thinkEnd = aiResponse.indexOf('</think>');
                    if (thinkEnd !== -1) {
                        aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                    } else {
                        aiResponse = aiResponse.split('<think>')[0].trim();
                    }
                }

                // Clean up quotes
                if (aiResponse.startsWith('"') && aiResponse.endsWith('"')) {
                    aiResponse = aiResponse.slice(1, -1);
                }

                return aiResponse || `Has elegido ${intent}. Tómate un respiro antes de continuar.`;
            } catch (error) {
                console.error('Error in generateReflection:', error);
                return `Has elegido ${intent}. Tómate un respiro antes de continuar.`;
            }
        });
    }

    static async analyzeUsageLimit(app: string, durationMinutes: number): Promise<void> {
        console.log(`Analyzing usage limit for ${app} (${durationMinutes} mins) using AI...`);
        const timeoutPromise = new Promise<void>((resolve) =>
            setTimeout(() => {
                console.log('AI background decision timed out, sending default alert');
                const { UsageStatsService } = require('./usageStats');
                UsageStatsService.sendPassiveNotification(
                    "Alerta de Bienestar",
                    `Llevas ${durationMinutes} minutos en ${app}. ¿Quieres tomarte un respiro?`
                );
                resolve();
            }, 10000)
        );

        const aiPromise = this.runExclusive(async () => {
            if (!this.instance && !(await this.initialize())) {
                const { UsageStatsService } = require('./usageStats');
                UsageStatsService.sendPassiveNotification(
                    "Alerta de Bienestar",
                    `Llevas ${durationMinutes} minutos en ${app}. ¿Quieres tomarte un respiro?`
                );
                return;
            }

            try {
                const hour = new Date().getHours();
                const timeOfDay = getTimeOfDayContext(hour);

                const result = await this.instance!.complete({
                    messages: [
                        {
                            role: 'user',
                            content: `Son las ${hour}:00 (${timeOfDay}). El usuario lleva ${durationMinutes} minutos continuos usando la aplicación ${app}. Como su asistente de bienestar digital estricto, determina si esto es demasiado tiempo (especialmente si es de madrugada o tarde) y redacta una breve notificación persuasiva para que cierre la app (máximo 15 palabras). Comienza la respuesta directamente con el mensaje de notificación. Si crees que es aceptable (ej. poco tiempo en hora normal), responde exactamente "NO".`
                        }
                    ],
                    options: {
                        maxTokens: 50,
                        temperature: 0.7,
                        stopSequences: ["\n", "<"]
                    }
                });

                if (!result || !result.success || !result.response) {
                    throw new Error('Empty AI response');
                }

                let aiResponse = result.response.trim();

                if (aiResponse.includes('<think>')) {
                    const thinkEnd = aiResponse.indexOf('</think>');
                    if (thinkEnd !== -1) {
                        aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                    } else {
                        aiResponse = aiResponse.split('<think>')[0].trim();
                    }
                }

                if (aiResponse === "NO") {
                    console.log(`AI decided ${durationMinutes} mins in ${app} is fine. No alert.`);
                    return;
                }

                const { UsageStatsService } = require('./usageStats');
                UsageStatsService.sendPassiveNotification("Momento de Pausa", aiResponse);

            } catch (error) {
                console.error('Inference error in analyzeUsageLimit:', error);
                await this.clearInstance();
                const { UsageStatsService } = require('./usageStats');
                UsageStatsService.sendPassiveNotification(
                    "Alerta de Bienestar",
                    `Llevas ${durationMinutes} minutos en ${app}. ¿Quieres tomarte un respiro?`
                );
            }
        });

        return Promise.race([aiPromise, timeoutPromise]);
    }


    static async downloadModel(onProgress?: (progress: number) => void): Promise<boolean> {
        try {
            console.log('--- Managed Download ---');
            const cactus = new CactusLM({ model: this.modelName });
            const fs = NitroModules.createHybridObject<any>('CactusFileSystem');
            try { await fs.deleteModel(cactus.getModelName()); } catch (e) { }
            await cactus.download({ onProgress });
            return await fs.modelExists(cactus.getModelName());
        } catch (error) {
            console.error('Download failed:', error);
            return false;
        }
    }
}
