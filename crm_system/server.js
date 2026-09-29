const express = require('express');
const next = require('next');

// const dev = process.env.NODE_ENV !== 'production';
dev = false
const hostname = 'localhost';
// const hostname = process.env.HOSTNAME;
const port = process.env.PORT || 3040;

// Initialize Next.js
const nextApp = next({ 
    dev,
    hostname,
    port,
    dir: process.cwd() // Explicitly set the directory
});

const handle = nextApp.getRequestHandler();

// Don't immediately invoke routes, wait for app preparation
nextApp.prepare().then(() => {
    const app = express();
    
    // Default catch-all handler
    app.use((req, res) => {
        return handle(req, res);
    });

    app.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
    });
}).catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});