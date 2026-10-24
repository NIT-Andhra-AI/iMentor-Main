// frontend/src/hooks/useUserLevel.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Hook to fetch and cache user's gamification level & totalXP
 */
export function useUserLevel(userId = null, refreshCounter = 0) {
    const [level, setLevel] = useState(null);
    const [totalXP, setTotalXP] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchLevel = async () => {
            try {
                const response = await apiClient.get('/gamification/profile');
                if (response && response.data && isMounted) {
                    const xp = Number(response.data.totalXP ?? response.data.totalXp ?? response.data.xp ?? 0);
                    const calcLevel = Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
                    const newLevel = response.data.xpLevel || calcLevel || 1;
                    setLevel(newLevel);
                    setTotalXP(xp);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                    setLevel((prev) => prev || 1);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchLevel();
        const intervalId = setInterval(fetchLevel, 20000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [userId, refreshCounter]);

    return { level, totalXP, loading, error };
}
