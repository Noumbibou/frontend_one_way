import axios from "axios";

// Prefer proxy path by default, and accept either REACT_APP_API_BASE or REACT_APP_API_BASE_URL
const BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_API_BASE_URL ||
  "/api/";

const api = axios.create({
  baseURL: BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important pour les cookies de session
  timeout: 10000, // 10 secondes de timeout
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// Gestion des tokens d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[API] Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Gestion des réponses
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', {
      method: response.config.method.toUpperCase(),
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  async (error) => {
    // Amélioration du logging des erreurs
    if (error.response) {
      console.error(
        '[API] Error Response:',
        error.config.method.toUpperCase(),
        error.config.url,
        error.response.status,
        'Data:', error.response.data,
        'Headers:', error.response.headers
      );
    } else if (error.request) {
      console.error('[API] No response received:', error.request);
    } else {
      console.error('[API] Request setup error:', error.message);
    }

    const originalRequest = error.config;
    
    // Pour les erreurs 400, on les laisse passer telles quelles
    if (error.response?.status === 400) {
      return Promise.reject(error);
    }
    
    // Si l'erreur est 401 et qu'on n'est pas déjà en train de rafraîchir le token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si un rafraîchissement est déjà en cours, on met la requête en attente
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // Déconnexion si pas de refresh token
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Rafraîchir le token
        const response = await axios.post(
          `${BASE}token/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);
        
        // Mettre à jour l'en-tête d'autorisation
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        // Relancer les requêtes en attente
        processQueue(null, access);
        
        // Relancer la requête originale
        return api(originalRequest);
      } catch (refreshError) {
        // En cas d'échec du rafraîchissement, déconnecter l'utilisateur
        console.error('[API] Failed to refresh token:', refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Gestion des erreurs spécifiques
    if (error.response) {
      // Erreur 400 - Mauvaise requête
      if (error.response.status === 400) {
        console.error('[API] 400 Bad Request:', error.response.data);
        return Promise.reject(error.response.data);
      }
      
      // Erreur 403 - Accès refusé
      if (error.response.status === 403) {
        console.error('[API] 403 Forbidden:', error.response.data);
        // Rediriger vers la page de connexion ou afficher un message
        return Promise.reject(error.response.data);
      }
      
      // Erreur 404 - Ressource non trouvée
      if (error.response.status === 404) {
        console.error('[API] 404 Not Found:', error.response.config.url);
        return Promise.reject(new Error('La ressource demandée est introuvable.'));
      }
      
      // Erreur 500 - Erreur serveur
      if (error.response.status >= 500) {
        console.error('[API] Server Error:', error.response.data);
        return Promise.reject(new Error('Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.'));
      }
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('[API] No response received:', error.request);
      return Promise.reject(new Error('Le serveur ne répond pas. Veuillez vérifier votre connexion internet.'));
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('[API] Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Méthodes spécifiques pour les sessions d'entretien
const interviewApi = {
  // Démarrer une session d'entretien
  startSession: async (accessToken) => {
    try {
      const response = await api.post(`session-access/${accessToken}/start/`);
      return response.data;
    } catch (error) {
      console.error('[API] Error starting interview session:', error);
      throw error;
    }
  },
  
  // Autres méthodes liées aux entretiens peuvent être ajoutées ici
};

export { api as default, interviewApi };
