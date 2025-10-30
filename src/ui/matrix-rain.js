/**
 * Matrix Rain Effect
 * From https://codepen.io/wefiy/pen/WPpEwo
 * By Boujjou Achraf
 * 
 * Features:
 * - Falling character rain effect
 * - Customizable colors and speed
 * - Auto-resizes with window
 */

export class MatrixRain {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            characters: options.characters || "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}",
            fontSize: options.fontSize || 10,
            color: options.color || "#f4427d", // Pink color from codepen
            backgroundColor: options.backgroundColor || "rgba(0, 0, 0, 0.04)",
            speed: options.speed || 35 // Interval in ms
        };

        this.matrix = this.options.characters.split("");
        this.drops = [];
        this.animationInterval = null;
        this.resizeTimeout = null;
    }

    init() {
        // Make canvas full screen
        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;

        // Calculate columns
        this.columns = Math.floor(this.canvas.width / this.options.fontSize);

        // Initialize drops - one per column
        this.drops = [];
        for (let x = 0; x < this.columns; x++) {
            this.drops[x] = 1;
        }

        // Setup event listeners
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

        // Start animation
        this.start();

        console.log('Matrix Rain initialized');
    }

    draw() {
        // Black BG with translucent overlay to show trail
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set text style
        this.ctx.fillStyle = this.options.color;
        this.ctx.font = this.options.fontSize + "px arial";

        // Loop over drops
        for (let i = 0; i < this.drops.length; i++) {
            // Random character to print
            const text = this.matrix[Math.floor(Math.random() * this.matrix.length)];
            
            // Draw character at x = i*fontSize, y = drops[i]*fontSize
            this.ctx.fillText(text, i * this.options.fontSize, this.drops[i] * this.options.fontSize);

            // Reset drop to top randomly after it crosses the screen
            if (this.drops[i] * this.options.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }

            // Increment Y coordinate
            this.drops[i]++;
        }
    }

    start() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
        
        this.animationInterval = setInterval(() => this.draw(), this.options.speed);
    }

    handleResize() {
        // Debounce resize
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = setTimeout(() => {
            // Update canvas size
            this.canvas.height = window.innerHeight;
            this.canvas.width = window.innerWidth;

            // Recalculate columns
            this.columns = Math.floor(this.canvas.width / this.options.fontSize);

            // Reinitialize drops
            this.drops = [];
            for (let x = 0; x < this.columns; x++) {
                this.drops[x] = 1;
            }
        }, 100);
    }

    destroy() {
        console.log('Destroying Matrix Rain...');

        // Stop animation
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }

        // Clear timeouts
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        console.log('Matrix Rain destroyed');
    }
}
