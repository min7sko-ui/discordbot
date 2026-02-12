package com.min7sko.advancedorders;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.text.DecimalFormat;
import java.util.*;

public class GUIManager {
    
    private final AdvancedOrders plugin;
    private final Map<UUID, Integer> playerPages;
    private final Map<UUID, GUIContext> guiContexts;
    private static final int ITEMS_PER_PAGE = 45;
    private static final DecimalFormat df = new DecimalFormat("#.##");
    
    public GUIManager(AdvancedOrders plugin) {
        this.plugin = plugin;
        this.playerPages = new HashMap<>();
        this.guiContexts = new HashMap<>();
    }
    
    public void openOrdersGUI(Player player, int page) {
        List<Order> activeOrders = plugin.getOrderManager().getActiveOrders();
        int totalPages = (int) Math.ceil((double) activeOrders.size() / ITEMS_PER_PAGE);
        
        if (totalPages == 0) {
            totalPages = 1;
        }
        
        if (page < 0) {
            page = 0;
        } else if (page >= totalPages && activeOrders.size() > 0) {
            page = totalPages - 1;
        }
        
        playerPages.put(player.getUniqueId(), page);
        
        Inventory inv = Bukkit.createInventory(null, 54, 
            Component.text("Orders - Page " + (page + 1) + "/" + totalPages)
                .color(NamedTextColor.DARK_PURPLE)
                .decoration(TextDecoration.BOLD, true));
        
        int startIndex = page * ITEMS_PER_PAGE;
        int endIndex = Math.min(startIndex + ITEMS_PER_PAGE, activeOrders.size());
        
        for (int i = startIndex; i < endIndex; i++) {
            Order order = activeOrders.get(i);
            ItemStack item = createOrderItem(order);
            inv.setItem(i - startIndex, item);
        }
        
        if (page > 0) {
            ItemStack prevPage = createNavigationItem(Material.ARROW, "Previous Page", NamedTextColor.YELLOW);
            inv.setItem(48, prevPage);
        }
        
        if (page < totalPages - 1) {
            ItemStack nextPage = createNavigationItem(Material.ARROW, "Next Page", NamedTextColor.YELLOW);
            inv.setItem(50, nextPage);
        }
        
        ItemStack createOrder = createNavigationItem(Material.EMERALD, "Create Order", NamedTextColor.GREEN);
        inv.setItem(49, createOrder);
        
        ItemStack close = createNavigationItem(Material.BARRIER, "Close", NamedTextColor.RED);
        inv.setItem(53, close);
        
        player.openInventory(inv);
    }
    
    public void openCreateOrderGUI(Player player) {
        Inventory inv = Bukkit.createInventory(null, 27, 
            Component.text("Create Order - Select Item")
                .color(NamedTextColor.DARK_GREEN)
                .decoration(TextDecoration.BOLD, true));
        
        ItemStack placeHolder = createInfoItem(Material.PAPER, "Place Item Here", 
            NamedTextColor.AQUA, "Place the item you want to create an order for");
        inv.setItem(13, placeHolder);
        
        ItemStack cancel = createNavigationItem(Material.BARRIER, "Cancel", NamedTextColor.RED);
        inv.setItem(26, cancel);
        
        guiContexts.put(player.getUniqueId(), new GUIContext(GUIType.CREATE_ORDER_SELECT));
        player.openInventory(inv);
    }
    
    public void openQuantitySignGUI(Player player, Material material) {
        GUIContext context = new GUIContext(GUIType.CREATE_ORDER_QUANTITY);
        context.setMaterial(material);
        guiContexts.put(player.getUniqueId(), context);
        
        player.closeInventory();
        player.sendMessage(Component.text("Right-click a sign to enter the quantity of items you want to buy")
            .color(NamedTextColor.GREEN));
    }
    
    public void openPriceSignGUI(Player player) {
        GUIContext context = guiContexts.get(player.getUniqueId());
        if (context != null) {
            context.setType(GUIType.CREATE_ORDER_PRICE);
        }
        
        player.sendMessage(Component.text("Right-click a sign to enter the price per item")
            .color(NamedTextColor.GREEN));
    }
    
