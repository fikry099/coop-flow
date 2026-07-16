
import api from "../lib/axios"; 
import { CooperativeRegistrationData } from "../types/cooperative";

export const cooperativeService = {
  register: async (data: CooperativeRegistrationData) => {
    const response = await api.post("/cooperative/register", {
      ...data,
      capacity_ton: parseFloat(data.capacity_ton.toString()),
    });

    return response.data;
  },
};
