import api from './api';

export interface KitchenTable {
    id: number;
    tableNumber: string;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved';
    locationId?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateTablePayload {
    tableNumber: string;
    capacity: number;
}

export interface UpdateTablePayload {
    tableNumber: string;
    capacity: number;
    status?: 'available' | 'occupied' | 'reserved';
}

export interface TableApiResponse {
    data: KitchenTable[];
    message?: string;
}

export interface SingleTableApiResponse {
    data: KitchenTable;
    message?: string;
}

export const kitchenTableService = {
    /**
     * Fetch all kitchen tables
     */
    getTables: async (): Promise<TableApiResponse> => {
        const { data } = await api.get<TableApiResponse>('/kitchen/tables');
        return data;
    },

    /**
     * Fetch a single kitchen table by ID
     */
    getTableById: async (id: number): Promise<SingleTableApiResponse> => {
        const { data } = await api.get<SingleTableApiResponse>(`/kitchen/tables/${id}`);
        return data;
    },

    /**
     * Create a new kitchen table
     */
    createTable: async (payload: CreateTablePayload): Promise<SingleTableApiResponse> => {
        const { data } = await api.post<SingleTableApiResponse>('/kitchen/tables', payload);
        return data;
    },

    /**
     * Update an existing kitchen table (number, capacity, and/or status)
     */
    updateTable: async (id: number, payload: UpdateTablePayload): Promise<SingleTableApiResponse> => {
        const { data } = await api.put<SingleTableApiResponse>(`/kitchen/tables/${id}`, payload);
        return data;
    },

    /**
     * Toggle a table's status between 'available' and 'occupied'
     */
    toggleTableStatus: async (table: KitchenTable): Promise<SingleTableApiResponse> => {
        const newStatus = table.status === 'occupied' ? 'available' : 'occupied';
        const { data } = await api.put<SingleTableApiResponse>(`/kitchen/tables/${table.id}`, {
            tableNumber: table.tableNumber,
            capacity: table.capacity,
            status: newStatus,
        });
        return data;
    },

    /**
     * Delete a kitchen table by ID
     */
    deleteTable: async (id: number): Promise<{ message?: string }> => {
        const { data } = await api.delete<{ message?: string }>(`/kitchen/tables/${id}`);
        return data;
    },
};
