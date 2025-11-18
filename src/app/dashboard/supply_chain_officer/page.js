"use client";

import { useState, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = "AIzaSyAZ4TMBO6PM1VMuJ7OT638zQp93aRjL37A";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const generateDescription = async () => {
  if (!formData.name.trim() || formData.name.length < 2) return;

  setIsGenerating(true);
  try {
    const description = await generateAIDescription(formData.name);
    setFormData((prev) => ({ ...prev, description }));
  } catch (error) {
    console.error("Failed to generate description:", error);
    // Fallback to basic description
    setFormData((prev) => ({
      ...prev,
      description: `Medical ${formData.name.toLowerCase()} for healthcare use`,
    }));
  } finally {
    setIsGenerating(false);
  }
};

// Force dynamic rendering to prevent prerendering issues
export const dynamic = "force-dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { inventoryService, requestService } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Edit,
  Package,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  CheckCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function SupplyChainOfficerDashboard() {
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    category: "",
    unit: "",
    expiry_date: "",
    supplier: "",
    cost_per_unit: "",
    min_threshold: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const generateAIDescription = async (itemName) => {
    try {
      const prompt = `Analyze this medical item name and provide: 
    1. A concise professional description (under 150 characters)
    2. The most appropriate category from: medication, equipment, supplies, diagnostic, surgical, protective, disposable

    Item: "${itemName}"
    
    Respond in this exact format:
    DESCRIPTION: [description here]
    CATEGORY: [category here]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const responseText = response.text.trim();

      // Parse the response to extract description and category
      const descriptionMatch = responseText.match(/DESCRIPTION:\s*(.+)/i);
      const categoryMatch = responseText.match(/CATEGORY:\s*(.+)/i);

      let description = `Medical ${itemName.toLowerCase()} for healthcare use`;
      let category = "supplies"; // default category

      if (descriptionMatch) {
        description = descriptionMatch[1].trim();
      }

      if (categoryMatch) {
        const detectedCategory = categoryMatch[1].trim().toLowerCase();
        // Validate the category is one of our options
        const validCategories = [
          "medication",
          "equipment",
          "supplies",
          "diagnostic",
          "surgical",
          "protective",
          "disposable",
        ];
        category = validCategories.includes(detectedCategory)
          ? detectedCategory
          : "supplies";
      }

      // Update both description and category in the form
      setFormData((prev) => ({
        ...prev,
        description,
        category,
      }));

      return description;
    } catch (error) {
      console.error("AI description generation failed:", error);
      throw error;
    }
  };

  // Load items from database
  useEffect(() => {
    loadItems();
  }, []);

  // Add this useEffect for auto-generating descriptions and categories
  useEffect(() => {
    const generateDescriptionAndCategory = async () => {
      if (!formData.name.trim() || formData.name.length < 2) return;

      setIsGenerating(true);
      try {
        await generateAIDescription(formData.name);
      } catch (error) {
        console.error("Failed to generate description and category:", error);
        // Fallback to basic description and default category
        setFormData((prev) => ({
          ...prev,
          description: `Medical ${formData.name.toLowerCase()} for healthcare use`,
          category: "supplies",
        }));
      } finally {
        setIsGenerating(false);
      }
    };

    // Add debounce to avoid too many API calls
    const timeoutId = setTimeout(generateDescriptionAndCategory, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  const loadData = async () => {
    await Promise.all([loadItems(), loadRequests()]);
  };

  const loadItems = async () => {
    const { data, error } = await inventoryService.getItems();
    if (error) {
      console.error("Error loading items:", error);
      setItems([]);
    } else {
      setItems(data || []);
    }
  };

  const loadRequests = async () => {
    const { data, error } = await requestService.getRequests();
    if (error) {
      console.error("Error loading requests:", error);
      setRequests([]);
    } else {
      // Process the data to ensure it has the required fields
      const processedRequests = (data || []).map((request) => {
        // If the data comes from Supabase with joins, extract the nested data
        if (
          request.inventory_items &&
          typeof request.inventory_items === "object"
        ) {
          request.item_name = request.inventory_items.name;
        }
        if (request.users && typeof request.users === "object") {
          request.requester_name = request.users.name;
        }

        // Ensure required fields exist
        return {
          id: request.id,
          item_id: request.item_id,
          item_name: request.item_name || `Item ${request.item_id}`,
          requester_name:
            request.requester_name || `User ${request.requester_id}`,
          quantity_requested: request.quantity_requested,
          status: request.status,
          request_date: request.request_date,
          department: request.department || "Unknown",
          ...request,
        };
      });
      setRequests(processedRequests);
    }
  };

  const handleAddItem = async () => {
    if (!formData.name || !formData.description || !formData.quantity) return;

    const newItem = {
      id: `ITEM${String(Date.now()).slice(-6)}`, // Generate unique ID
      name: formData.name,
      description: formData.description,
      quantity: parseInt(formData.quantity),
      category: formData.category,
      unit: formData.unit,
      expiry_date: formData.expiry_date,
      supplier: formData.supplier,
      cost_per_unit: parseFloat(formData.cost_per_unit),
      min_threshold: parseInt(formData.min_threshold),
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await inventoryService.addItem(newItem);

      if (error) {
        console.error("Error adding item:", error);
        alert("Failed to add item. Please try again.");
        return;
      }

      // Add to local state
      setItems([data[0], ...items]);

      // Reset form
      setFormData({
        name: "",
        description: "",
        quantity: "",
        category: "",
        unit: "",
        expiry_date: "",
        supplier: "",
        cost_per_unit: "",
        min_threshold: "",
      });
      setIsAddDialogOpen(false);

      alert("Item added successfully!");
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item. Please try again.");
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      quantity: item.quantity.toString(),
      category: item.category,
      unit: item.unit,
      expiry_date: item.expiry_date,
      supplier: item.supplier,
      cost_per_unit: item.cost_per_unit.toString(),
      min_threshold: item.min_threshold.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    const updatedItems = items.map((item) =>
      item.id === editingItem.id
        ? {
            ...item,
            ...formData,
            quantity: parseInt(formData.quantity),
            cost_per_unit: parseFloat(formData.cost_per_unit),
            min_threshold: parseInt(formData.min_threshold),
          }
        : item
    );

    setItems(updatedItems);
    setIsEditDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      quantity: "",
      category: "",
      unit: "",
      expiry_date: "",
      supplier: "",
      cost_per_unit: "",
      min_threshold: "",
    });
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const { error } = await requestService.updateRequestStatus(
        requestId,
        "approved"
      );

      if (error) {
        console.error("Error approving request:", error);
        alert("Failed to approve request. Please try again.");
        return;
      }

      // Update local state
      setRequests(
        requests.map((req) =>
          req.id === requestId ? { ...req, status: "approved" } : req
        )
      );

      alert("Request approved successfully!");
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const { error } = await requestService.updateRequestStatus(
        requestId,
        "rejected"
      );

      if (error) {
        console.error("Error rejecting request:", error);
        alert("Failed to reject request. Please try again.");
        return;
      }

      // Update local state
      setRequests(
        requests.map((req) =>
          req.id === requestId ? { ...req, status: "rejected" } : req
        )
      );

      alert("Request rejected successfully!");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "medication":
        return "bg-blue-100 text-blue-800";
      case "equipment":
        return "bg-green-100 text-green-800";
      case "supplies":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockStatus = (quantity, threshold) => {
    if (quantity < threshold)
      return { status: "Low Stock", color: "bg-red-100 text-red-800" };
    if (quantity < threshold * 1.5)
      return { status: "Medium", color: "bg-yellow-100 text-yellow-800" };
    return { status: "Good", color: "bg-green-100 text-green-800" };
  };

  const getRequestStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalItems = items.length;
  const lowStockItems = items.filter(
    (item) => item.quantity < item.min_threshold
  ).length;
  const pendingRequests = requests.filter(
    (req) => req.status === "pending"
  ).length;
  const totalValue = items.reduce(
    (sum, item) => sum + item.quantity * item.cost_per_unit,
    0
  );

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center justify-between lg:justify-start lg:space-x-4 w-full lg:w-auto">
            {/* Back to Role Selection Button */}
            <Link href="/" className="lg:flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Role Selection</span>
              </Button>
            </Link>
            {/* Title Section - Centered */}
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                Supply Chain Officer Dashboard
              </h1>
              <p className="text-slate-600 text-sm sm:text-lg">
                Manage procurement, inventory levels, and supply requests
              </p>
            </div>
          </div>
          {/* Stats on right - hidden on mobile, shown on desktop */}
          <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-sm text-slate-500">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingRequests}
              </p>
            </div>
          </div>
        </div>
        {/* Mobile Stats */}
        <div className="lg:hidden mt-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <p className="text-sm text-slate-500">Pending Requests</p>
            <p className="text-xl font-bold text-yellow-600">
              {pendingRequests}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingRequests}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total value</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {lowStockItems > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {lowStockItems} items are below their minimum threshold and need
            immediate restocking.
          </AlertDescription>
        </Alert>
      )}

      {pendingRequests > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {pendingRequests} requests are pending your approval.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">
          Supply Chain Management
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Add a new item to the inventory system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  {isGenerating && (
                    <span className="text-xs text-blue-500">
                      AI generating...
                    </span>
                  )}
                </div>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={
                    isGenerating
                      ? "Generating description..."
                      : "Auto-generated description"
                  }
                />
                <p className="text-xs text-gray-500">
                  Description auto-generates based on item name
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_threshold">Min Threshold</Label>
                  <Input
                    id="min_threshold"
                    type="number"
                    value={formData.min_threshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_threshold: e.target.value,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="tablets, boxes, etc."
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="category">Category</Label>
                    {isGenerating && (
                      <span className="text-xs text-blue-500">
                        AI detecting...
                      </span>
                    )}
                  </div>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {formData.category ? (
                      <span className="capitalize">{formData.category}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        {isGenerating
                          ? "Detecting category..."
                          : "Category will auto-detect"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Category automatically detected based on item name
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expiry_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_per_unit">Cost per Unit ($)</Label>
                  <Input
                    id="cost_per_unit"
                    type="number"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cost_per_unit: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                  placeholder="Supplier name"
                />
              </div>
              <Button onClick={handleAddItem} className="w-full">
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Requests */}
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-4 px-4 sm:px-6 pt-6">
          <CardTitle className="text-xl">Pending Requests</CardTitle>
          <CardDescription>
            Review and approve supply requests from staff
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 pb-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Request ID</TableHead>
                  <TableHead className="px-4">Item</TableHead>
                  <TableHead className="px-4">Requester</TableHead>
                  <TableHead className="px-4">Department</TableHead>
                  <TableHead className="px-4">Quantity</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests
                  .filter((req) => req.status === "pending")
                  .map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium px-4">
                        {request.id}
                      </TableCell>
                      <TableCell className="px-4">
                        {request.item_name}
                      </TableCell>
                      <TableCell className="px-4">
                        {request.requester_name}
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge variant="outline">{request.department}</Badge>
                      </TableCell>
                      <TableCell className="px-4">
                        {request.quantity_requested}
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge
                          className={getRequestStatusColor(request.status)}
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <span className="hidden sm:inline">Reject</span>
                            <span className="sm:hidden">X</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Items */}
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-4 px-4 sm:px-6 pt-6">
          <CardTitle className="text-xl">Inventory Items</CardTitle>
          <CardDescription>
            Manage inventory levels and thresholds
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 pb-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">ID</TableHead>
                  <TableHead className="px-4">Name</TableHead>
                  <TableHead className="px-4">Category</TableHead>
                  <TableHead className="px-4">Quantity</TableHead>
                  <TableHead className="px-4">Threshold</TableHead>
                  <TableHead className="px-4">Stock Status</TableHead>
                  <TableHead className="px-4">Supplier</TableHead>
                  <TableHead className="px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const stockStatus = getStockStatus(
                    item.quantity,
                    item.min_threshold
                  );
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium px-4">
                        {item.id}
                      </TableCell>
                      <TableCell className="px-4">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4">{item.quantity}</TableCell>
                      <TableCell className="px-4">
                        {item.min_threshold}
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge className={stockStatus.color}>
                          {stockStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4">{item.supplier}</TableCell>
                      <TableCell className="px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the details of this inventory item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Item name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Item description"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-min_threshold">Min Threshold</Label>
                <Input
                  id="edit-min_threshold"
                  type="number"
                  value={formData.min_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, min_threshold: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unit</Label>
                <Input
                  id="edit-unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="tablets, boxes, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="medication, equipment, supplies"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expiry_date">Expiry Date</Label>
                <Input
                  id="edit-expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cost_per_unit">Cost per Unit ($)</Label>
                <Input
                  id="edit-cost_per_unit"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, cost_per_unit: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-supplier">Supplier</Label>
              <Input
                id="edit-supplier"
                value={formData.supplier}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
                placeholder="Supplier name"
              />
            </div>
            <Button onClick={handleUpdateItem} className="w-full">
              Update Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
