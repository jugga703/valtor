// Declare necessary variables globally
let captchaText = '';  // For registration CAPTCHA
let captchaTextLogin = '';  // For login CAPTCHA
let supabaseInstance; // Renamed to avoid confusion with global supabase object

// Initialize Supabase client after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize the Supabase client using the new version
        const supabaseUrl = 'https://mnekuqccqrbbwtpmsubq.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZWt1cWNjcXJiYnd0cG1zdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MjY2MjcsImV4cCI6MjA1MjMwMjYyN30.pcJrruD_LWQaDrqzhIFaYON0T-mGdmOI8wsGotU4czU';
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase configuration missing');
        }
        
        supabaseInstance = supabase.createClient(supabaseUrl, supabaseKey);

        // Initialize both CAPTCHAs
        generateCaptcha();
        generateCaptchaLogin();
    } catch (error) {
        console.error('Failed to initialize:', error);
        alert('Failed to initialize the application. Please refresh the page.');
    }
});

// Enhanced CAPTCHA generation with better randomization
function generateCaptcha(isLogin = false) {
    try {
        const canvasId = isLogin ? 'captchaCanvasLogin' : 'captchaCanvas';
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = 250;
        canvas.height = 80;

        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        const captchaLength = 6;
        let captchaString = '';

        for (let i = 0; i < captchaLength; i++) {
            captchaString += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Set the appropriate captcha text based on type
        if (isLogin) {
            captchaTextLogin = captchaString;
        } else {
            captchaText = captchaString;
        }

        // Clear and set background
        ctx.fillStyle = '#f3f3f3';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add noise lines
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = getRandomColor(0.5);
            ctx.lineWidth = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // Draw text with random rotations
        ctx.textBaseline = 'middle';
        const fontSize = 28;
        ctx.font = `${fontSize}px Arial`;

        for (let i = 0; i < captchaString.length; i++) {
            ctx.fillStyle = getRandomColor();
            ctx.save();
            ctx.translate(35 + i * 35, canvas.height / 2);
            ctx.rotate((Math.random() - 0.5) * 0.4);
            ctx.fillText(captchaString[i], 0, 0);
            ctx.restore();
        }

        // Log CAPTCHA text for debugging (remove in production)
        console.log('Generated CAPTCHA:', isLogin ? captchaTextLogin : captchaText);

    } catch (error) {
        console.error('Failed to generate CAPTCHA:', error);
    }
}

function getRandomColor(alpha = 1) {
    const r = Math.floor(Math.random() * 156 + 100);
    const g = Math.floor(Math.random() * 156 + 100);
    const b = Math.floor(Math.random() * 156 + 100);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Simplified CAPTCHA validation
function validateCaptcha(input, isLogin = false) {
    const currentCaptcha = isLogin ? captchaTextLogin : captchaText;
    console.log('Entered CAPTCHA:', input);  // Log the entered CAPTCHA for debugging
    console.log('Current CAPTCHA:', currentCaptcha);  // Log the current generated CAPTCHA for debugging
    return input.toLowerCase() === currentCaptcha.toLowerCase(); // Case-insensitive comparison
}

// Simplified registration function
async function validateRegister(event) {
    event.preventDefault();

    try {
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const captchaInput = document.getElementById('registerCaptcha').value.trim();

        // Basic validation
        if (!username || !password || !confirmPassword) {
            throw new Error('All fields are required');
        }

        // Username length check
        if (username.length < 3) {
            throw new Error('Username must be at least 3 characters long');
        }

        // Simple password match check
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        // CAPTCHA validation
        if (!validateCaptcha(captchaInput)) {
            generateCaptcha();  // Refresh CAPTCHA on failure
            document.getElementById('registerCaptcha').value = '';  // Clear CAPTCHA input
            throw new Error('Invalid CAPTCHA');
        }

        // Check username availability
        const { data: existingUser, error: checkError } = await supabaseInstance
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            throw new Error('Username is already taken');
        }

        // Register user
        const { error: insertError } = await supabaseInstance
            .from('users')
            .insert([{ username, password }]);


        if (insertError) {
            throw new Error('Failed to register user');
        }

        alert('Registration successful! Please log in.');
        window.location.href = 'index.html';

    } catch (error) {
        alert(error.message);
        return false;
    }
}

// Simplified login function
async function validateLogin(event) {
    event.preventDefault();

    try {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const captchaInput = document.getElementById('loginCaptcha').value.trim();

        // Basic validation
        if (!username || !password) {
            throw new Error('All fields are required');
        }

        // CAPTCHA validation
        if (!validateCaptcha(captchaInput, true)) {
            generateCaptchaLogin();  // Refresh CAPTCHA on failure
            document.getElementById('loginCaptcha').value = '';  // Clear CAPTCHA input
            throw new Error('Invalid CAPTCHA');
        }

        // Check credentials
        const { data, error } = await supabaseInstance
            .from('users')
            .select('username, password')
            .eq('username', username)
            .single();

        if (error || !data) {
            throw new Error('Invalid username or password');
        }

        if (data.password !== password) {
            throw new Error('Invalid username or password');
        }

        alert('Login successful!');
        window.location.href = 'active.html';

    } catch (error) {
        alert(error.message);
        return false;
    }
}

// Helper function for generating CAPTCHA login
function generateCaptchaLogin() {
    generateCaptcha(true);  // Ensure it generates CAPTCHA for login
}
