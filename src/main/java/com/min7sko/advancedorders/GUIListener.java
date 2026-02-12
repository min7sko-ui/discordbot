package com.min7sko.advancedorders;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;

public class GUIListener implements Listener {
    
    private final AdvancedOrders plugin;
    
    public GUIListener(AdvancedOrders plugin) {
        this.plugin = plugin;
    }
    
    @EventHandler(priority = EventPriority.HIGHEST)
    public void onInventoryClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player)) {
            return;
        }
        
        Player player = (Player) event.getWhoClicked();
        String title = event.getView().title().toString();
        
        if (title.contains("Orders - Page")) {
            event.setCancelled(true);
            handleMainOrdersGUI(event, player);
        } else if (title.contains("Create Order - Select Item")) {
            handleCreateOrderSelectGUI(event, player);
        } else if (title.contains("Fulfill Order")) {
            event.setCancelled(true);
            handleFulfillOrderGUI(event, player);
        }
    }
    
    private void handleMainOrdersGUI(InventoryClickEvent event, Player player) {
        ItemStack clicked = event.getCurrentItem();
        if (clicked == null || clicked.getType() == Material.AIR) {
            return;
        }
        
        int slot = event.getSlot();
        
        if (slot == 48 && clicked.getType() == Material.ARROW) {
            int currentPage = plugin.getGuiManager().getCurrentPage(player.getUniqueId());
            plugin.getGuiManager().openOrdersGUI(player, currentPage - 1);
        } else if (slot == 50 && clicked.getType() == Material.ARROW) {
            int currentPage = plugin.getGuiManager().getCurrentPage(player.getUniqueId());
            plugin.getGuiManager().openOrdersGUI(player, currentPage + 1);
        } else if (slot == 49 && clicked.getType() == Material.EMERALD) {
            plugin.getGuiManager().openCreateOrderGUI(player);
        } else if (slot == 53 && clicked.getType() == Material.BARRIER) {
            player.closeInventory();
        } else if (slot < 45) {
            int currentPage = plugin.getGuiManager().getCurrentPage(player.getUniqueId());
            int orderIndex = currentPage * 45 + slot;
            
            java.util.List<Order> orders = plugin.getOrderManager().getActiveOrders();
            if (orderIndex < orders.size()) {
                Order order = orders.get(orderIndex);
                
                if (order.getCreatorId().equals(player.getUniqueId())) {
                    player.sendMessage(Component.text("You cannot fulfill your own order")
                        .color(NamedTextColor.RED));
                    return;
                }
                
                plugin.getGuiManager().openFulfillOrderGUI(player, order);
            }
        }
    }
    
    private void handleCreateOrderSelectGUI(InventoryClickEvent event, Player player) {
        int slot = event.getSlot();
        
        if (slot == 26) {
            event.setCancelled(true);
            player.closeInventory();
            plugin.getGuiManager().removeContext(player.getUniqueId());
            return;
        }
        
        if (slot == 13) {
            if (event.getCursor() != null && event.getCursor().getType() != Material.AIR) {
                event.setCancelled(true);
                Material material = event.getCursor().getType();
                
                player.closeInventory();
                plugin.getGuiManager().openQuantitySignGUI(player, material);
            } else if (event.getCurrentItem() != null && event.getCurrentItem().getType() != Material.AIR 
                       && event.getCurrentItem().getType() != Material.PAPER) {
                event.setCancelled(true);
                Material material = event.getCurrentItem().getType();
                
                player.closeInventory();
                plugin.getGuiManager().openQuantitySignGUI(player, material);
            }
        } else {
            event.setCancelled(true);
        }
    }
    
    private void handleFulfillOrderGUI(InventoryClickEvent event, Player player) {
        int slot = event.getSlot();
        GUIManager.GUIContext context = plugin.getGuiManager().getContext(player.getUniqueId());
        
        if (context == null || context.getOrderId() == null) {
            player.closeInventory();
            return;
        }
        
        Order order = plugin.getOrderManager().getOrder(context.getOrderId());
        if (order == null || !order.isActive()) {
            player.sendMessage(Component.text("This order is no longer available")
                .color(NamedTextColor.RED));
            player.closeInventory();
            plugin.getGuiManager().removeContext(player.getUniqueId());
            return;
        }
        
        if (slot == 11) {
            player.closeInventory();
            fulfillOrder(player, order);
        } else if (slot == 15) {
            player.closeInventory();
            plugin.getGuiManager().removeContext(player.getUniqueId());
        }
    }
    
    private void fulfillOrder(Player player, Order order) {
        if (!player.getInventory().containsAtLeast(new ItemStack(order.getMaterial()), order.getQuantity())) {
            player.sendMessage(Component.text("You don't have enough items to fulfill this order")
                .color(NamedTextColor.RED));
            plugin.getGuiManager().removeContext(player.getUniqueId());
            return;
        }
        
        synchronized (order) {
            Order freshOrder = plugin.getOrderManager().getOrder(order.getOrderId());
            if (freshOrder == null || !freshOrder.isActive()) {
                player.sendMessage(Component.text("This order is no longer available")
                    .color(NamedTextColor.RED));
                plugin.getGuiManager().removeContext(player.getUniqueId());
                return;
            }
            
            int removed = 0;
            for (ItemStack item : player.getInventory().getContents()) {
                if (item != null && item.getType() == order.getMaterial()) {
                    int amount = Math.min(item.getAmount(), order.getQuantity() - removed);
                    item.setAmount(item.getAmount() - amount);
                    removed += amount;
                    
                    if (removed >= order.getQuantity()) {
                        break;
                    }
                }
            }
            
            if (removed < order.getQuantity()) {
                player.sendMessage(Component.text("Failed to remove items from inventory")
                    .color(NamedTextColor.RED));
                plugin.getGuiManager().removeContext(player.getUniqueId());
                return;
            }
            
            double totalPrice = order.getTotalPrice();
            
            if (!plugin.getEconomy().has(Bukkit.getOfflinePlayer(order.getCreatorId()), totalPrice)) {
                for (int i = 0; i < removed; i++) {
                    player.getInventory().addItem(new ItemStack(order.getMaterial(), 1));
                }
                player.sendMessage(Component.text("The order creator doesn't have enough money")
                    .color(NamedTextColor.RED));
                plugin.getGuiManager().removeContext(player.getUniqueId());
                return;
            }
            
            plugin.getEconomy().withdrawPlayer(Bukkit.getOfflinePlayer(order.getCreatorId()), totalPrice);
            plugin.getEconomy().depositPlayer(player, totalPrice);
            
            freshOrder.setActive(false);
            plugin.getOrderManager().updateOrder(freshOrder);
            
            player.sendMessage(Component.text("Successfully fulfilled order! Received $" + String.format("%.2f", totalPrice))
                .color(NamedTextColor.GREEN));
            
            Player creator = Bukkit.getPlayer(order.getCreatorId());
            if (creator != null && creator.isOnline()) {
                creator.sendMessage(Component.text("Your order for " + order.getQuantity() + "x " + 
                    order.getMaterial().name() + " has been fulfilled by " + player.getName())
                    .color(NamedTextColor.GREEN));
            }
        }
        
        plugin.getGuiManager().removeContext(player.getUniqueId());
    }
    
    @EventHandler
    public void onInventoryClose(InventoryCloseEvent event) {
        if (!(event.getPlayer() instanceof Player)) {
            return;
        }
        
        Player player = (Player) event.getPlayer();
        String title = event.getView().title().toString();
        
        if (title.contains("Create Order - Select Item")) {
            Inventory inv = event.getInventory();
            ItemStack item = inv.getItem(13);
            
            if (item != null && item.getType() != Material.AIR && item.getType() != Material.PAPER) {
                player.getInventory().addItem(item);
            }
        }
    }
}
