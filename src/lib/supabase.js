import { createClient } from "@supabase/supabase-js";

// Get environment variables with fallbacks
const supabaseUrl = "https://sotjxprezzykacwekchj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdGp4cHJlenp5a2Fjd2VrY2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzYzNDcsImV4cCI6MjA3NTE1MjM0N30.lREK7bTAxblYFqdNP3ncZDKKba1QGHF8ctZ5olY_rYA";

// Create Supabase client with error handling
let supabase = null;

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.warn("Supabase client creation failed:", error);
  supabase = null;
}

// Database schema functions
export const createTables = async () => {
  // This will be used to create tables in Supabase
  // For now, we'll create them manually in Supabase dashboard
};

// Database CRUD operations
export const inventoryService = {
  // Get all inventory items
  async getItems() {
    if (!supabase) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching items:", error);
      return { data: [], error };
    }
  },

  // Add new item
  async addItem(item) {
    if (!supabase) {
      return { data: [item], error: null };
    }

    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .insert([item])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error adding item:", error);
      return { data: [item], error };
    }
  },

  // Update item
  async updateItem(id, updates) {
    if (!supabase) {
      return { data: [{ id, ...updates }], error: null };
    }

    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error updating item:", error);
      return { data: [{ id, ...updates }], error };
    }
  },

  // Delete item
  async deleteItem(id) {
    if (!supabase) {
      return { data: null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error deleting item:", error);
      return { data: null, error };
    }
  },
};

export const requestService = {
  // Get all requests
  async getRequests() {
    if (!supabase) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from("requests")
        .select(
          `
          *,
          inventory_items(name),
          users(name)
        `
        )
        .order("request_date", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching requests:", error);
      return { data: [], error };
    }
  },

  // Add new request
  async addRequest(request) {
    if (!supabase) {
      return { data: [request], error: null };
    }

    try {
      const { data, error } = await supabase
        .from("requests")
        .insert([request])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error adding request:", error);
      return { data: [request], error };
    }
  },

  // Update request status
  async updateRequestStatus(id, status) {
    if (!supabase) {
      return { data: [{ id, status }], error: null };
    }

    try {
      const updates = { status };
      if (status === "approved") {
        updates.approved_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("requests")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error updating request:", error);
      return { data: [{ id, status }], error };
    }
  },
};
