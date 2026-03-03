import { AppRegistry } from 'react-native';
import { AIService } from './aiService';

const AIPassiveAlertTask = async (taskData: { app: string; duration: number }) => {
    console.log('[Headless JS] AIPassiveAlertTask started:', taskData);
    try {
        await AIService.analyzeUsageLimit(taskData.app, taskData.duration);
    } catch (e) {
        console.error('[Headless JS] Error in AIPassiveAlertTask:', e);
    }
};

AppRegistry.registerHeadlessTask('AIPassiveAlertTask', () => AIPassiveAlertTask);
