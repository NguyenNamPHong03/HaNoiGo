import { initializeAIService, healthCheck } from './index.js';

(async () => {
    try {
        console.log("Testing AI Service Initialization...");
        // Initialize might fail if env vars are missing, which is expected in this env without user input
        // But we want to ensure the code imports and runs.
        await initializeAIService();
        const health = await healthCheck();
        console.log("Health Check Result:");
        console.log(JSON.stringify(health, null, 2));
        process.exit(0);
    } catch (e) {
        console.error("Initialization Verification Failed (Expected if keys missing):");
        console.error(e.message);
        process.exit(1);
    }
})();
