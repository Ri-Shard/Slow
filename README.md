# Slow 🌿 - Asistente de Bienestar Digital Basado en IA Local

Slow es un guardián digital autónomo desarrollado con **React Native** y código nativo en **Android (Kotlin)**. Su propósito es redefinir el bienestar digital: rechazando los límites de tiempo rígidos que suelen causar frustración, y adoptando un enfoque contextual y empático potenciado por Inteligencia Artificial 100% local (Zero Latency, Maximum Privacy).

> *"Según un estudio clave (Parry et al., 2022), el bienestar digital no funciona bloqueando apps, sino entendiendo el contexto y las motivaciones de cada persona."*

## ✨ Características Principales

### 🧠 Comprensión Contextual con IA Local
Slow no usa bloqueos tradicionales de "30 minutos al día". En su lugar, analiza en segundo plano:
- **La aplicación en uso** (ej. TikTok vs Chrome).
- **El tiempo continuo de sesión**.
- **La hora del día** (ej. domingo por la tarde frente a madrugada de un día de semana).

Utilizando modelos de Lenguaje Pequeños (SLMs) puros ejecutados **on-device** mediante **CactusLM** (ej. `qwen3-0.6b`), la aplicación es capaz de inferir si un uso es sano o compulsivo sin jamás enviar datos de uso a la nube.

### ⚡ Intervenciones Inteligentes (Notificaciones y Bloqueos)

1. **Alerta Pasiva Empática**
   Si la IA detecta una sesión anormal de larga duración en un horario o app distractiva, no emite un bloqueo forzoso. En cambio, redacta y lanza una notificación empática y persuasiva que te invita sutilmente a parar: *"Ya es de madrugada, considera buscar tu descanso"*.
   
2. **Pantalla de Pausa (Interceptor Compulsivo)**
   Utilizando los `UsageStatsManager` y `BroadcastReceivers` nativos de Android, Slow monitorea el ratio de desbloqueos de pantalla (ej. desbloquear el móvil repetidas veces cada 5 minutos). 
   Al detectar este patrón nocivo, lanza una actividad superpuesta agresiva pero compasiva cruzando toda la navegación del sistema. Detiene el *doomscrolling* y exige que el usuario declare su intención (*Conexión, Distracción, Información o Calma*), regalando una frase de reflexión curada.

## 🛠️ Stack Tecnológico

Slow es un caso de uso avanzado de ingeniería móvil, al lidiar contra las restricciones de gestión de batería del sistema operativo (Doze mode) e inyectar vistas nativas:

- **Framework:** React Native + Expo (Managed Workflow con Custom Modules).
- **IA On-Device:** `cactus-react-native` con Native Nitro Modules para ejecución ultrarrápida (JSI).
- **Native Android (Kotlin):** 
  - `Foreground Service` persistente para monitorización de uso asíncrono evadiendo el battery-kill de OEMs (TECNO, Xiaomi, Samsung).
  - Escáner continuo mediante `UsageStatsManager`.
  - Intents con flags complejos (`FLAG_ACTIVITY_REORDER_TO_FRONT`, `FLAG_ACTIVITY_NEW_TASK`) para interceptar la UI desde servicios *background* en Android 10+.
- **Almacenamiento Local:** SQLite nativo para registrar métricas puras y acelerar el modelado de datos determinista del usuario para entrenamiento IA posterior.
- **UI/UX:** Componentes fluidos altamente diseñados y centralización de tipado moderno en TypeScript con *React Navigation*.

## 🚀 Impacto
Desarrollar tecnología de intercepción nativa para combatir un diseño que, a propósito, está pensado de forma adictiva, es un reto complejo. El objetivo final de **Slow** no es ser una cárcel para tu dispositivo, es devolver el poder de elección intencional al usuario en tiempo real.

---
**#ReactNative #AndroidDev #DigitalWellbeing #LocalAI #SoftwareEngineering #TechForGood**
