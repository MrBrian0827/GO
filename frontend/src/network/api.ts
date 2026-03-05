import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001/api"
});

export interface AuthResult {
  token: string;
  user: { id: number; username: string };
}

export async function register(username: string, password: string): Promise<AuthResult> {
  const { data } = await api.post("/game/register", { username, password });
  return data;
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const { data } = await api.post("/game/login", { username, password });
  return data;
}

export async function fetchTutorials() {
  const { data } = await api.get("/tutorial");
  return data;
}

export async function fetchPuzzles() {
  const { data } = await api.get("/puzzle");
  return data;
}

export default api;
