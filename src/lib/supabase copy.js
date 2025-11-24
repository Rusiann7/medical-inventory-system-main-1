import { createClient } from "@supabase/supabase-js";

// Get environment variables with fallbacks
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://sotjxprezzykacwekchj.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdGp4cHJlenp5a2Fjd2VrY2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzYzNDcsImV4cCI6MjA3NTE1MjM0N30.lREK7bTAxblYFqdNP3ncZDKKba1QGHF8ctZ5olY_rYA";

// Create Supabase client with error handling
let supabase = null;

try {
  if (
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== "https://sotjxprezzykacwekchj.supabase.co" &&
    supabaseKey !==
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdGp4cHJlenp5a2Fjd2VrY2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzYzNDcsImV4cCI6MjA3NTE1MjM0N30.lREK7bTAxblYFqdNP3ncZDKKba1QGHF8ctZ5olY_rYA"
  ) {
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

// Sample data insertion
export const insertSampleData = async () => {
  // Sample users for each role
  const sampleUsers = [
    {
      id: "ADMIN001",
      name: "John Smith",
      role: "hospital_administrator",
      email: "admin@hospital.com",
    },
    {
      id: "ADMIN002",
      name: "Sarah Johnson",
      role: "hospital_administrator",
      email: "admin2@hospital.com",
    },
    {
      id: "ADMIN003",
      name: "Mike Davis",
      role: "hospital_administrator",
      email: "admin3@hospital.com",
    },
    {
      id: "SUPPLY001",
      name: "Lisa Wilson",
      role: "supply_chain_officer",
      email: "supply@hospital.com",
    },
    {
      id: "SUPPLY002",
      name: "Tom Brown",
      role: "supply_chain_officer",
      email: "supply2@hospital.com",
    },
    {
      id: "SUPPLY003",
      name: "Emma Garcia",
      role: "supply_chain_officer",
      email: "supply3@hospital.com",
    },
    {
      id: "PHARM001",
      name: "Dr. Robert Lee",
      role: "pharmacist",
      email: "pharm@hospital.com",
    },
    {
      id: "PHARM002",
      name: "Nurse Jane Doe",
      role: "nurse",
      email: "nurse@hospital.com",
    },
    {
      id: "PHARM003",
      name: "Dr. Maria Rodriguez",
      role: "pharmacist",
      email: "pharm2@hospital.com",
    },
  ];

  // Sample inventory items
  const sampleItems = [
    {
      id: "ITEM001",
      name: "Paracetamol 500mg",
      description: "Pain relief medication",
      quantity: 500,
      category: "medication",
      unit: "tablets",
      expiry_date: "2025-12-31",
      supplier: "MedSupply Co.",
      cost_per_unit: 0.25,
    },
    {
      id: "ITEM002",
      name: "Surgical Gloves",
      description: "Disposable surgical gloves",
      quantity: 1000,
      category: "equipment",
      unit: "pairs",
      expiry_date: "2026-06-30",
      supplier: "MedEquip Inc.",
      cost_per_unit: 0.15,
    },
    {
      id: "ITEM003",
      name: "Bandages",
      description: "Sterile bandages for wound care",
      quantity: 200,
      category: "supplies",
      unit: "boxes",
      expiry_date: "2025-08-15",
      supplier: "HealthSupply Ltd.",
      cost_per_unit: 2.5,
    },
    {
      id: "ITEM004",
      name: "Insulin Vials",
      description: "Fast-acting insulin for diabetes",
      quantity: 50,
      category: "medication",
      unit: "vials",
      expiry_date: "2025-03-20",
      supplier: "PharmaCorp",
      cost_per_unit: 15.0,
    },
    {
      id: "ITEM005",
      name: "Syringes 10ml",
      description: "Sterile disposable syringes",
      quantity: 300,
      category: "equipment",
      unit: "pieces",
      expiry_date: "2026-01-10",
      supplier: "MedEquip Inc.",
      cost_per_unit: 0.75,
    },
  ];

  // Sample requests
  const sampleRequests = [
    {
      id: "REQ001",
      item_id: "ITEM001",
      requester_id: "PHARM001",
      quantity_requested: 50,
      status: "pending",
      request_date: new Date().toISOString(),
      department: "pharmacy",
    },
    {
      id: "REQ002",
      item_id: "ITEM002",
      requester_id: "PHARM002",
      quantity_requested: 100,
      status: "approved",
      request_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      approved_date: new Date().toISOString(),
      department: "emergency",
    },
  ];

  if (!supabase) {
    console.warn("Supabase not available, skipping sample data insertion");
    return { success: false, error: "Supabase not configured" };
  }

  try {
    // Insert sample users
    const { error: usersError } = await supabase
      .from("users")
      .upsert(sampleUsers, { onConflict: "id" });

    if (usersError) throw usersError;

    // Insert sample items
    const { error: itemsError } = await supabase
      .from("inventory_items")
      .upsert(sampleItems, { onConflict: "id" });

    if (itemsError) throw itemsError;

    // Insert sample requests
    const { error: requestsError } = await supabase
      .from("requests")
      .upsert(sampleRequests, { onConflict: "id" });

    if (requestsError) throw requestsError;

    console.log("Sample data inserted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error inserting sample data:", error);
    return { success: false, error };
  }
};
