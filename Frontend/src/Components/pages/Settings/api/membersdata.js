import apiClient from '@config/api';

export const getMembers = async()=>{
    try {
        const response = await apiClient.get('/api/v1/settings/members');
        return response.data;
    } catch (error) {
        console.log(error)
    }
}