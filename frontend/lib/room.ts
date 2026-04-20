import { apiRequest } from "@/lib/api";

export const createRoom = async () => {
  return apiRequest<{ roomId: string }>("POST", "/user/room", {
    name: "room",
  });
};