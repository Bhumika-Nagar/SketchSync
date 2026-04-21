import axios from "axios";
export async function createRoom() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No token found"); 
  }

  const res = await axios.post(
    "http://localhost:5000/user/room",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
}