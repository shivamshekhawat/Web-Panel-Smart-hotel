const { exec } = require('child_process');
const { writeFileSync, unlinkSync } = require('fs');
const path = require('path');

// Create a simple HTML file that will clear local storage and redirect to the app
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Clearing Local Storage</title>
    <script>
        // Clear local storage
        localStorage.clear();
        // Redirect to the app
        window.location.href = '/';
    </script>
</head>
<body>
    <p>Clearing local storage and redirecting to login page...</p>
</body>
</html>
`;

// Write the HTML file
const tempFile = path.join(__dirname, 'public', 'clear-storage.html');
writeFileSync(tempFile, htmlContent);

// Start the development server
console.log('Starting development server...');
const server = exec('npm start', {
    cwd: __dirname,
    env: { ...process.env, BROWSER: 'none' } // Prevent auto-opening browser
});

// Log server output
server.stdout.pipe(process.stdout);
server.stderr.pipe(process.stderr);

// Clean up when the process exits
process.on('exit', () => {
    try {
        unlinkSync(tempFile);
    } catch (e) {
        // Ignore errors
    }
});

// Also handle Ctrl+C
process.on('SIGINT', () => {
    process.exit();
});
