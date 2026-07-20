import axios from "axios";

const authAPI = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

authAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }

    return config;
})

export default authAPI;