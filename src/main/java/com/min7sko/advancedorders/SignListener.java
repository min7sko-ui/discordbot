package com.min7sko.advancedorders;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.block.Sign;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.player.PlayerInteractEvent;

public class SignListener implements Listener {
    
    private final AdvancedOrders plugin;
    
    public SignListener(AdvancedOrders plugin) {
        this.plugin = plugin;
    }
    
    @EventHandler
    public void onSignClick(PlayerInteractEvent event) {
        if (event.getAction() != Action.RIGHT_CLICK_BLOCK) {
            return;
        }
        
        Block block = event.getClickedBlock();
        if (block == null || !(block.getState() instanceof Sign)) {
            return;
        }
        
        Player player = event.getPlayer();
        GUIManager.GUIContext context = plugin.getGuiManager().getContext(player.getUniqueId());
        
        if (context == null) {
            return;
        }
        
        event.setCancelled(true);
        
        Sign sign = (Sign) block.getState();
        
        if (context.getType() == GUIManager.GUIType.CREATE_ORDER_QUANTITY) {
            handleQuantityInput(player, sign, context);
        } else if (context.getType() == GUIManager.GUIType.CREATE_ORDER_PRICE) {
            handlePriceInput(player, sign, context);
        }
    }
    
    private void handleQuantityInput(Player player, Sign sign, GUIManager.GUIContext context) {
        String line = sign.line(0).toString();
        
        try {
            int quantity = Integer.parseInt(line.replaceAll("[^0-9]", ""));
            
            if (quantity <= 0) {
                player.sendMessage(Component.text("Quantity must be greater than 0")
                    .color(NamedTextColor.RED));
                return;
            }
            
            if (quantity > 999999) {
                player.sendMessage(Component.text("Quantity is too large (max: 999999)")
                    .color(NamedTextColor.RED));
                return;
            }
            
            context.setQuantity(quantity);
            plugin.getGuiManager().openPriceSignGUI(player);
            
        } catch (NumberFormatException e) {
            player.sendMessage(Component.text("Invalid number format. Please enter a valid quantity")
                .color(NamedTextColor.RED));
        }
    }
    
    private void handlePriceInput(Player player, Sign sign, GUIManager.GUIContext context) {
        String line = sign.line(0).toString();
        
        try {
            String priceStr = line.replaceAll("[^0-9.]", "");
            double price = Double.parseDouble(priceStr);
            
            if (price <= 0) {
                player.sendMessage(Component.text("Price must be greater than 0")
                    .color(NamedTextColor.RED));
                return;
            }
            
            if (price > 999999999) {
                player.sendMessage(Component.text("Price is too large")
                    .color(NamedTextColor.RED));
                return;
            }
            
            context.setPrice(price);
            
            double totalPrice = price * context.getQuantity();
            
            if (!plugin.getEconomy().has(player, totalPrice)) {
                player.sendMessage(Component.text("You don't have enough money to create this order ($" + 
                    String.format("%.2f", totalPrice) + " required)")
                    .color(NamedTextColor.RED));
                plugin.getGuiManager().removeContext(player.getUniqueId());
                return;
            }
            
            Order order = new Order(
                player.getUniqueId(),
                player.getName(),
                context.getMaterial(),
                context.getQuantity(),
                price
            );
            
            plugin.getOrderManager().createOrder(order);
            
            player.sendMessage(Component.text("Order created successfully!")
                .color(NamedTextColor.GREEN));
            player.sendMessage(Component.text("Item: " + context.getMaterial().name())
                .color(NamedTextColor.GRAY));
            player.sendMessage(Component.text("Quantity: " + context.getQuantity())
                .color(NamedTextColor.GRAY));
            player.sendMessage(Component.text("Price per item: $" + String.format("%.2f", price))
                .color(NamedTextColor.GRAY));
            player.sendMessage(Component.text("Total: $" + String.format("%.2f", totalPrice))
                .color(NamedTextColor.GRAY));
            
            plugin.getGuiManager().removeContext(player.getUniqueId());
            
            Bukkit.getScheduler().runTaskLater(plugin, () -> {
                plugin.getGuiManager().openOrdersGUI(player, 0);
            }, 20L);
            
        } catch (NumberFormatException e) {
            player.sendMessage(Component.text("Invalid price format. Please enter a valid price")
                .color(NamedTextColor.RED));
        }
    }
}
