console.log("✅ script.js loaded");

let auth = null;
try {
    auth = require('./js/admin-auth.js');
} catch (e) {
    // Silently fail in browser - we'll load auth differently
    auth = null;
}

// Browser-compatible auth functions (fallback if require fails)
const browserAuth = {
    authenticateAdmin: function (loginCode) {
        try {
            const STORAGE_KEY = 'adminCredentials_v1';
            const raw = localStorage.getItem(STORAGE_KEY);

            // Wait for CryptoJS to be available
            if (!window.CryptoJS) {
                console.warn('CryptoJS not available');
                return false;
            }

            if (!raw) {
                // Initialize default credentials
                const initial = {
                    loginCodeHash: window.CryptoJS.SHA256('2678VYP').toString(),
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
            }

            const creds = JSON.parse(localStorage.getItem(STORAGE_KEY));
            const inputHash = window.CryptoJS.SHA256(String(loginCode)).toString();
            const isValid = creds.loginCodeHash === inputHash;

            console.log('Auth attempt:', { isValid, stored: creds.loginCodeHash, input: inputHash });
            return isValid;
        } catch (e) {
            console.warn('Auth error:', e);
            return false;
        }
    },
    updateAdminLoginCode: function (newCode) {
        try {
            const STORAGE_KEY = 'adminCredentials_v1';
            if (!window.CryptoJS || !newCode) return false;
            const creds = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            creds.loginCodeHash = window.CryptoJS.SHA256(String(newCode)).toString();
            creds.updatedAt = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
            return true;
        } catch (e) {
            console.warn('Update code error:', e);
            return false;
        }
    }
};

// Use Node auth if available, otherwise use browser auth
const authModule = auth || browserAuth;

// Utility function for smooth animations
function animateValue(element, start, end, duration, callback) {
    const startTime = performance.now();
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + (end - start) * progress;
        if (callback) callback(current);
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    requestAnimationFrame(animate);
}

// Enhanced notification system
function showNotification(message, type = 'success', duration = 3000) {
    const successMessage = document.getElementById('successMessage');
    if (!successMessage) return;

    const icon = successMessage.querySelector('svg');
    const text = successMessage.querySelector('span');
    
    if (text) text.textContent = message;
    
    successMessage.className = `status-message ${type}-message show`;
    
    // Trigger animation
    setTimeout(() => {
        successMessage.style.display = 'flex';
        successMessage.style.opacity = '0';
        requestAnimationFrame(() => {
            successMessage.style.transition = 'opacity 0.3s ease-out';
            successMessage.style.opacity = '1';
        });
    }, 10);

    setTimeout(() => {
        successMessage.style.opacity = '0';
        setTimeout(() => {
            successMessage.classList.remove('show');
            successMessage.style.display = 'none';
        }, 300);
    }, duration);
}

// Global functions accessible from HTML onclick handlers
function handleSend() {
    const numberInput = document.getElementById('numberInput');
    const sendButton = document.getElementById('sendButton');
    const spinner = document.getElementById('spinner');
    const storedSpan = document.getElementById('storedNumber');
    const statusIndicator = document.getElementById('statusIndicator');

    if (!numberInput?.value.trim()) {
        showNotification('Please enter a number before sending.', 'error', 2000);
        // Add shake animation to input
        numberInput?.classList.add('shake');
        setTimeout(() => numberInput?.classList.remove('shake'), 500);
        return;
    }

    const value = numberInput.value.trim();

    // Disable button and show spinner
    if (sendButton) {
        sendButton.disabled = true;
        const buttonText = sendButton.querySelector('.button-text');
        if (buttonText) buttonText.textContent = 'Sending...';
    }
    
    if (spinner) {
        spinner.classList.add('show');
        spinner.style.display = 'flex';
    }

    // Simulate NFC write delay with realistic timing
    setTimeout(() => {
        try {
            // Save to localStorage
            localStorage.setItem('storedNumber', value);
            const saveTime = new Date().toISOString();
            localStorage.setItem('storedNumberTime', saveTime);

            // Update history
            const history = JSON.parse(localStorage.getItem('phoneList') || '[]');
            history.push({ number: value, at: saveTime });
            // Keep only last 50 entries
            if (history.length > 50) {
                history.shift();
            }
            localStorage.setItem('phoneList', JSON.stringify(history));

            // Update UI with animation
            if (storedSpan) {
                storedSpan.style.opacity = '0';
                storedSpan.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    storedSpan.textContent = value;
                    storedSpan.style.transition = 'all 0.3s ease-out';
                    storedSpan.style.opacity = '1';
                    storedSpan.style.transform = 'translateY(0)';
                }, 150);
            }

            // Update status indicator
            if (statusIndicator) {
                statusIndicator.classList.add('active');
            }

            // Show success message
            showNotification('Number saved successfully!', 'success', 2500);

            // Clear input with animation
            numberInput.value = '';
            numberInput.blur();

            // Add success pulse to button
            if (sendButton) {
                sendButton.style.animation = 'pulse 0.5s ease-out';
                setTimeout(() => {
                    sendButton.style.animation = '';
                }, 500);
            }

        } catch (e) {
            console.warn('Failed to save number:', e);
            showNotification('Failed to save number. Please try again.', 'error', 3000);
        } finally {
            // Re-enable button and hide spinner
            if (spinner) {
                spinner.classList.remove('show');
                setTimeout(() => {
                    spinner.style.display = 'none';
                }, 300);
            }
            
            if (sendButton) {
                sendButton.disabled = false;
                const buttonText = sendButton.querySelector('.button-text');
                if (buttonText) buttonText.textContent = 'Send to NFC Device';
            }
        }
    }, 800); // Slightly longer delay for better UX
}

