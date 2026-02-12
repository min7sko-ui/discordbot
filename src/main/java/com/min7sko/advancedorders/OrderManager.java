package com.min7sko.advancedorders;

import org.bukkit.Material;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.YamlConfiguration;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class OrderManager {
    
    private final AdvancedOrders plugin;
    private final Map<UUID, Order> orders;
    private final ReentrantReadWriteLock lock;
    private final File ordersFile;
    
    public OrderManager(AdvancedOrders plugin) {
        this.plugin = plugin;
        this.orders = new ConcurrentHashMap<>();
        this.lock = new ReentrantReadWriteLock();
        this.ordersFile = new File(plugin.getDataFolder(), "orders.yml");
        
        loadOrders();
    }
    
    public void createOrder(Order order) {
        lock.writeLock().lock();
        try {
            orders.put(order.getOrderId(), order);
            saveOrders();
        } finally {
            lock.writeLock().unlock();
        }
    }
    
    public void removeOrder(UUID orderId) {
        lock.writeLock().lock();
        try {
            orders.remove(orderId);
            saveOrders();
        } finally {
            lock.writeLock().unlock();
        }
    }
    
    public Order getOrder(UUID orderId) {
        lock.readLock().lock();
        try {
            return orders.get(orderId);
        } finally {
            lock.readLock().unlock();
        }
    }
    
    public List<Order> getActiveOrders() {
        lock.readLock().lock();
        try {
            List<Order> activeOrders = new ArrayList<>();
            for (Order order : orders.values()) {
                if (order.isActive()) {
                    activeOrders.add(order);
                }
            }
            return activeOrders;
        } finally {
            lock.readLock().unlock();
        }
    }
    
    public void updateOrder(Order order) {
        lock.writeLock().lock();
        try {
            orders.put(order.getOrderId(), order);
            saveOrders();
        } finally {
            lock.writeLock().unlock();
        }
    }
    
    public void saveOrders() {
        lock.readLock().lock();
        try {
            YamlConfiguration config = new YamlConfiguration();
            
            for (Map.Entry<UUID, Order> entry : orders.entrySet()) {
                Order order = entry.getValue();
                String path = "orders." + order.getOrderId().toString();
                
                config.set(path + ".creatorId", order.getCreatorId().toString());
                config.set(path + ".creatorName", order.getCreatorName());
                config.set(path + ".material", order.getMaterial().name());
                config.set(path + ".quantity", order.getQuantity());
                config.set(path + ".pricePerItem", order.getPricePerItem());
                config.set(path + ".createdTime", order.getCreatedTime());
                config.set(path + ".active", order.isActive());
            }
            
            if (!ordersFile.getParentFile().exists()) {
                ordersFile.getParentFile().mkdirs();
            }
            
            config.save(ordersFile);
        } catch (IOException e) {
            plugin.getLogger().severe("Failed to save orders: " + e.getMessage());
        } finally {
            lock.readLock().unlock();
        }
    }
    
    private void loadOrders() {
        if (!ordersFile.exists()) {
            return;
        }
        
        lock.writeLock().lock();
        try {
            YamlConfiguration config = YamlConfiguration.loadConfiguration(ordersFile);
            ConfigurationSection ordersSection = config.getConfigurationSection("orders");
            
            if (ordersSection == null) {
                return;
            }
            
            for (String key : ordersSection.getKeys(false)) {
                try {
                    UUID orderId = UUID.fromString(key);
                    UUID creatorId = UUID.fromString(ordersSection.getString(key + ".creatorId"));
                    String creatorName = ordersSection.getString(key + ".creatorName");
                    Material material = Material.valueOf(ordersSection.getString(key + ".material"));
                    int quantity = ordersSection.getInt(key + ".quantity");
                    double pricePerItem = ordersSection.getDouble(key + ".pricePerItem");
                    long createdTime = ordersSection.getLong(key + ".createdTime");
                    boolean active = ordersSection.getBoolean(key + ".active");
                    
                    Order order = new Order(orderId, creatorId, creatorName, material, quantity, 
                                          pricePerItem, createdTime, active);
                    orders.put(orderId, order);
                } catch (Exception e) {
                    plugin.getLogger().warning("Failed to load order " + key + ": " + e.getMessage());
                }
            }
            
            plugin.getLogger().info("Loaded " + orders.size() + " orders");
        } finally {
            lock.writeLock().unlock();
        }
    }
}
