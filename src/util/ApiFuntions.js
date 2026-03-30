import axios from "axios"

export const api = axios.create({
    baseURL: "http://localhost:8080/api/v1"
})

// this function adds a new room room to the database
export async function CreateRoom(photo, roomType, roomPrice) {
    const formData = new FormData();
    formData.append("photo", photo);
    formData.append("roomType", roomType);
    formData.append("roomPrice", roomPrice);

    const response = await api.post("/rooms", formData);

    if (response.status === 201) {
        return true;
    } else {
        return false;
    }
}
export async function getRoomTypes() {
    try {
        const response = await api.get("/rooms/rooms-types");
        return response.data
    } catch (error) {
        throw new Error("Error fetching room types")
    }
}

export async function getAllRooms() {
    try {
        const response = await api.get("/rooms/all-rooms");
        return response.data
    } catch (error) {
        throw new Error("Error fetching rooms")
    }
}