    public void openFulfillOrderGUI(Player player, Order order) {
        Inventory inv = Bukkit.createInventory(null, 27, 
            Component.text("Fulfill Order")
                .color(NamedTextColor.GOLD)
                .decoration(TextDecoration.BOLD, true));
        
        ItemStack orderDisplay = createOrderItem(order);
        inv.setItem(13, orderDisplay);
        
        ItemStack confirm = createNavigationItem(Material.EMERALD_BLOCK, "Confirm Fulfillment", NamedTextColor.GREEN);
        inv.setItem(11, confirm);
        
        ItemStack cancel = createNavigationItem(Material.REDSTONE_BLOCK, "Cancel", NamedTextColor.RED);
        inv.setItem(15, cancel);
        
        GUIContext context = new GUIContext(GUIType.FULFILL_ORDER);
        context.setOrderId(order.getOrderId());
        guiContexts.put(player.getUniqueId(), context);
        
        player.openInventory(inv);
    }
    
    private ItemStack createOrderItem(Order order) {
        ItemStack item = new ItemStack(order.getMaterial(), 1);
        ItemMeta meta = item.getItemMeta();
        
        meta.displayName(Component.text(order.getMaterial().name())
            .color(NamedTextColor.GOLD)
            .decoration(TextDecoration.ITALIC, false));
        
        List<Component> lore = new ArrayList<>();
        lore.add(Component.text("Creator: " + order.getCreatorName())
            .color(NamedTextColor.GRAY)
            .decoration(TextDecoration.ITALIC, false));
        lore.add(Component.text("Quantity: " + order.getQuantity())
            .color(NamedTextColor.WHITE)
            .decoration(TextDecoration.ITALIC, false));
        lore.add(Component.text("Price per item: $" + df.format(order.getPricePerItem()))
            .color(NamedTextColor.YELLOW)
            .decoration(TextDecoration.ITALIC, false));
        lore.add(Component.text("Total: $" + df.format(order.getTotalPrice()))
            .color(NamedTextColor.GREEN)
            .decoration(TextDecoration.ITALIC, false));
        lore.add(Component.empty());
        lore.add(Component.text("Click to fulfill")
            .color(NamedTextColor.AQUA)
            .decoration(TextDecoration.ITALIC, false));
        
        meta.lore(lore);
        item.setItemMeta(meta);
        
        return item;
    }
    
    private ItemStack createNavigationItem(Material material, String name, NamedTextColor color) {
        ItemStack item = new ItemStack(material);
        ItemMeta meta = item.getItemMeta();
        
        meta.displayName(Component.text(name)
            .color(color)
            .decoration(TextDecoration.ITALIC, false));
        
        item.setItemMeta(meta);
        return item;
    }
    
    private ItemStack createInfoItem(Material material, String name, NamedTextColor color, String description) {
        ItemStack item = new ItemStack(material);
        ItemMeta meta = item.getItemMeta();
        
        meta.displayName(Component.text(name)
            .color(color)
            .decoration(TextDecoration.ITALIC, false));
        
        if (description != null) {
            meta.lore(List.of(Component.text(description)
                .color(NamedTextColor.GRAY)
                .decoration(TextDecoration.ITALIC, false)));
        }
        
        item.setItemMeta(meta);
        return item;
    }
    
    public int getCurrentPage(UUID playerId) {
        return playerPages.getOrDefault(playerId, 0);
    }
    
    public GUIContext getContext(UUID playerId) {
        return guiContexts.get(playerId);
    }
    
    public void removeContext(UUID playerId) {
        guiContexts.remove(playerId);
    }
    
    public enum GUIType {
        MAIN_ORDERS,
        CREATE_ORDER_SELECT,
        CREATE_ORDER_QUANTITY,
        CREATE_ORDER_PRICE,
        FULFILL_ORDER
    }
    
    public static class GUIContext {
        private GUIType type;
        private Material material;
        private int quantity;
        private double price;
        private UUID orderId;
        
        public GUIContext(GUIType type) {
            this.type = type;
        }
        
        public GUIType getType() {
            return type;
        }
        
        public void setType(GUIType type) {
            this.type = type;
        }
        
        public Material getMaterial() {
            return material;
        }
        
        public void setMaterial(Material material) {
            this.material = material;
        }
        
        public int getQuantity() {
            return quantity;
        }
        
        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
        
        public double getPrice() {
            return price;
        }
        
        public void setPrice(double price) {
            this.price = price;
        }
        
        public UUID getOrderId() {
            return orderId;
        }
        
        public void setOrderId(UUID orderId) {
            this.orderId = orderId;
        }
    }
}
