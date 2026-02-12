package com.min7sko.advancedorders;

import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;

import java.util.UUID;

public class Order {
    
    private final UUID orderId;
    private final UUID creatorId;
    private final String creatorName;
    private final Material material;
    private int quantity;
    private final double pricePerItem;
    private final long createdTime;
    private boolean active;
    
    public Order(UUID creatorId, String creatorName, Material material, int quantity, double pricePerItem) {
        this.orderId = UUID.randomUUID();
        this.creatorId = creatorId;
        this.creatorName = creatorName;
        this.material = material;
        this.quantity = quantity;
        this.pricePerItem = pricePerItem;
        this.createdTime = System.currentTimeMillis();
        this.active = true;
    }
    
    public Order(UUID orderId, UUID creatorId, String creatorName, Material material, int quantity, 
                 double pricePerItem, long createdTime, boolean active) {
        this.orderId = orderId;
        this.creatorId = creatorId;
        this.creatorName = creatorName;
        this.material = material;
        this.quantity = quantity;
        this.pricePerItem = pricePerItem;
        this.createdTime = createdTime;
        this.active = active;
    }
    
    public UUID getOrderId() {
        return orderId;
    }
    
    public UUID getCreatorId() {
        return creatorId;
    }
    
    public String getCreatorName() {
        return creatorName;
    }
    
    public Material getMaterial() {
        return material;
    }
    
    public int getQuantity() {
        return quantity;
    }
    
    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
    
    public double getPricePerItem() {
        return pricePerItem;
    }
    
    public double getTotalPrice() {
        return pricePerItem * quantity;
    }
    
    public long getCreatedTime() {
        return createdTime;
    }
    
    public boolean isActive() {
        return active;
    }
    
    public void setActive(boolean active) {
        this.active = active;
    }
    
    public ItemStack toItemStack() {
        return new ItemStack(material, 1);
    }
}
