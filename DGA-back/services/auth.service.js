// Credentials used for authentication (should ideally be pulled from environment variables)
const DGA_CREDENTIALS = {
    ConsumerKey: '9e5c84d2-a51b-4686-b8a6-e52782a792b6', 
    AgentID: '8a816448-0207-45f4-8613-65b0ad80afdb',   
    ConsumerSecret: 'fXEBc3LZ-3r', 
};

/**
 * Calls the API to request an Access Token.
 * @returns {string} Access Token
 */
export async function validateToken() {
    const { ConsumerKey, AgentID, ConsumerSecret } = DGA_CREDENTIALS;

    // Use Relative Path with /api prefix for Vite Proxy (configured in vite.config.js)
    const url = `/api/auth/validate?Consumer-Key=${ConsumerKey}&AgentID=${AgentID}`; 

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'ConsumerSecret': ConsumerSecret, 
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const accessToken = data.Result; 

        // Store Token (Note: Use Firestore or secure storage in production)
        localStorage.setItem('dga_access_token', accessToken);
        
        return accessToken;

    } catch (error) {
        console.error("Error during Token Validation:", error.message);
        throw error;
    }
}

/**
 * Example of calling an API that requires a Token (e.g., /api/dga/data).
 */
export async function getProtectedData() {
    const token = localStorage.getItem('dga_access_token');

    if (!token) {
        throw new Error("No access token found. Please log in first.");
    }

    const url = `/api/dga/data`; // Use Relative Path and /api Prefix

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            // Attach Token in Bearer Header format
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch protected data. Status: ${response.status}`);
    }

    return response.json();
}