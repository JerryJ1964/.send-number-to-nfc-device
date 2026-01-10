(() => {
    const globalScope = typeof window !== 'undefined' ? window : globalThis;
    const hasRequire = typeof require === 'function';

    // Wait for CryptoJS to be available (handles async script loading)
    function getCryptoJS() {
        return globalScope.CryptoJS || (hasRequire ? require('crypto-js') : null);
    }

    let CryptoJS = getCryptoJS();

    // If CryptoJS isn't available yet, wait a bit and try again
    if (!CryptoJS && typeof window !== 'undefined') {
        // Wait for script to load (max 3 seconds)
        let attempts = 0;
        const maxAttempts = 30;
        const checkInterval = setInterval(() => {
            attempts++;
            CryptoJS = getCryptoJS();
            if (CryptoJS || attempts >= maxAttempts) {
                clearInterval(checkInterval);
                if (!CryptoJS) {
                    console.error('CryptoJS failed to load after waiting. Admin auth may not work.');
                }
            }
        }, 100);
    }

    if (!CryptoJS) {
        console.error('CryptoJS is required for admin-auth.js but was not found.');
        // Don't throw - allow the module to initialize but functions will fail gracefully
    }

    const STORAGE_KEY = 'adminCredentials_v1';
    const DEFAULT_USERNAME = 'admin';
    const DEFAULT_LOGIN_CODE = 'VYP2678';

    const storage = (() => {
        if (typeof globalScope.localStorage !== 'undefined') {
            return globalScope.localStorage;
        }
        const memoryStore = {};
        return {
            getItem(key) {
                return Object.prototype.hasOwnProperty.call(memoryStore, key)
                    ? memoryStore[key]
                    : null;
            },
            setItem(key, value) {
                memoryStore[key] = String(value);
            }
        };
    })();

    function safeParse(json) {
        try {
            return JSON.parse(json);
        } catch {
            return null;
        }
    }

    function saveCredentials(creds) {
        storage.setItem(STORAGE_KEY, JSON.stringify({
            ...creds,
            updatedAt: new Date().toISOString()
        }));
    }

    function getCredentials() {
        const raw = storage.getItem(STORAGE_KEY);
        return raw ? safeParse(raw) : null;
    }

    function resetCredentials(username = DEFAULT_USERNAME, loginCode = DEFAULT_LOGIN_CODE) {
        if (!CryptoJS) {
            console.error('Cannot reset credentials: CryptoJS not available');
            return null;
        }
        const usernameHash = CryptoJS.SHA256(String(username).trim()).toString();
        const loginCodeHash = CryptoJS.SHA256(String(loginCode).trim()).toString();
        saveCredentials({ usernameHash, loginCodeHash });
        console.log('Credentials reset:', { username, loginCode });
        return { username, loginCode };
    }

    function initCredentials() {
        try {
            const existing = getCredentials();
            // Always reset to defaults if no credentials exist or if they're malformed
            if (!existing || !existing.usernameHash || !existing.loginCodeHash) {
                resetCredentials();
            }
        } catch (error) {
            console.warn('Error initializing credentials, resetting to defaults:', error);
            resetCredentials();
        }
    }

    function authenticateAdmin(username, loginCode) {
        if (!username || !loginCode) {
            console.log('Authentication failed: missing username or password');
            return false;
        }

        if (!CryptoJS) {
            console.error('Cannot authenticate: CryptoJS not available');
            return false;
        }

        // Ensure credentials are initialized
        initCredentials();

        const creds = getCredentials();
        if (!creds || !creds.usernameHash || !creds.loginCodeHash) {
            // Force reset if credentials are missing
            console.log('Credentials missing, resetting to defaults');
            resetCredentials();
            const newCreds = getCredentials();
            if (!newCreds) {
                console.error('Failed to initialize credentials');
                return false;
            }
        }

        const usernameHash = CryptoJS.SHA256(String(username).trim()).toString();
        const loginCodeHash = CryptoJS.SHA256(String(loginCode).trim()).toString();
        const finalCreds = getCredentials();

        const usernameMatch = finalCreds.usernameHash === usernameHash;
        const passwordMatch = finalCreds.loginCodeHash === loginCodeHash;

        console.log('Auth attempt:', {
            username: username.trim(),
            usernameMatch,
            passwordMatch,
            storedUsernameHash: finalCreds.usernameHash?.substring(0, 10) + '...',
            inputUsernameHash: usernameHash.substring(0, 10) + '...',
            storedPasswordHash: finalCreds.loginCodeHash?.substring(0, 10) + '...',
            inputPasswordHash: loginCodeHash.substring(0, 10) + '...'
        });

        return usernameMatch && passwordMatch;
    }

    function updateAdminLoginCode(newCode) {
        if (!newCode) return false;
        const creds = getCredentials() || {
            usernameHash: CryptoJS.SHA256(DEFAULT_USERNAME).toString()
        };
        creds.loginCodeHash = CryptoJS.SHA256(String(newCode)).toString();
        saveCredentials(creds);
        return true;
    }

    function quickLogin(username = DEFAULT_USERNAME, loginCode = DEFAULT_LOGIN_CODE) {
        if (authenticateAdmin(username, loginCode)) {
            if (typeof globalScope.localStorage !== 'undefined') {
                globalScope.localStorage.setItem("isAdminLoggedIn", "true");
            }
            if (typeof globalScope.location !== 'undefined') {
                globalScope.location.href = "admin-dashboard.html";
            }
            return true;
        }
        return false;
    }

    // Initialize credentials when CryptoJS is available
    function initializeWhenReady() {
        if (CryptoJS) {
            initCredentials();
        } else {
            // Try again after a short delay
            setTimeout(() => {
                CryptoJS = getCryptoJS();
                if (CryptoJS) {
                    initCredentials();
                } else {
                    console.warn('CryptoJS still not available, credentials not initialized');
                }
            }, 100);
        }
    }

    initializeWhenReady();

    const api = {
        authenticateAdmin,
        updateAdminLoginCode,
        initCredentials,
        resetCredentials,
        quickLogin
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        globalScope.adminAuth = api;
        // Simple console login function - just type: login()
        globalScope.login = function () {
            return quickLogin();
        };
        // Force reset credentials - useful for debugging: resetAdmin()
        globalScope.resetAdmin = function () {
            const result = resetCredentials();
            if (result) {
                console.log('Admin credentials reset to defaults: admin / VYP2678');
                return true;
            } else {
                console.error('Failed to reset credentials. Check console for errors.');
                return false;
            }
        };
        // Debug function to check current state
        globalScope.debugAuth = function () {
            console.log('Auth Debug Info:', {
                cryptoJSAvailable: !!CryptoJS,
                credentials: getCredentials(),
                defaultUsername: DEFAULT_USERNAME,
                defaultPassword: DEFAULT_LOGIN_CODE
            });
        };
    }
})();