function handleErase() {
    const storedSpan = document.getElementById('storedNumber');
    const statusIndicator = document.getElementById('statusIndicator');
    
    if (!storedSpan || storedSpan.textContent === 'None') {
        showNotification('No number to erase.', 'error', 2000);
        return;
    }

    // Confirmation with smooth animation
    const confirmed = confirm('Are you sure you want to erase the stored number?');
    if (!confirmed) return;

    try {
        localStorage.removeItem('storedNumber');
        localStorage.removeItem('storedNumberTime');
        
        // Animate removal
        if (storedSpan) {
            storedSpan.style.transition = 'all 0.3s ease-out';
            storedSpan.style.opacity = '0';
            storedSpan.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                storedSpan.textContent = 'None';
                storedSpan.style.opacity = '1';
                storedSpan.style.transform = 'translateY(0)';
            }, 300);
        }

        // Update status indicator
        if (statusIndicator) {
            statusIndicator.classList.remove('active');
        }

        showNotification('Number erased successfully.', 'success', 2000);
    } catch (e) {
        console.warn('Failed to erase:', e);
        showNotification('Failed to erase number.', 'error', 2000);
    }
}

function handleAdminLogin(loginCode) {
    if (typeof document === 'undefined') return false;

    if (!loginCode) {
        const loginInput = document.getElementById('loginInput');
        if (!loginInput) return false;
        loginCode = loginInput.value.trim();
    }

    if (!authModule || typeof authModule.authenticateAdmin !== 'function') {
        console.warn('Auth module not available');
        return false;
    }

    const ok = Boolean(authModule.authenticateAdmin(loginCode));
    if (ok) {
        const adminInterface = document.getElementById('adminInterface');
        if (adminInterface) adminInterface.style.display = 'block';
    }
    return ok;
}

