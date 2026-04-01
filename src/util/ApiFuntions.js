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
        const response = await api.get("/rooms/types");
        return response.data
    } catch (error) {
        throw new Error("Error fetching room types")
    }
}

export async function getAllRooms() {
    try {
        const response = await api.get("/rooms");
        return response.data
    } catch (error) {
        throw new Error("Error fetching rooms")
    }
}

export async function deleteRoom(roomId) {
    try {
        const result = await api.delete(`/rooms/${roomId}`)
        return result.data

    } catch (error) {
        throw new Error(`Error deleting room ${error.message}`)
    }
}

export async function getRoomById(roomId) {
    try {
        const response = await api.get(`/room/${roomId}`)
        return response.data
    } catch (error) {
        throw new Error(`Error fetching room ${error.message}`)
    }
}

export async function updateRoom(roomId, roomData) {
    try {
        const formData = new FormData()
        formData.append("roomType", roomData.roomType)
        formData.append("roomPrice", roomData.roomPrice)
        if (roomData.photo) {
            formData.append("photo", roomData.photo)
        }
        const response = await api.put(`/rooms/${roomId}`, formData)
        return response.data
    } catch (error) {
        throw new Error(`Error updating room ${error.message}`)
    }
}