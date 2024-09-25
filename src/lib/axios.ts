import axios from "axios";

const apiMLSuggest = axios.create({
  baseURL: import.meta.env.VITE_SUGGEST_BASE_URL,
});

// apiMLSuggest.interceptors.request.use((config) => {
//   const token = localStorage.getItem("AUTH_TOKEN"); // cambiar por el correcto
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default apiMLSuggest;