function handleLogin() {
    const loginInput = document.getElementById('loginInput');
    if (!loginInput) return;

    const val = loginInput.value?.trim() || '';
    if (!val) {
        alert('Please enter a login to proceed.');
        return;
    }

    try {
        localStorage.setItem('savedLogin', val);
    } catch (e) { console.warn('savedLogin error', e); }

    document.getElementById('loginScreen')?.classList.remove('active');
    document.getElementById('nfcScreen')?.classList.add('active');
    const numberInput = document.getElementById('numberInput');
    if (numberInput) numberInput.value = val;
}

function checkSavedLogin() {
    try {
        const saved = localStorage.getItem('savedLogin');
        if (saved) {
            document.getElementById('loginScreen')?.classList.remove('active');
            document.getElementById('nfcScreen')?.classList.add('active');
            const numberInput = document.getElementById('numberInput');
            if (numberInput) numberInput.value = saved;
        }
    } catch (e) {
        console.warn('checkSavedLogin error', e);
    }
}

// Enhanced NFC status check with better UI
function updateNFCStatus() {
    const nfcStatus = document.getElementById('nfcStatus');
    if (!nfcStatus) return;

    const statusText = nfcStatus.querySelector('.status-loading') || nfcStatus;
    
    // Remove loading text
    if (nfcStatus.querySelector('.status-loading')) {
        nfcStatus.innerHTML = '';
    }

    if ('NDEFReader' in window) {
        nfcStatus.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#43e97b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 10L9 12L13 8" stroke="#43e97b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>NFC is supported on this device</span>
        `;
        nfcStatus.style.color = '#43e97b';
    } else {
        nfcStatus.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 6V10M10 14H10.01" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>NFC not supported in this browser</span>
        `;
        nfcStatus.style.color = '#fbbf24';
    }
}

// Add shake animation CSS dynamically
function addShakeAnimation() {
    if (document.getElementById('shake-animation-style')) return;
    
    const style = document.createElement('style');
    style.id = 'shake-animation-style';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .shake {
            animation: shake 0.5s ease-in-out;
            border-color: #f5576c !important;
        }
    `;
    document.head.appendChild(style);
}

// DOM initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM fully loaded');

    // Add shake animation
    addShakeAnimation();

    const numberInput = document.getElementById('numberInput');
    const sendButton = document.getElementById('sendButton');
    const eraseButton = document.getElementById('eraseButton');
    const storedSpan = document.getElementById('storedNumber');
    const statusIndicator = document.getElementById('statusIndicator');

    // Load stored number on page load with animation
    try {
        const stored = localStorage.getItem('storedNumber');
        const storedTime = localStorage.getItem('storedNumberTime');
        
        if (storedSpan) {
            if (stored) {
                storedSpan.textContent = stored;
                // Show active status if number exists
                if (statusIndicator) {
                    statusIndicator.classList.add('active');
                }
            } else {
                storedSpan.textContent = 'None';
            }
            
            // Fade in animation
            storedSpan.style.opacity = '0';
            setTimeout(() => {
                storedSpan.style.transition = 'opacity 0.5s ease-out';
                storedSpan.style.opacity = '1';
            }, 100);
        }
    } catch (e) {
        console.warn('Init stored number error:', e);
    }

    // Attach event listeners
    sendButton?.addEventListener('click', handleSend);
    eraseButton?.addEventListener('click', handleErase);

    // Enhanced input handling
    numberInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    });

    // Add input validation feedback
    numberInput?.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value && sendButton) {
            sendButton.style.opacity = '1';
        }
    });

    // Add focus effects
    numberInput?.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
        this.parentElement.style.transition = 'transform 0.2s ease-out';
    });

    numberInput?.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });

    // Update NFC status with delay for smooth loading
    setTimeout(() => {
        updateNFCStatus();
    }, 500);

    // Add smooth scroll to top on load
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Add intersection observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards
    document.querySelectorAll('.form-card, .stored-card, .status-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(card);
    });
});

// Exports for Jest tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleSend,
        handleErase,
        handleAdminLogin,
        handleLogin,
        checkSavedLogin
    };
}