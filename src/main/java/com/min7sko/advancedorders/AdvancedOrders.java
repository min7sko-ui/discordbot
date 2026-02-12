package com.min7sko.advancedorders;

import net.milkbowl.vault.economy.Economy;
import org.bukkit.plugin.RegisteredServiceProvider;
import org.bukkit.plugin.java.JavaPlugin;

public class AdvancedOrders extends JavaPlugin {
    
    private static AdvancedOrders instance;
    private Economy economy;
    private OrderManager orderManager;
    private GUIManager guiManager;
    
    @Override
    public void onEnable() {
        instance = this;
        
        if (!setupEconomy()) {
            getLogger().severe("Vault not found! Plugin disabled.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }
        
        saveDefaultConfig();
        
        orderManager = new OrderManager(this);
        guiManager = new GUIManager(this);
        
        getCommand("orders").setExecutor(new OrdersCommand(this));
        
        getServer().getPluginManager().registerEvents(new GUIListener(this), this);
        getServer().getPluginManager().registerEvents(new SignListener(this), this);
        
        getLogger().info("AdvancedOrders has been enabled!");
    }
    
    @Override
    public void onDisable() {
        if (orderManager != null) {
            orderManager.saveOrders();
        }
        getLogger().info("AdvancedOrders has been disabled!");
    }
    
    private boolean setupEconomy() {
        if (getServer().getPluginManager().getPlugin("Vault") == null) {
            return false;
        }
        RegisteredServiceProvider<Economy> rsp = getServer().getServicesManager().getRegistration(Economy.class);
        if (rsp == null) {
            return false;
        }
        economy = rsp.getProvider();
        return economy != null;
    }
    
    public static AdvancedOrders getInstance() {
        return instance;
    }
    
    public Economy getEconomy() {
        return economy;
    }
    
    public OrderManager getOrderManager() {
        return orderManager;
    }
    
    public GUIManager getGuiManager() {
        return guiManager;
    }
}
