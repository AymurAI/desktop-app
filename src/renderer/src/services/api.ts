import axios from "axios";

import { AYMURAI_API_URL } from "@/utils/config";

const api = axios.create({
  baseURL: AYMURAI_API_URL,
});

api.interceptors.response.use((response) => response.data);

export default api;
