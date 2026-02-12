package com.min7sko.advancedorders;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;

public class OrdersCommand implements CommandExecutor {
    
    private final AdvancedOrders plugin;
    
    public OrdersCommand(AdvancedOrders plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage(Component.text("This command can only be used by players")
                .color(NamedTextColor.RED));
            return true;
        }
        
        Player player = (Player) sender;
        
        if (!player.hasPermission("advancedorders.use")) {
            player.sendMessage(Component.text("You don't have permission to use this command")
                .color(NamedTextColor.RED));
            return true;
        }
        
        plugin.getGuiManager().openOrdersGUI(player, 0);
        return true;
    }
}
