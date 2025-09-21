import { spawn } from 'child_process';

console.log('🚀 Starting Ecommerce Frontend with ngrok...\n');

// Start the Next.js development server
const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, PORT: 3000 }
});

// Wait a moment for the server to start
setTimeout(() => {
    console.log('\n🌐 Starting ngrok tunnel for frontend...\n');
    
    // Start ngrok for the frontend
    const ngrokProcess = spawn('ngrok', ['http', '3000'], {
        stdio: 'inherit'
    });

    ngrokProcess.on('error', (error) => {
        console.error('❌ Error starting ngrok:', error.message);
        console.log('💡 Make sure ngrok is installed: npm install -g ngrok');
    });

    ngrokProcess.on('close', (code) => {
        console.log(`\n🔌 ngrok process exited with code ${code}`);
    });
}, 5000); // Give Next.js more time to start

frontendProcess.on('error', (error) => {
    console.error('❌ Error starting frontend server:', error.message);
});

frontendProcess.on('close', (code) => {
    console.log(`\n🔌 Frontend server process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    frontendProcess.kill();
    process.exit(0);
}); 